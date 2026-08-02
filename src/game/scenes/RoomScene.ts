import Phaser from 'phaser'
import { LAYER_DRAW_ORDER, TILE_SIZE, getSprite } from '../config'
import type { FurnitureSprite, TileCoord } from '../config'
import { roomSize } from '../rooms'
import type { RoomDefinition } from '../rooms'
import { checkPlacement } from '../placement'
import type { PlacedItem, PlacementDraft } from '../placement'

export const ROOM_SCENE_KEY = 'RoomScene'

const GHOST_VALID = 0x5e8c46 // `green` palette token
const GHOST_INVALID = 0x9c3a2b // `mahogany` palette token

/** World px/second the arrow keys scroll the camera. */
const PAN_KEY_SPEED = 420

/**
 * How far the pointer may travel during a press and still count as a click.
 * Below this a shaky hand still places furniture; above it the gesture is a
 * pan and placement is suppressed.
 */
const PAN_CLICK_SLOP = 4

/** What the scene reports back out. The bridge forwards these to React. */
export interface RoomSceneCallbacks {
  onPlace(ownedItemId: string, col: number, row: number): void
  onPickUp(ownedItemId: string): void
}

/**
 * Renders a room's tiles plus its placed furniture, and runs the placement
 * interaction. Knows nothing about React, Supabase, or the shop — it is handed
 * plain data and reports plain data back through `callbacks`.
 */
export class RoomScene extends Phaser.Scene {
  private room: RoomDefinition
  private callbacks: RoomSceneCallbacks

  private tileLayer?: Phaser.GameObjects.Container
  private furnitureLayer?: Phaser.GameObjects.Container
  private ghostLayer?: Phaser.GameObjects.Container

  private placed: PlacedItem[] = []
  private draft: PlacementDraft | null = null
  private hoverCol = -1
  private hoverRow = -1

  // Drag-to-pan bookkeeping. A press only counts as a click if the pointer
  // never travelled far enough to be a drag.
  private panning = false
  private panMoved = false
  private panLastX = 0
  private panLastY = 0
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys

  constructor(room: RoomDefinition, callbacks: RoomSceneCallbacks) {
    super(ROOM_SCENE_KEY)
    this.room = room
    this.callbacks = callbacks
  }

  preload(): void {
    this.load.image(this.room.tilesetKey, this.room.tilesetPath)
  }

