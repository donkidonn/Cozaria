import { DEFAULT_LEGEND, ROOM_SCALE, TILE_SIZE, TILESET_KEY, TILESET_PATH } from './config'
import type { TileLegend } from './config'

/**
 * A room is pure data. Adding a new room or an unlockable theme in a later
 * phase means adding another RoomDefinition here (or fetching one from
 * Supabase) — the scene never needs to change.
 */
export interface RoomDefinition {
  id: string
  name: string
  /** Texture cache key. Two themes on the same sheet may share one key. */
  tilesetKey: string
  /** Public URL of the sheet, loaded on demand if not already cached. */
  tilesetPath: string
  /** Which character means which tile. */
  legend: TileLegend
  /**
   * One string per row, one character per tile, top row first.
   * Grid size is derived from this array, so rows may be any length.
   */
  layout: string[]
}

/**
 * The starter room: a wall row across the top, brick floor below.
 *
 * The floor alternates `.,` / `:;` so the four quadrants of the brick patch
 * tile in a staggered pattern. Swap every floor character for `o` to use the
 * finer single-tile brick instead.
 *
 * To give the wall real depth, replace the first row with three rows:
 *   'RRRRRRRRRRRR',   <- wood rail
 *   'WWWWWWWWWWWW',   <- striped wallpaper
 *   'TTTTTTTTTTTT',   <- wood wainscot
 * and delete three floor rows to keep the height the same.
 */
export const STARTER_ROOM: RoomDefinition = {
  id: 'starter',
  name: 'Study Nook',
  tilesetKey: TILESET_KEY,
  tilesetPath: TILESET_PATH,
  legend: DEFAULT_LEGEND,
  layout: [
    'WWWWWWWWWWWW',
    '.,.,.,.,.,.,',
    ':;:;:;:;:;:;',
    '.,.,.,.,.,.,',
    ':;:;:;:;:;:;',
    '.,.,.,.,.,.,',
    ':;:;:;:;:;:;',
    '.,.,.,.,.,.,',
    ':;:;:;:;:;:;',
  ],
}

/** Room footprint in tiles, derived from the layout data. */
export function roomSize(room: RoomDefinition): { cols: number; rows: number } {
  const rows = room.layout.length
  const cols = room.layout.reduce((widest, row) => Math.max(widest, row.length), 0)
  return { cols, rows }
}

/** Final on-screen canvas size for a room, in CSS pixels. */
export function roomPixelSize(room: RoomDefinition, scale: number = ROOM_SCALE) {
  const { cols, rows } = roomSize(room)
  return { width: cols * TILE_SIZE * scale, height: rows * TILE_SIZE * scale }
}
