import { Suspense, lazy } from 'react'
import type { RoomCanvasProps } from './RoomCanvasProps'

// Phaser is ~1.4MB. Loading it lazily keeps it out of the main bundle so the
// login/dashboard pages don't pay for a canvas they never render.
const RoomCanvasImpl = lazy(() =>
  import('./RoomCanvas').then((m) => ({ default: m.RoomCanvas })),
)

/**
 * Public room view. Fills its positioned parent, and shows a matching
 * placeholder while the Phaser chunk downloads so nothing shifts when the
 * canvas appears.
 */
export function RoomCanvas(props: RoomCanvasProps) {
  const placeholder = (
    <div className="absolute inset-0 flex items-center justify-center bg-wood-dark">
      <p className="font-heading text-lg text-gold-glow">Opening your room…</p>
    </div>
  )

  return (
    <Suspense fallback={placeholder}>
      <RoomCanvasImpl {...props} />
    </Suspense>
  )
}
