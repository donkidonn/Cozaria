import { useEffect, useRef } from 'react'
import { createRoomGame } from './bridge'
import type { RoomGameHandle } from './bridge'
import { ROOM_SCALE } from './config'
import { STARTER_ROOM, roomPixelSize } from './rooms'
import type { RoomCanvasProps } from './RoomCanvasProps'

/**
 * Mounts the Phaser room inside React. This component owns the whole lifecycle
 * and is deliberately the only React file that knows the game exists — it talks
 * to it exclusively through the bridge handle.
 */
export function RoomCanvas({ room = STARTER_ROOM, scale = ROOM_SCALE }: RoomCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<RoomGameHandle | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const handle = createRoomGame(host, { scale })
    gameRef.current = handle

    return () => {
      gameRef.current = null
      handle.destroy()
    }
  }, [scale])

  // Room changes are pushed through the bridge rather than remounting the game.
  useEffect(() => {
    gameRef.current?.setRoom(room)
  }, [room])

  const { width, height } = roomPixelSize(room, scale)

  return (
    <div
      ref={hostRef}
      // Reserve the exact canvas box so the page doesn't jump while Phaser boots.
      style={{ width, height }}
      className="max-w-full overflow-hidden rounded-xl border-2 border-wood-light bg-wood-dark [&>canvas]:block"
      aria-label={`${room.name} — cozy room view`}
    />
  )
}
