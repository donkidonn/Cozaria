import Phaser from 'phaser'
import { ROOM_BACKDROP, ROOM_SCALE } from './config'
import { STARTER_ROOM } from './rooms'
import type { RoomDefinition } from './rooms'
import type { PlacedItem, PlacementDraft } from './placement'
import { ROOM_SCENE_KEY, RoomScene } from './scenes/RoomScene'

/**
 * The one and only seam between React and Phaser.
 *
 * React calls createRoomGame() and then only ever touches the returned handle.
 * Nothing else in src/ imports phaser, and the scene never reaches back into
 * React — it reports out through the plain-data callbacks below. Keep this
 * surface small: new game/UI conversations belong here as explicit methods or
 * callbacks, not as components reaching into Phaser.
 */
export interface RoomGameHandle {
  /** Swap the rendered room/theme. */
  setRoom(room: RoomDefinition): void
  /** Replace the set of furniture drawn in the room. */
  setPlacedItems(items: PlacedItem[]): void
  /** Attach an item to the cursor (or pass null to stop placing). */
  setDraft(draft: PlacementDraft | null): void
  /** Fit the canvas to a new container size, in CSS pixels. */
  resize(cssWidth: number, cssHeight: number): void
  /** Tear down the canvas. Safe to call once; React cleanup does this. */
  destroy(): void
}

/** Only used if the container hasn't been laid out yet when the game boots. */
const DEFAULT_VIEW_WIDTH = 960
const DEFAULT_VIEW_HEIGHT = 600

export interface RoomGameOptions {
  /** Room to render. Defaults to the starter room. */
  room?: RoomDefinition
  /** Integer upscale factor. Defaults to ROOM_SCALE. */
  scale?: number
  /** The held item was dropped on a valid cell. */
  onPlace?(ownedItemId: string, col: number, row: number): void
  /** A placed item was clicked while nothing was held. */
  onPickUp?(ownedItemId: string): void
}

export function createRoomGame(
  parent: HTMLElement,
  options: RoomGameOptions = {},
): RoomGameHandle {
  const room = options.room ?? STARTER_ROOM
  const zoom = Math.max(1, Math.round(options.scale ?? ROOM_SCALE))

  /**
   * Logical (pre-zoom) canvas size for a container measured in CSS pixels.
   *
   * Flooring keeps the canvas an exact multiple of the zoom, so one art pixel
   * is always exactly `zoom` screen pixels. The cost is up to `zoom - 1` px of
   * container left uncovered, which the parent's background absorbs — far
   * better than a fractional scale, which would smear the pixel art.
   */
  const logicalSize = (cssWidth: number, cssHeight: number) => ({
    width: Math.max(1, Math.floor(cssWidth / zoom)),
    height: Math.max(1, Math.floor(cssHeight / zoom)),
  })

  const initial = logicalSize(
    parent.clientWidth || DEFAULT_VIEW_WIDTH,
    parent.clientHeight || DEFAULT_VIEW_HEIGHT,
  )

  // Read through refs so React can swap handlers without rebuilding the game.
  const scene = new RoomScene(room, {
    onPlace: (id, col, row) => options.onPlace?.(id, col, row),
    onPickUp: (id) => options.onPickUp?.(id),
  })

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    // pixelArt disables texture smoothing and enables roundPixels, so the
    // 24px art stays crisp instead of turning into mush when scaled up.
    pixelArt: true,
    backgroundColor: ROOM_BACKDROP,
    scale: {
      // NONE + an explicit resize() on container changes: the canvas is a
      // window onto the room, so it takes the container's size rather than
      // the room's, and the camera decides which part shows.
      mode: Phaser.Scale.NONE,
      width: initial.width,
      height: initial.height,
      // Whole-number zoom only — see ROOM_SCALE in config.ts.
      zoom,
    },
    scene: [scene],
  })

  let booted = false
  let disposed = false
  let teardownQueued = false

  // Calls that arrive before create() has run would be lost, so replay the
  // latest ones once the scene is live.
  let pendingItems: PlacedItem[] | null = null
  let pendingDraft: PlacementDraft | null = null

  const liveScene = (): RoomScene | null => {
    if (disposed || !booted) return null
    return game.scene.getScene<RoomScene>(ROOM_SCENE_KEY) ?? null
  }

  const teardown = () => {
    const { canvas } = game
    // `true` = Phaser removes its own canvas during runDestroy().
    game.destroy(true)
    // Belt and braces: runDestroy() null-checks parentNode, so dropping the
    // node here is safe whether or not Phaser gets to it first.
    canvas?.parentNode?.removeChild(canvas)
  }

  game.events.once(Phaser.Core.Events.READY, () => {
    booted = true
    if (teardownQueued) {
      teardown()
      return
    }
    const live = liveScene()
    if (!live) return
    if (pendingItems) live.setPlacedItems(pendingItems)
    if (pendingDraft) live.setDraft(pendingDraft)
    pendingItems = null
    pendingDraft = null
  })

  return {
    setRoom(next: RoomDefinition) {
      liveScene()?.setRoom(next)
    },

    setPlacedItems(items: PlacedItem[]) {
      if (disposed) return
      const live = liveScene()
      if (live) live.setPlacedItems(items)
      else pendingItems = items
    },

    setDraft(draft: PlacementDraft | null) {
      if (disposed) return
      const live = liveScene()
      if (live) live.setDraft(draft)
      else pendingDraft = draft
    },

    resize(cssWidth: number, cssHeight: number) {
      if (disposed || cssWidth <= 0 || cssHeight <= 0) return
      const { width, height } = logicalSize(cssWidth, cssHeight)
      // Safe before boot too: ScaleManager stores the size and applies it.
      game.scale.resize(width, height)
    },

    destroy() {
      if (disposed) return
      disposed = true

      // Phaser's destroy() only raises a `pendingDestroy` flag. The real
      // teardown — renderer, WebGL context, canvas — happens on the next
      // frame of its RAF loop, and that loop doesn't start until READY.
      // Destroying before then orphans the canvas *and* leaks a WebGL
      // context, which is exactly what React StrictMode's
      // mount/unmount/mount does on a warm route. So if boot is still in
      // flight, queue the teardown for READY instead.
      if (booted) teardown()
      else teardownQueued = true
    },
  }
}
