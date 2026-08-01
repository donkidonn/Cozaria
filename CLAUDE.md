# Cozaria

Cozy gamified study app — pixel-art, warm wooden library vibe. Users create flashcard reviewers, study them, and earn coins to decorate a cozy room.

## Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS v4
- **Backend**: Supabase (Postgres + Auth + Edge Functions)
- **Fonts**: "Pixelify Sans" (headings/UI), "Nunito" (body/study text)

## Project structure

```
src/
  features/       # Feature-based modules (auth, dashboard, reviewers, shop, world)
  components/ui/  # Shared UI components
  lib/             # Supabase client, utilities
supabase/
  migrations/      # SQL migrations
```

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npx tsc --noEmit` — type-check

## Conventions

- Use named Cozaria palette tokens from Tailwind theme (e.g. `text-gold`, `bg-wood-dark`). Never hardcode hex values.
- Use `font-heading` for headings/UI, `font-body` for body text.
- RLS is on every table. Wallets, owned_items, and card_reviews are read-only from the client — writes go through Edge Functions with service_role.
- The `handle_new_user` trigger auto-creates profiles + wallets rows on signup.
- Coin awards go through the `award-coins` Edge Function. Correct = +2, Wrong = +1, daily dedup per card.
- WalletContext provides balance + setBalance across the app. Updated from Edge Function responses.
