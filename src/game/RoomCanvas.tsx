import { useEffect, useRef } from 'react'
import { createRoomGame } from './bridge'
import type { RoomGameHandle } from './bridge'
import { ROOM_SCALE } from './config'
import { STARTER_ROOM, roomPixelSize } from './rooms'
import type { RoomCanvasProps } from './RoomCanvasProps'

const NO_ITEMS: never[] = []

/**
 * Mounts the Phaser room inside React. This component owns the whole lifecycle
 * and is deliberately the only React file that knows the game exists — it talks
 * to it exclusively through the bridge handle.
 */
export function RoomCanvas({
  room = STARTER_ROOM,
  scale = ROOM_SCALE,
  placedItems = NO_ITEMS,
  draft = null,
  onPlace,
  onPickUp,
}: RoomCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<RoomGameHandle | null>(null)

  // The game is created once, so it must not close over this render's
  // handlers. Route them through a ref that every render refreshes.
  const handlersRef = useRef({ onPlace, onPickUp })
  handlersRef.current = { onPlace, onPickUp }

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const handle = createRoomGame(host, {
      scale,
      onPlace: (id, col, row) => handlersRef.current.onPlace?.(id, col, row),
      onPickUp: (id) => handlersRef.current.onPickUp?.(id),
    })
    gameRef.current = handle

    return () => {
      gameRef.current = null
      handle.destroy()
    }
  }, [scale])

  // State changes are pushed through the bridge rather than remounting.
  useEffect(() => {
    gameRef.current?.setRoom(room)
  }, [room])

  useEffect(() => {
    gameRef.current?.setPlacedItems(placedItems)
  }, [placedItems])

  useEffect(() => {
    gameRef.current?.setDraft(draft)
  }, [draft])

  const { width, height } = roomPixelSize(room, scale)

  return (
    <div
      ref={hostRef}
      // Reserve the exact canvas box so the page doesn't jump while Phaser boots.
      style={{ width, height, cursor: draft ? 'copy' : 'default' }}
      className="max-w-full overflow-hidden rounded-xl border-2 border-wood-light bg-wood-dark [&>canvas]:block"
      aria-label={`${room.name} — cozy room view`}
    />
  )
}
