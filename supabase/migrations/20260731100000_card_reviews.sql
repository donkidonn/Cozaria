-- =============================================================
-- Cozaria Phase 2 — card_reviews table
-- =============================================================

-- Ensure authenticated role can use the public schema
grant usage on schema public to authenticated;

-- ─── CARD REVIEWS ────────────────────────────────────────────
create table public.card_reviews (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  card_id        uuid not null references public.cards on delete cascade,
  was_correct    boolean not null,
  coins_awarded  int not null default 0,
  reviewed_at    timestamptz not null default now()
);

alter table public.card_reviews enable row level security;

-- Users can read their own reviews only.
create policy "Users can read own reviews"
  on public.card_reviews for select
  to authenticated
  using (auth.uid() = user_id);

-- No insert / update / delete policies for the client.
-- Reviews are written by the award-coins Edge Function using service_role.

-- Grant select so RLS policies can be evaluated by the authenticated role.
grant select on public.card_reviews to authenticated;

-- Index for the daily-dedup check in the Edge Function
create index idx_card_reviews_dedup
  on public.card_reviews (user_id, card_id, reviewed_at);
