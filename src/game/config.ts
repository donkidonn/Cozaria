/**
 * Cozaria world config.
 *
 * Every tunable number for the Phaser room lives in this file. Later phases add
 * more rooms and unlockable themes — those should be new *data* (see rooms.ts),
 * not new code.
 */

/** A 24x24 source rectangle on the tileset, in raw sheet pixels. */
export interface TileCoord {
  x: number
  y: number
}

/** Maps a single layout character to the tile it draws. See rooms.ts. */
export type TileLegend = Record<string, TileCoord>

// ─────────────────────────────────────────────────────────────
// Tileset
// ─────────────────────────────────────────────────────────────

export const TILESET_KEY = 'library-tileset'
export const TILESET_PATH = '/assets/library-tileset.png'

/** Sheet is 1488x528 = a 62 x 22 grid of 24px tiles. */
export const TILE_SIZE = 24

// ─────────────────────────────────────────────────────────────
// TILE COORDINATES — tweak these if the room looks wrong
// ─────────────────────────────────────────────────────────────
//
// Each constant is the TOP-LEFT PIXEL of a 24x24 frame on
// public/assets/library-tileset.png.
//
// How to find/adjust a coordinate:
//   1. Open the PNG in an image editor that shows a pixel cursor readout
//      (Aseprite, Photopea, GIMP, even Paint.NET).
//   2. Hover the top-left corner of the tile you want and read the x,y.
//   3. Round BOTH numbers DOWN to the nearest multiple of 24 — the art is
//      laid out on a 24px grid, so x and y should always end in 0, 24, 48,
//      72, 96, ... Off-grid values produce visible seams.
//   4. Paste them in below and save; Vite hot-reloads the room.
//
// Quick sanity check: tile column index = x / 24, row index = y / 24.
//
// The four FLOOR_* constants below are the four quadrants of one 2x2 brick
// patch on the sheet (at 24,216). Alternating them across the floor is what
// gives the offset/staggered brick look instead of an obvious repeat.

/** Brick floor, top-left quadrant. Sheet column 1, row 9. */
export const FLOOR_TILE: TileCoord = { x: 24, y: 216 }
/** Brick floor, top-right quadrant. */
export const FLOOR_TILE_B: TileCoord = { x: 48, y: 216 }
/** Brick floor, bottom-left quadrant. */
export const FLOOR_TILE_C: TileCoord = { x: 24, y: 240 }
/** Brick floor, bottom-right quadrant. */
export const FLOOR_TILE_D: TileCoord = { x: 48, y: 240 }
/** Alternate single brick tile (finer brick, no 2x2 variants). */
export const FLOOR_TILE_ALT: TileCoord = { x: 96, y: 216 }

/** Wall: blue striped wallpaper. This is the default wall row. */
export const WALL_TILE: TileCoord = { x: 1296, y: 48 }
/** Wall: carved wood rail that caps the top of a wall. */
export const WALL_RAIL_TILE: TileCoord = { x: 1296, y: 0 }
/** Wall: dark wood wainscot that skirts the bottom of a wall. */
export const WALL_TRIM_TILE: TileCoord = { x: 1296, y: 96 }

/**
 * Layout characters furniture is allowed to sit on. Anything else — the wall
 * row, unmapped gaps — rejects placement.
 */
export const FLOOR_CHARS = '.,:;o'

/**
 * Default character -> tile mapping used by room layouts.
 * Characters not listed here (including spaces) draw nothing.
 */
export const DEFAULT_LEGEND: TileLegend = {
  '.': FLOOR_TILE,
  ',': FLOOR_TILE_B,
  ':': FLOOR_TILE_C,
  ';': FLOOR_TILE_D,
  o: FLOOR_TILE_ALT,
  W: WALL_TILE,
  R: WALL_RAIL_TILE,
  T: WALL_TRIM_TILE,
}

// ─────────────────────────────────────────────────────────────
// Room grid
// ─────────────────────────────────────────────────────────────

/**
 * Starter room footprint in tiles. These drive STARTER_ROOM's layout in
 * rooms.ts, so changing them here really does resize the room; a themed room
 * can still ship its own hand-written layout of any size instead.
 *
 * The room is deliberately BIGGER than the viewport: at 24x18 and scale 3 it
 * renders 1728x1296, which no laptop shows at once. The camera crops it and
 * the player pans, exactly like the mockup — the room is a place you look
 * into, not a picture scaled down to fit.
 *
 * Growing these is always safe. SHRINKING them would strand any furniture
 * already placed outside the new bounds, and nothing re-validates placements
 * on load, so don't reduce them without a migration that clears or clamps
 * owned_items.placement.
 */
export const ROOM_COLS = 24
export const ROOM_ROWS = 18

/**
 * Canvas upscale factor. MUST be a whole number — a fractional zoom makes the
 * pixel art blurry and shimmery.
 *
 * This is no longer used to size the canvas (the canvas fills its container
 * now); it's the ratio between one art pixel and one screen pixel. 3 keeps the
 * 24px tiles readable at desktop sizes.
 */
