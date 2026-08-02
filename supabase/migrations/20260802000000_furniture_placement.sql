-- =============================================================
-- Cozaria Phase 4B — Furniture sprites + room layout persistence
-- =============================================================

-- ─── Point the seeded shop items at the furniture atlas ─────────
--
-- Keys must match FURNITURE in src/game/config.ts. Matching on name keeps
-- this re-runnable and avoids depending on generated uuids.

update public.items set sprite_key = 'desk_01'       where name = 'Wooden Desk';
update public.items set sprite_key = 'armchair_01'   where name = 'Cozy Armchair';
update public.items set sprite_key = 'bookshelf_01'  where name = 'Bookshelf';
update public.items set sprite_key = 'lamp_01'       where name = 'Desk Lamp';
update public.items set sprite_key = 'candles_01'    where name = 'Candle Set';
update public.items set sprite_key = 'globe_01'      where name = 'Globe';
update public.items set sprite_key = 'fern_01'       where name = 'Potted Fern';
update public.items set sprite_key = 'chest_01'      where name = 'Treasure Chest';

-- The tileset is a library pack with no wall hanging and no crystal ball, so
-- these two seeds get the closest art the sheet actually has. 'Wall Tapestry'
-- keeps its name — the sprite is a large woven red/gold textile either way.
update public.items set sprite_key = 'rug_large_01'  where name = 'Wall Tapestry';

-- 'Crystal Orb' has no matching art at all, so it also gets renamed rather
-- than shipping a shop card whose picture is unrelated to its name. Revert
-- these three lines if you would rather draw a crystal orb sprite later.
update public.items
   set sprite_key  = 'clock_01',
       name        = 'Grandfather Clock',
       description = 'Tick, tock. It keeps your study hours honest.'
 where name = 'Crystal Orb';

-- ─── Let users move their own furniture ─────────────────────────
--
-- Ownership stays server-only: there is still no client INSERT or DELETE
-- policy on owned_items, so rows can only be created by the buy-item Edge
-- Function running as service_role.

create policy "Users can update placement of own items"
  on public.owned_items for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Column-level GRANT is what actually restricts this to the layout: the
-- policy above decides WHICH rows, and this decides WHICH columns. Without
-- the column list, the same policy would let a user rewrite user_id/item_id
-- and hand themselves someone else's item.
grant update (placement) on public.owned_items to authenticated;
