import type { RoomDefinition } from './rooms'

export interface RoomCanvasProps {
  room?: RoomDefinition
  /** Integer upscale factor. Defaults to ROOM_SCALE from config.ts. */
  scale?: number
}