  create(): void {
    this.tileLayer = this.add.container(0, 0)
    this.furnitureLayer = this.add.container(0, 0)
    this.ghostLayer = this.add.container(0, 0)

    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this)
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.handlePointerMove, this)
    this.input.on(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this)
    // A pointer released outside the canvas must not leave us stuck panning.
    this.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.endPan, this)

    this.cursors = this.input.keyboard?.createCursorKeys()
    // Without this the arrow keys scroll the page instead of the room. The
    // game only exists on /world, which has no text inputs, so capturing them
    // here can't steal typing from anything.
    this.input.keyboard?.addCapture('UP,DOWN,LEFT,RIGHT')

    this.scale.on(Phaser.Scale.Events.RESIZE, this.clampScroll, this)

    this.drawRoom()
    this.drawFurniture()
    this.centreCamera()
  }

  // ── camera ────────────────────────────────────────────────

  /** Room size in world pixels. */
  private roomPixels(): { width: number; height: number } {
    const { cols, rows } = roomSize(this.room)
    return { width: cols * TILE_SIZE, height: rows * TILE_SIZE }
  }

  private centreCamera(): void {
    const cam = this.cameras.main
    const { width, height } = this.roomPixels()
    cam.scrollX = (width - cam.width) / 2
    cam.scrollY = (height - cam.height) / 2
    this.clampScroll()
  }

  /**
   * Keeps the view inside the room.
   *
   * Clamped by hand rather than via camera.setBounds because Phaser's own
   * clamp pins a too-small room to a corner; when the room is narrower than
   * the viewport we want it centred instead.
   */
  private clampScroll(): void {
    const cam = this.cameras.main
    const { width, height } = this.roomPixels()

    cam.scrollX =
      width <= cam.width
        ? (width - cam.width) / 2
        : Phaser.Math.Clamp(cam.scrollX, 0, width - cam.width)

    cam.scrollY =
      height <= cam.height
        ? (height - cam.height) / 2
        : Phaser.Math.Clamp(cam.scrollY, 0, height - cam.height)
  }

  update(_time: number, delta: number): void {
    if (!this.cursors) return

    const step = (PAN_KEY_SPEED * delta) / 1000
    const cam = this.cameras.main
    let moved = false

    if (this.cursors.left.isDown) { cam.scrollX -= step; moved = true }
    if (this.cursors.right.isDown) { cam.scrollX += step; moved = true }
    if (this.cursors.up.isDown) { cam.scrollY -= step; moved = true }
    if (this.cursors.down.isDown) { cam.scrollY += step; moved = true }

    if (moved) this.clampScroll()
  }

  // ── inputs from the bridge ────────────────────────────────

  setRoom(room: RoomDefinition): void {
    this.room = room

    if (this.textures.exists(room.tilesetKey)) {
      this.drawRoom()
      this.drawFurniture()
      return
    }

    this.load.image(room.tilesetKey, room.tilesetPath)
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.drawRoom()
      this.drawFurniture()
    })
    this.load.start()
  }

  setPlacedItems(items: PlacedItem[]): void {
    this.placed = items
    this.drawFurniture()
    this.drawGhost()
  }

  setDraft(draft: PlacementDraft | null): void {
    this.draft = draft
    this.drawGhost()
  }

  // ── pointer handling ──────────────────────────────────────

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    this.panning = true
    this.panMoved = false
    this.panLastX = pointer.x
    this.panLastY = pointer.y
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.panning && pointer.isDown) {
      // pointer.x/y are already in game units (the ScaleManager divides out
      // the canvas zoom), and the camera is at zoom 1, so a pointer delta is
      // a world delta. Drag right => camera left, so the room follows the hand.
      const dx = pointer.x - this.panLastX
      const dy = pointer.y - this.panLastY

      if (Math.abs(pointer.x - pointer.downX) > PAN_CLICK_SLOP ||
          Math.abs(pointer.y - pointer.downY) > PAN_CLICK_SLOP) {
        this.panMoved = true
      }

      if (this.panMoved) {
        const cam = this.cameras.main
        cam.scrollX -= dx
        cam.scrollY -= dy
        this.clampScroll()
      }

      this.panLastX = pointer.x
      this.panLastY = pointer.y
    }

    // Hover tracking uses world coords, so the ghost follows the tile under
    // the cursor no matter where the camera is scrolled.
    const col = Math.floor(pointer.worldX / TILE_SIZE)
    const row = Math.floor(pointer.worldY / TILE_SIZE)
    if (col === this.hoverCol && row === this.hoverRow) return

    this.hoverCol = col
    this.hoverRow = row
    this.drawGhost()
  }

  private endPan(): void {
    this.panning = false
    this.panMoved = false
  }

  /**
   * Placement fires on release, not press, so a drag can pan without also
   * dropping furniture wherever the drag started.
   */
  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    const wasDrag = this.panMoved
    this.endPan()
    if (wasDrag) return

    const col = Math.floor(pointer.worldX / TILE_SIZE)
    const row = Math.floor(pointer.worldY / TILE_SIZE)

    // Holding something: try to drop it here.
    if (this.draft) {
      const sprite = getSprite(this.draft.spriteKey)
      if (!sprite) return
      const error = checkPlacement(this.room, sprite, col, row, this.placed, this.draft.ownedItemId)
      if (error) return // ghost is already showing red; ignore the click
      this.callbacks.onPlace(this.draft.ownedItemId, col, row)
      return
    }

    // Empty-handed: clicking a placed item picks it up.
    const hit = this.itemAt(col, row)
    if (hit) this.callbacks.onPickUp(hit.ownedItemId)
  }

  /** Topmost placed item covering this tile, or null. */
  private itemAt(col: number, row: number): PlacedItem | null {
    const ordered = this.sortedPlaced()

    for (let i = ordered.length - 1; i >= 0; i--) {
      const item = ordered[i]
      const sprite = getSprite(item.spriteKey)
      if (!sprite) continue
      if (
        col >= item.col &&
        col < item.col + sprite.widthTiles &&
        row >= item.row &&
        row < item.row + sprite.heightTiles
      ) {
        return item
      }
    }
    return null
  }

  /**
   * Painter's order: rugs first, then furniture, then the small things sitting
   * on top. Within one layer, whichever piece ends lower on screen draws in
   * front — standard top-down depth sorting.
   *
   * Hit-testing walks this list backwards, so clicking a candle that sits on a
   * desk picks up the candle rather than the desk beneath it.
   */
  private sortedPlaced(): PlacedItem[] {
    return [...this.placed].sort((a, b) => {
      const aSprite = getSprite(a.spriteKey)
      const bSprite = getSprite(b.spriteKey)

      const aLayer = LAYER_DRAW_ORDER[aSprite?.layer ?? 'furniture']
      const bLayer = LAYER_DRAW_ORDER[bSprite?.layer ?? 'furniture']
      if (aLayer !== bLayer) return aLayer - bLayer

      const aBottom = a.row + (aSprite?.heightTiles ?? 1)
      const bBottom = b.row + (bSprite?.heightTiles ?? 1)
      return aBottom - bBottom
    })
  }

  // ── drawing ───────────────────────────────────────────────

  private drawRoom(): void {
    if (!this.tileLayer) return
    this.tileLayer.removeAll(true)

    // The canvas is sized by its container, not by the room — the room is
    // meant to overflow the view and be panned around.
    const { cols, rows } = roomSize(this.room)
    this.clampScroll()

    for (let row = 0; row < rows; row++) {
      const line = this.room.layout[row] ?? ''

      for (let col = 0; col < cols; col++) {
        const coord: TileCoord | undefined = this.room.legend[line[col]]
        if (!coord) continue // unmapped char (or space) = leave the backdrop showing

        const tile = this.add
          .image(
            col * TILE_SIZE,
            row * TILE_SIZE,
            this.room.tilesetKey,
            this.frameFor(coord.x, coord.y, TILE_SIZE, TILE_SIZE),
          )
          .setOrigin(0, 0)

        this.tileLayer.add(tile)
      }
    }
  }

  private drawFurniture(): void {
    if (!this.furnitureLayer) return
    this.furnitureLayer.removeAll(true)

    for (const item of this.sortedPlaced()) {
      const sprite = getSprite(item.spriteKey)
      if (!sprite) continue // unknown sprite_key — skip rather than crash the room

      this.furnitureLayer.add(this.makeSpriteImage(sprite, item.col, item.row))
    }
  }

  private drawGhost(): void {
    if (!this.ghostLayer) return
    this.ghostLayer.removeAll(true)
    if (!this.draft) return

    const sprite = getSprite(this.draft.spriteKey)
    if (!sprite) return

    const col = this.hoverCol
    const row = this.hoverRow
    const { cols, rows } = roomSize(this.room)
    if (col < 0 || row < 0 || col >= cols || row >= rows) return

    const error = checkPlacement(this.room, sprite, col, row, this.placed, this.draft.ownedItemId)

    const preview = this.makeSpriteImage(sprite, col, row).setAlpha(0.65)
    this.ghostLayer.add(preview)

    // Footprint wash so a 4x6 shelf reads as six rows, not one sprite.
    const wash = this.add
      .rectangle(
        col * TILE_SIZE,
        row * TILE_SIZE,
        sprite.widthTiles * TILE_SIZE,
        sprite.heightTiles * TILE_SIZE,
        error ? GHOST_INVALID : GHOST_VALID,
        0.35,
      )
      .setOrigin(0, 0)
      .setStrokeStyle(1, error ? GHOST_INVALID : GHOST_VALID, 0.9)

    this.ghostLayer.add(wash)
  }

  private makeSpriteImage(
    sprite: FurnitureSprite,
    col: number,
    row: number,
  ): Phaser.GameObjects.Image {
    return this.add
      .image(
        col * TILE_SIZE,
        row * TILE_SIZE,
        this.room.tilesetKey,
        this.frameFor(
          sprite.x,
          sprite.y,
          sprite.widthTiles * TILE_SIZE,
          sprite.heightTiles * TILE_SIZE,
        ),
      )
      .setOrigin(0, 0)
  }

  /**
   * Registers (once) a frame at the given sheet pixel rect and returns its
   * name. Cutting frames by pixel coords rather than a fixed spritesheet grid
   * is what lets the odd-sized furniture (1x2 lamp, 7x4 desk) share one sheet.
   */
  private frameFor(x: number, y: number, width: number, height: number): string {
    const name = `f_${x}_${y}_${width}_${height}`
    const texture = this.textures.get(this.room.tilesetKey)

    if (!texture.has(name)) {
      texture.add(name, 0, x, y, width, height)
    }

    return name
  }
}
