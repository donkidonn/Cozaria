import { supabase } from '../../lib/supabase'
import { parsePlacement } from '../../game'
import type { PlacementRecord } from '../../game'

export interface OwnedRoomItem {
  /** owned_items.id */
  id: string
  itemId: string
  name: string
  description: string | null
  spriteKey: string | null
  category: string | null
  acquiredAt: string
  /** null when the item is still in the inventory rather than the room. */
  placement: PlacementRecord | null
}

interface OwnedItemRow {
  id: string
  item_id: string
  acquired_at: string
  placement: unknown
  items: {
    name: string
    description: string | null
    sprite_key: string | null
    category: string | null
  } | null
}

export async function fetchOwnedRoomItems(): Promise<OwnedRoomItem[]> {
  const { data, error } = await supabase
    .from('owned_items')
    .select('id, item_id, acquired_at, placement, items(name, description, sprite_key, category)')
    .order('acquired_at', { ascending: false })

  if (error) throw error

  return ((data ?? []) as unknown as OwnedItemRow[]).map((row) => ({
    id: row.id,
    itemId: row.item_id,
    name: row.items?.name ?? 'Unknown item',
    description: row.items?.description ?? null,
    spriteKey: row.items?.sprite_key ?? null,
    category: row.items?.category ?? null,
    acquiredAt: row.acquired_at,
    placement: parsePlacement(row.placement),
  }))
}

/**
 * Writes one item's spot in the room. `placement: null` sends it back to the
 * inventory. Only the placement column is writable from the client — see
 * supabase/migrations/20260802000000_furniture_placement.sql.
 */
export async function savePlacement(
  ownedItemId: string,
  placement: PlacementRecord | null,
): Promise<void> {
  const { error } = await supabase
    .from('owned_items')
    .update({ placement })
    .eq('id', ownedItemId)

  if (error) throw error
}