export const ROOM_SCALE = 3

/**
 * Canvas backdrop, shown wherever a layout cell is empty.
 * Mirrors the `wood-dark` palette token from index.css — Phaser needs a literal
 * number, it can't read Tailwind theme tokens.
 */
export const ROOM_BACKDROP = 0x3a2416

// ─────────────────────────────────────────────────────────────
// FURNITURE ATLAS — tweak these if a sprite looks wrong
// ─────────────────────────────────────────────────────────────
//
// Same rules as the tile coordinates above: `x`/`y` are the TOP-LEFT PIXEL of
// the sprite on public/assets/library-tileset.png, and every value is a
// multiple of 24.
//
// `widthTiles`/`heightTiles` are BOTH the drawn size and the collision
// footprint — a 4x6 bookshelf covers 4 columns and 6 rows of floor. If a
// sprite looks clipped, grow the tile count; if it looks like it has too much
// dead space around it, shrink the tile count and/or nudge x/y by 24.
//
// These boxes were measured off the sheet's actual alpha bounds, so they
// should be tight already. Sprites are NOT rotatable — there is one frame per
// item and it is drawn as-is.

/**
 * Which vertical slice of the room a piece lives in. This drives BOTH what may
 * overlap what and the draw order, so a candle can sit on a desk that sits on
 * a rug.
 *
 * - 'floor'     rugs and carpets — things other pieces sit on top of
 * - 'furniture' desks, shelves, chairs, chests — the main objects
 * - 'surface'   candles, books, lamps — small things that sit ON furniture
 */
export type FurnitureLayer = 'floor' | 'furniture' | 'surface'

/** Painter's order: floor first, surface last. Also used for hit-testing. */
export const LAYER_DRAW_ORDER: Record<FurnitureLayer, number> = {
  floor: 0,
  furniture: 1,
  surface: 2,
}

export interface FurnitureSprite {
  /** Top-left pixel of the frame on the sheet. Multiples of 24. */
  x: number
  y: number
  /** Footprint in tiles — also the drawn size. */
  widthTiles: number
  heightTiles: number
  /** Stacking slice — see FurnitureLayer. */
  layer: FurnitureLayer
  /** Fallback label, used when an item row has no name. */
  label: string
}

/**
 * sprite_key -> frame. Keys match `items.sprite_key` in Postgres; see
 * supabase/migrations/20260802000000_furniture_placement.sql.
 */
export const FURNITURE: Record<string, FurnitureSprite> = {
  // ── surface: small things that sit on top of furniture ─────
  candles_01: { x: 240, y: 168, widthTiles: 1, heightTiles: 1, layer: 'surface', label: 'Candle' },
  plant_small_01: { x: 48, y: 24, widthTiles: 1, heightTiles: 1, layer: 'surface', label: 'Little Plant' },
  plant_flower_01: { x: 24, y: 24, widthTiles: 1, heightTiles: 1, layer: 'surface', label: 'Potted Flower' },
  lamp_01: { x: 624, y: 120, widthTiles: 1, heightTiles: 2, layer: 'surface', label: 'Table Lamp' },
  openbook_01: { x: 288, y: 24, widthTiles: 2, heightTiles: 1, layer: 'surface', label: 'Open Book' },
  bookstack_01: { x: 240, y: 24, widthTiles: 2, heightTiles: 2, layer: 'surface', label: 'Book Stack' },

  // ── furniture: the main floor-standing objects ─────────────
  fern_01: { x: 24, y: 72, widthTiles: 2, heightTiles: 2, layer: 'furniture', label: 'Potted Fern' },
  chest_01: { x: 48, y: 144, widthTiles: 3, heightTiles: 2, layer: 'furniture', label: 'Treasure Chest' },
  armchair_01: { x: 672, y: 96, widthTiles: 2, heightTiles: 3, layer: 'furniture', label: 'Cozy Armchair' },
  clock_01: { x: 72, y: 24, widthTiles: 3, heightTiles: 5, layer: 'furniture', label: 'Grandfather Clock' },
  globe_01: { x: 144, y: 216, widthTiles: 4, heightTiles: 5, layer: 'furniture', label: 'Globe' },
  bookshelf_01: { x: 144, y: 360, widthTiles: 4, heightTiles: 6, layer: 'furniture', label: 'Bookshelf' },
  desk_01: { x: 360, y: 216, widthTiles: 7, heightTiles: 4, layer: 'furniture', label: 'Wooden Desk' },

  // ── floor: rugs everything else sits on ────────────────────
  rug_small_01: { x: 456, y: 120, widthTiles: 6, heightTiles: 3, layer: 'floor', label: 'Small Rug' },
  rug_large_01: { x: 456, y: 24, widthTiles: 7, heightTiles: 3, layer: 'floor', label: 'Large Rug' },
}

export function getSprite(spriteKey: string | null | undefined): FurnitureSprite | null {
  if (!spriteKey) return null
  return FURNITURE[spriteKey] ?? null
}
