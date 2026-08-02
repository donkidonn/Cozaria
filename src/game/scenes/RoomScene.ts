import Phaser from 'phaser'
import { TILE_SIZE } from '../config'
import type { TileCoord } from '../config'
import { roomSize } from '../rooms'
import type { RoomDefinition } from '../rooms'

export const ROOM_SCENE_KEY = 'RoomScene'

/**
 * Renders one room's tile layout. Knows nothing about React, Supabase, or the
 * player's inventory — it just draws whatever RoomDefinition it is handed.
 */
export class RoomScene extends Phaser.Scene {
  private room: RoomDefinition
  private tileLayer?: Phaser.GameObjects.Container

  constructor(room: RoomDefinition) {
    super(ROOM_SCENE_KEY)
    this.room = room
  }

  preload(): void {
    this.load.image(this.room.tilesetKey, this.room.tilesetPath)
  }

  create(): void {
    this.tileLayer = this.add.container(0, 0)
    this.drawRoom()
  }

  /** Swap in a different room/theme at runtime. Loads its sheet if needed. */
  setRoom(room: RoomDefinition): void {
    this.room = room

    if (this.textures.exists(room.tilesetKey)) {
      this.drawRoom()
      return
    }

    this.load.image(room.tilesetKey, room.tilesetPath)
    this.load.once(Phaser.Loader.Events.COMPLETE, () => this.drawRoom())
    this.load.start()
  }

  private drawRoom(): void {
    if (!this.tileLayer) return
    this.tileLayer.removeAll(true)

    const { cols, rows } = roomSize(this.room)
    this.scale.resize(cols * TILE_SIZE, rows * TILE_SIZE)

    for (let row = 0; row < rows; row++) {
      const line = this.room.layout[row] ?? ''

      for (let col = 0; col < cols; col++) {
        const coord = this.room.legend[line[col]]
        if (!coord) continue // unmapped char (or space) = leave the backdrop showing

        const tile = this.add
          .image(col * TILE_SIZE, row * TILE_SIZE, this.room.tilesetKey, this.frameFor(coord))
          .setOrigin(0, 0)

        this.tileLayer.add(tile)
      }
    }
  }

  /**
   * Registers (once) a 24x24 frame at the given sheet pixel coordinate and
   * returns its name. Cutting frames by pixel coords rather than a fixed
   * spritesheet index keeps us free to pull the odd-sized furniture sprites
   * (1x3, 4x1, ...) off the same sheet in a later phase.
   */
  private frameFor(coord: TileCoord): string {
    const name = `t_${coord.x}_${coord.y}`
    const texture = this.textures.get(this.room.tilesetKey)

    if (!texture.has(name)) {
      texture.add(name, 0, coord.x, coord.y, TILE_SIZE, TILE_SIZE)
    }

    return name
  }
}
