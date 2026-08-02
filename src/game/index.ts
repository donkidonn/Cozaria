/**
 * Public surface of the game module. React should import from here only.
 * Everything below this barrel (phaser itself, scenes, the bridge) stays
 * internal to src/game.
 *
 * Note the split: the values below are plain data and pure functions, so React
 * can size inventory thumbnails and validate placements without ever touching
 * Phaser. Only RoomCanvas pulls the engine in, and it does so lazily.
 */
export { RoomCanvas } from './LazyRoomCanvas'

export { STARTER_ROOM } from './rooms'
export type { RoomDefinition } from './rooms'

export { FURNITURE, getSprite, LAYER_DRAW_ORDER, TILE_SIZE, TILESET_PATH } from './config'
export type { FurnitureLayer, FurnitureSprite } from './config'

export { checkPlacement, parsePlacement, toPlacementRecord, PLACEMENT_ERROR_TEXT } from './placement'
export type { PlacedItem, PlacementDraft, PlacementRecord, PlacementError } from './placement'
