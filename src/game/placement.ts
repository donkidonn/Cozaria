import { FLOOR_CHARS, getSprite } from './config'
import type { FurnitureLayer, FurnitureSprite } from './config'
import { roomSize } from './rooms'
import type { RoomDefinition } from './rooms'

/**
 * A piece of furniture sitting in the room. `col`/`row` are the TOP-LEFT tile
 * of its footprint, so a 4x6 bookshelf at (2,1) covers columns 2-5, rows 1-6.
 *
 * This is plain data on purpose — it crosses the React/Phaser boundary in both
 * directions and must never carry a Phaser object.
 */
export interface PlacedItem {
  /** owned_items.id — the stable identity used for persistence. */
  ownedItemId: string
  spriteKey: string
  col: number
  row: number
}

/** The item currently attached to the cursor, if any. */
export interface PlacementDraft {
  ownedItemId: string
  spriteKey: string
}

/** Shape persisted in owned_items.placement. */
export interface PlacementRecord {
  x: number
  y: number
}

export function toPlacementRecord(item: PlacedItem): PlacementRecord {
  return { x: item.col, y: item.row }
}

/** Reads owned_items.placement defensively — it's untyped jsonb. */
export function parsePlacement(value: unknown): PlacementRecord | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const { x, y } = record
  if (typeof x !== 'number' || typeof y !== 'number') return null
  if (!Number.isInteger(x) || !Number.isInteger(y)) return null
  return { x, y }
}

/** True when this tile is floor the user may build on (i.e. not the wall row). */
export function isFloorCell(room: RoomDefinition, col: number, row: number): boolean {
  const { cols, rows } = roomSize(room)
  if (col < 0 || row < 0 || col >= cols || row >= rows) return false

  const char = room.layout[row]?.[col]
  if (char === undefined) return false

  return (room.floorChars ?? FLOOR_CHARS).includes(char)
}

/**
 * Why a placement was rejected, or null when it is valid.
 * Returned rather than a bare boolean so the UI can explain itself.
 */
export type PlacementError = 'out-of-bounds' | 'not-floor' | 'occupied'

/**
 * Whether two pieces fight over the same space.
 *
 * The three stacking rules all reduce to one invariant — a piece only blocks
 * another piece in its OWN layer:
 *   - floor vs floor         blocked (two rugs can't share a spot)
 *   - furniture vs furniture blocked (two desks can't share a spot)
 *   - surface vs surface     blocked (two candles can't share a spot)
 *   - anything else          allowed (candle on desk on rug)
 *
 * Kept as a named function so the rule is greppable and so a future layer with
 * asymmetric rules has an obvious home.
 */
function layersCollide(a: FurnitureLayer, b: FurnitureLayer): boolean {
  return a === b
}

export function checkPlacement(
  room: RoomDefinition,
  sprite: FurnitureSprite,
  col: number,
  row: number,
  placed: PlacedItem[],
  /** The item being moved — it shouldn't collide with its own old position. */
  ignoreOwnedItemId?: string,
): PlacementError | null {
  const { cols, rows } = roomSize(room)

  if (col < 0 || row < 0 || col + sprite.widthTiles > cols || row + sprite.heightTiles > rows) {
    return 'out-of-bounds'
  }

  for (let dy = 0; dy < sprite.heightTiles; dy++) {
    for (let dx = 0; dx < sprite.widthTiles; dx++) {
      if (!isFloorCell(room, col + dx, row + dy)) return 'not-floor'
    }
  }

  for (const other of placed) {
    if (other.ownedItemId === ignoreOwnedItemId) continue

    const otherSprite = getSprite(other.spriteKey)
    if (!otherSprite) continue

    // Different layers stack freely — that's the whole point of layers.
    if (!layersCollide(sprite.layer, otherSprite.layer)) continue

    const overlaps =
      col < other.col + otherSprite.widthTiles &&
      col + sprite.widthTiles > other.col &&
      row < other.row + otherSprite.heightTiles &&
      row + sprite.heightTiles > other.row

    if (overlaps) return 'occupied'
  }

  return null
}

export const PLACEMENT_ERROR_TEXT: Record<PlacementError, string> = {
  'out-of-bounds': "That doesn't fit inside the room.",
  'not-floor': "Furniture can't go on the wall.",
  // Only same-layer collisions get here, so this always means "another piece
  // of the same kind" rather than "anything at all is in the way".
  occupied: 'Something like that is already in that spot.',
}
