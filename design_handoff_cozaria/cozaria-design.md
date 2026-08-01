# Cozaria — Design & Logic Handoff

## Overview
Cozaria is a cozy gamified study app: students create flashcards/reviewers, run focused study sessions, earn coins, and spend them decorating a personal pixel-art study room. This doc is for Claude Code / engineering to implement the real app (data model, coin economy, security, backend) behind the HTML UI references in this bundle.

## About the design files
`Cozaria.dc.html` (mobile) and `Cozaria Desktop.dc.html` (desktop/web) are **HTML design references** — high-fidelity visual + interaction prototypes, not production code. Recreate them in whatever stack the target codebase uses (React/Next, SwiftUI, etc.), using its existing patterns. Treat colors, type, spacing, and copy below as final; treat the coin/security/architecture sections as **proposed defaults**, not agreed specs — confirm/adjust with the product owner before building.

## Fidelity
High-fidelity. Pixel-perfect colors, typography, spacing, and states are final. Backend/logic sections below were not discussed in the design conversation and are reasonable proposals only.

---

## 1. Concept
- Core loop: **Study → earn coins → decorate room → stay motivated to study more.**
- Primary entities: User, Deck, Card (flashcard), StudySession (Focus session), Room, Item (owned decor), ShopItem (catalog), Pet (companion, cosmetic/state only).
- Daily goal + streak drive retention; coins are the single currency (no gems/premium currency in v1).

## 2. Screens (see HTML files for exact visuals)
| Screen | Purpose | Key state |
|---|---|---|
| Home / World | Room centerpiece, coin balance, daily goal, quests, nav | coins, dailyGoalProgress, quests[], activePet |
| Focus session | Timer-driven study block, focused + paused states | sessionId, remainingSeconds, status (focused/paused/distracted), earnedCoinsThisSession |
| Shop | Browse/buy decor for room | catalog[], ownedItemIds[], coins |
| Reviewer/Flashcard | Spaced-repetition review of a deck | deckId, cardIndex, cardsDueToday, rating (again/good/easy) |

## 3. Coin formula (PROPOSED — confirm before building)
```
coins_earned_per_session =
    floor(focused_minutes) * BASE_RATE_PER_MIN      // BASE_RATE_PER_MIN = 2
  + STREAK_BONUS(current_streak_days)               // +10% per day, cap +100% at 10 days
  + FIRST_SESSION_OF_DAY_BONUS (flat +15)
  - DISTRACTION_PENALTY (−1 coin per minute paused, floor 0)
```
- Coins are credited **only server-side**, only when a session is marked `completed` (not `abandoned`), and only for time verified by server-side elapsed timestamps (never client-reported duration alone — client sends heartbeats; server computes actual elapsed).
- Flashcard review rewards: flat **+2 coins per card reviewed**, **+5 bonus** for finishing all due cards in a deck, capped at **50 coins/day** from review alone to prevent grinding exploits.
- Daily coin ceiling from Focus sessions: **300 coins/day** (soft cap, configurable) to bound the economy.
- All formulas/constants should live in one server-side config table (`economy_config`), not hardcoded, so they can be tuned without a redeploy.

## 4. Security model (PROPOSED)
- **Never trust client-submitted coin deltas.** Client sends *events* (`session_started`, `heartbeat`, `session_completed`, `card_reviewed`), never a `coins += N` mutation directly.
- All coin balance changes happen inside a single server-side transaction (Edge Function or DB function) that: validates the event against session state, computes the delta from the formula above, and writes an immutable `coin_ledger` row (append-only) + updates the cached `profiles.coin_balance`.
- `coin_balance` on `profiles` is a **derived cache**, recomputable at any time as `SUM(coin_ledger.delta) WHERE user_id = ...` — treat the ledger as source of truth, not the cached column.
- Rate-limit `session_completed` and `card_reviewed` events per user (e.g., max 1 completed session per 20 real minutes) to blunt scripted abuse.
- Shop purchases are also server-validated transactions: check `coin_balance >= price` and item not already owned, inside one atomic function — never decrement coins from the client.

## 5. Database schema (proposed, Postgres/Supabase-flavored)
```sql
profiles(id uuid pk, username text, coin_balance int default 0, streak_days int default 0,
          last_study_date date, created_at timestamptz)

decks(id uuid pk, owner_id uuid fk->profiles, title text, created_at timestamptz)

cards(id uuid pk, deck_id uuid fk->decks, front text, back text,
      due_at timestamptz, ease_factor float default 2.5, interval_days int default 1)

study_sessions(id uuid pk, user_id uuid fk->profiles, deck_id uuid fk->decks null,
                started_at timestamptz, ended_at timestamptz null,
                status text check (status in ('active','completed','abandoned')),
                distraction_seconds int default 0)

coin_ledger(id bigserial pk, user_id uuid fk->profiles, delta int, reason text,
            ref_type text, ref_id uuid, created_at timestamptz)  -- append-only, source of truth

shop_items(id uuid pk, name text, category text, price int, asset_key text, active bool default true)

owned_items(user_id uuid fk->profiles, item_id uuid fk->shop_items, acquired_at timestamptz,
             primary key (user_id, item_id))

room_layout(user_id uuid pk fk->profiles, placed_items jsonb)  -- {item_id: {x,y,rotation}}
```

