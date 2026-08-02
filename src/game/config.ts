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

/** Default room footprint in tiles. Room data may override (see rooms.ts). */
export const ROOM_COLS = 12
export const ROOM_ROWS = 9

/**
 * Canvas upscale factor. MUST be a whole number — a fractional zoom makes the
 * pixel art blurry and shimmery. 3 gives an 864x648 canvas, 4 gives 1152x864.
 */
export const ROOM_SCALE = 3

/**
 * Canvas backdrop, shown wherever a layout cell is empty.
 * Mirrors the `wood-dark` palette token from index.css — Phaser needs a literal
 * number, it can't read Tailwind theme tokens.
 */
export const ROOM_BACKDROP = 0x3a2416
