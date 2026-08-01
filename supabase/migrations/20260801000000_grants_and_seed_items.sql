-- =============================================================
-- Cozaria Phase 3 — Add missing GRANTs + seed shop items
-- =============================================================

-- ─── GRANTs for Phase 0 tables (missing from initial migration) ──

-- profiles: authenticated reads/updates own row via RLS
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;

-- wallets: authenticated reads own; service_role writes via Edge Functions
grant select on public.wallets to authenticated;
grant select, insert, update, delete on public.wallets to service_role;

-- reviewers: authenticated full CRUD on own rows via RLS
grant select, insert, update, delete on public.reviewers to authenticated;
grant select, insert, update, delete on public.reviewers to service_role;

-- cards: authenticated full CRUD (ownership via parent reviewer RLS)
grant select, insert, update, delete on public.cards to authenticated;
grant select, insert, update, delete on public.cards to service_role;

-- card_reviews: authenticated reads own; service_role writes via Edge Functions
grant select on public.card_reviews to authenticated;
grant select, insert, update, delete on public.card_reviews to service_role;

-- items: authenticated reads; service_role manages
grant select on public.items to authenticated;
grant select, insert, update, delete on public.items to service_role;

-- owned_items: authenticated reads own; service_role writes via Edge Functions
grant select on public.owned_items to authenticated;
grant select, insert, update, delete on public.owned_items to service_role;

-- ─── Seed shop items ────────────────────────────────────────────

insert into public.items (name, description, price, sprite_key, category) values
  ('Wooden Desk',       'A sturdy oak desk for studying.',          100, 'desk_01',       'furniture'),
  ('Cozy Armchair',     'Sink in and read for hours.',              150, 'armchair_01',   'furniture'),
  ('Bookshelf',         'Tall shelf to display your tomes.',        200, 'bookshelf_01',  'furniture'),
  ('Desk Lamp',         'Warm light for late-night sessions.',       75, 'lamp_01',       'lighting'),
  ('Candle Set',        'Flickering candles for ambiance.',          50, 'candles_01',    'lighting'),
  ('Globe',             'Spin it and dream of faraway places.',     120, 'globe_01',      'decor'),
  ('Potted Fern',       'A little green friend for your room.',      60, 'fern_01',       'decor'),
  ('Wall Tapestry',     'Woven scenes of ancient libraries.',       250, 'tapestry_01',   'decor'),
  ('Treasure Chest',    'Where scholars keep their secrets.',       350, 'chest_01',      'storage'),
  ('Crystal Orb',       'Mysterious glow. Purely decorative.',      500, 'orb_01',        'rare');