## 6. Row-Level Security policies (proposed, Supabase-style)
```sql
-- profiles: users read/update only their own row; coin_balance NEVER updatable by client
alter table profiles enable row level security;
create policy "read own profile" on profiles for select using (auth.uid() = id);
create policy "update own non-coin fields" on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id); -- pair with a trigger (below) that rejects coin_balance changes not from service role

-- decks / cards: owner-only CRUD
create policy "own decks" on decks for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "cards via owned deck" on cards for all
  using (exists (select 1 from decks d where d.id = deck_id and d.owner_id = auth.uid()));

-- study_sessions: owner-only, but INSERT/UPDATE of status→'completed' only allowed via Edge Function (service role), not direct client write
create policy "read own sessions" on study_sessions for select using (auth.uid() = user_id);
create policy "create own session" on study_sessions for insert with check (auth.uid() = user_id);
-- no client UPDATE policy on study_sessions.status = 'completed' — must go through service-role Edge Function

-- coin_ledger: read-only to client, INSERT only via service role (Edge Functions), never from anon/authenticated key
create policy "read own ledger" on coin_ledger for select using (auth.uid() = user_id);
-- (no insert/update/delete policy for authenticated role — service role bypasses RLS)

-- shop_items: public read
create policy "public read shop" on shop_items for select using (true);

-- owned_items: read own; INSERT only via service-role purchase function
create policy "read own inventory" on owned_items for select using (auth.uid() = user_id);

-- room_layout: owner read/write (placement is cosmetic-only, safe for direct client writes)
create policy "own room" on room_layout for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```
- Add a Postgres trigger on `profiles` that raises an exception if `coin_balance` is changed by any role other than `service_role`, as defense-in-depth beyond RLS.

## 7. Edge Functions (proposed)
| Function | Trigger | Responsibility |
|---|---|---|
| `session-start` | client calls on Focus session start | creates `study_sessions` row, status `active` |
| `session-heartbeat` | client pings every ~30s while focused | updates `ended_at` watermark; flips to track distraction time if app backgrounded |
| `session-complete` | client calls on session end/give-up | computes elapsed time server-side from timestamps (not client-claimed duration), applies coin formula, writes `coin_ledger` entry, updates `profiles.coin_balance` + `streak_days`, marks session `completed` — all in one transaction |
| `card-review` | client submits a rating (again/good/easy) | updates card's spaced-repetition schedule (`due_at`, `ease_factor`, `interval_days`), credits review coins to ledger (respecting daily cap), enforces rate limit |
| `shop-purchase` | client clicks Buy | atomically checks balance + ownership, inserts `owned_items`, writes negative `coin_ledger` entry |
| `daily-reset` (cron) | nightly | evaluates streak continuation/breakage based on `last_study_date` |

## 8. State management (client)
- `coin_balance`, `streak_days`: read from `profiles`, refreshed after any Edge Function call — never optimistically incremented by formula guesses; show optimistic UI only as a "pending" shimmer, then reconcile with server response.
- Focus session: local countdown timer for display only; source of truth is server elapsed time returned by `session-heartbeat`/`session-complete`.
- Shop: optimistic "Owned" flip only after `shop-purchase` resolves successfully; roll back UI on failure (insufficient funds race condition).

## 9. Design tokens
Colors: `#6E4527` (deep wood), `#3A2416` (dark wood/borders), `#8A5A35` (light wood trim), `#9C3A2B` (mahogany), `#E0A53B` (gold), `#F4D58A` (lamp glow), `#EFD9AE` / `#F6E8C8` (parchment), `#A9774B` (brick), `#4374A0` (book blue), `#5E8C46` (plant green), `#F3E3C4` (light text).
Type: Pixelify Sans (UI/headings/coins), Nunito (flashcard/study body text). Never below 24px on any primary numeral (timer, coin count).
Chrome: 2–4px hard pixel borders in `#3A2416`, carved-wood bevel via inset box-shadow (light top/left, dark bottom/right), no blur/soft shadows.

## 10. Assets
- Room background: user-supplied reference image, `assets/room.png` in this bundle.
- All icons (coins, books, pets, furniture) are hand-built inline pixel SVGs in the HTML — swap for a real sprite sheet (e.g., LimeZu Modern Interiors) if licensed art is available.

## Files in this bundle
- `Cozaria.dc.html` — mobile UI reference (identity board + 5 screens)
- `Cozaria Desktop.dc.html` — desktop/web UI reference (identity board + 5 screens)
- `assets/room.png` — room background art
