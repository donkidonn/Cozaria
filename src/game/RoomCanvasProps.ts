import type { PlacedItem, PlacementDraft } from './placement'
import type { RoomDefinition } from './rooms'

export interface RoomCanvasProps {
  room?: RoomDefinition
  /** Integer upscale factor. Defaults to ROOM_SCALE from config.ts. */
  scale?: number
  /** Furniture currently in the room. */
  placedItems?: PlacedItem[]
  /** Item attached to the cursor, or null when nothing is being placed. */
  draft?: PlacementDraft | null
  /** The held item was dropped on a valid cell. */
  onPlace?(ownedItemId: string, col: number, row: number): void
  /** A placed item was clicked while nothing was held. */
  onPickUp?(ownedItemId: string): void
}
