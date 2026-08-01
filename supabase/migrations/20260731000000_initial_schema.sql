-- =============================================================
-- Cozaria Phase 0 — Initial Schema
-- =============================================================

-- ─── PROFILES ────────────────────────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  username     text,
  display_name text,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No insert policy — rows are created by the trigger below.

-- ─── WALLETS ─────────────────────────────────────────────────
create table public.wallets (
  user_id    uuid primary key references auth.users on delete cascade,
  balance    int  not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

alter table public.wallets enable row level security;

create policy "Users can read own wallet"
  on public.wallets for select
  to authenticated
  using (auth.uid() = user_id);

-- No insert / update / delete policies.
-- Balance changes happen via Edge Functions using service_role.

-- ─── REVIEWERS ───────────────────────────────────────────────
create table public.reviewers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  title       text not null,
  description text,
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.reviewers enable row level security;

create policy "Users can read own or public reviewers"
  on public.reviewers for select
  to authenticated
  using (auth.uid() = user_id or is_public = true);

create policy "Users can insert own reviewers"
  on public.reviewers for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own reviewers"
  on public.reviewers for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own reviewers"
  on public.reviewers for delete
  to authenticated
  using (auth.uid() = user_id);

-- ─── CARDS ───────────────────────────────────────────────────
create table public.cards (
  id          uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.reviewers on delete cascade,
  front       text not null,
  back        text not null,
  hint        text,
  position    int  not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.cards enable row level security;

-- Ownership is checked through the parent reviewer.
create policy "Users can read cards of own or public reviewers"
  on public.cards for select
  to authenticated
  using (
    exists (
      select 1 from public.reviewers r
      where r.id = reviewer_id
        and (r.user_id = auth.uid() or r.is_public = true)
    )
  );

create policy "Users can insert cards into own reviewers"
  on public.cards for insert
  to authenticated
  with check (
    exists (
      select 1 from public.reviewers r
      where r.id = reviewer_id
        and r.user_id = auth.uid()
    )
  );

create policy "Users can update cards in own reviewers"
  on public.cards for update
  to authenticated
  using (
    exists (
      select 1 from public.reviewers r
      where r.id = reviewer_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.reviewers r
      where r.id = reviewer_id
        and r.user_id = auth.uid()
    )
  );

create policy "Users can delete cards in own reviewers"
  on public.cards for delete
  to authenticated
  using (
    exists (
      select 1 from public.reviewers r
      where r.id = reviewer_id
        and r.user_id = auth.uid()
    )
  );

-- ─── ITEMS ───────────────────────────────────────────────────
create table public.items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  price       int  not null check (price >= 0),
  sprite_key  text,
  category    text,
  created_at  timestamptz not null default now()
);

alter table public.items enable row level security;

create policy "Authenticated users can read items"
  on public.items for select
  to authenticated
  using (true);

-- No client write policies. Items are managed by admins / seeds.

-- ─── OWNED ITEMS ─────────────────────────────────────────────
create table public.owned_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  item_id     uuid not null references public.items on delete cascade,
  acquired_at timestamptz not null default now(),
  placement   jsonb,
  unique (user_id, item_id)
);

alter table public.owned_items enable row level security;

create policy "Users can read own items"
  on public.owned_items for select
  to authenticated
  using (auth.uid() = user_id);

-- No client insert / update / delete. Purchases go through Edge Functions.

-- ─── TRIGGER: auto-create profile + wallet on signup ─────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.wallets  (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
