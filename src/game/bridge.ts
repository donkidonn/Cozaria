import Phaser from 'phaser'
import { ROOM_BACKDROP, ROOM_SCALE, TILE_SIZE } from './config'
import { STARTER_ROOM, roomSize } from './rooms'
import type { RoomDefinition } from './rooms'
import { ROOM_SCENE_KEY, RoomScene } from './scenes/RoomScene'

/**
 * The one and only seam between React and Phaser.
 *
 * React calls createRoomGame() and then only ever touches the returned handle.
 * Nothing else in src/ should import phaser, and the scene never reaches back
 * into React. Keep this surface small — if a later phase needs React to hear
 * about something in the game (e.g. "furniture placed"), add an explicit
 * callback option here rather than wiring components into Phaser.
 */
export interface RoomGameHandle {
  /** Swap the rendered room/theme. */
  setRoom(room: RoomDefinition): void
  /** Tear down the canvas. Safe to call once; React cleanup does this. */
  destroy(): void
}

export interface RoomGameOptions {
  /** Room to render. Defaults to the starter room. */
  room?: RoomDefinition
  /** Integer upscale factor. Defaults to ROOM_SCALE. */
  scale?: number
}

export function createRoomGame(
  parent: HTMLElement,
  options: RoomGameOptions = {},
): RoomGameHandle {
  const room = options.room ?? STARTER_ROOM
  const zoom = Math.max(1, Math.round(options.scale ?? ROOM_SCALE))
  const { cols, rows } = roomSize(room)

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    // pixelArt disables texture smoothing and enables roundPixels, so the
    // 24px art stays crisp instead of turning into mush when scaled up.
    pixelArt: true,
    backgroundColor: ROOM_BACKDROP,
    scale: {
      mode: Phaser.Scale.NONE,
      width: cols * TILE_SIZE,
      height: rows * TILE_SIZE,
      // Whole-number zoom only — see ROOM_SCALE in config.ts.
      zoom,
    },
    scene: [new RoomScene(room)],
  })

  let booted = false
  let disposed = false
  let teardownQueued = false

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
    if (teardownQueued) teardown()
  })

  return {
    setRoom(next: RoomDefinition) {
      if (disposed) return
      const scene = game.scene.getScene<RoomScene>(ROOM_SCENE_KEY)
      scene?.setRoom(next)
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
