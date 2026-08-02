/**
 * Public surface of the game module. React should import from here only.
 * Everything below this barrel (phaser itself, scenes, tile coords) stays
 * internal to src/game.
 */
export { RoomCanvas } from './LazyRoomCanvas'
export { STARTER_ROOM } from './rooms'
export type { RoomDefinition } from './rooms'
