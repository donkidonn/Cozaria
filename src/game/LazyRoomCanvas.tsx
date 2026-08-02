import { Suspense, lazy } from 'react'
import { ROOM_SCALE } from './config'
import { STARTER_ROOM, roomPixelSize } from './rooms'
import type { RoomCanvasProps } from './RoomCanvasProps'

// Phaser is ~1.4MB. Loading it lazily keeps it out of the main bundle so the
// login/dashboard pages don't pay for a canvas they never render.
const RoomCanvasImpl = lazy(() =>
  import('./RoomCanvas').then((m) => ({ default: m.RoomCanvas })),
)

/**
 * Public room view. Renders a correctly-sized placeholder while the Phaser
 * chunk downloads, so the page never reflows when the canvas appears.
 */
export function RoomCanvas({ room = STARTER_ROOM, scale = ROOM_SCALE }: RoomCanvasProps) {
  const { width, height } = roomPixelSize(room, scale)

  const placeholder = (
    <div
      style={{ width, height }}
      className="flex max-w-full items-center justify-center rounded-xl border-2 border-wood-light bg-wood-dark"
    >
      <p className="font-heading text-lg text-gold-glow">Opening your room…</p>
    </div>
  )

  return (
    <Suspense fallback={placeholder}>
      <RoomCanvasImpl room={room} scale={scale} />
    </Suspense>
  )
}
