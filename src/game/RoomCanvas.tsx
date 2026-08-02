import { useEffect, useRef } from 'react'
import { createRoomGame } from './bridge'
import type { RoomGameHandle } from './bridge'
import { ROOM_SCALE } from './config'
import { STARTER_ROOM } from './rooms'
import type { RoomCanvasProps } from './RoomCanvasProps'

const NO_ITEMS: never[] = []

/**
 * Mounts the Phaser room inside React. This component owns the whole lifecycle
 * and is deliberately the only React file that knows the game exists — it talks
 * to it exclusively through the bridge handle.
 *
 * The canvas fills whatever box it's given; the room is larger than that box
 * and the camera crops it, so this component never sizes itself from the room.
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

    // Follow the container: window resizes, the shelf drawer opening, the
    // right panel appearing — all of it just changes this box.
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      handle.resize(width, height)
    })
    observer.observe(host)

    return () => {
      observer.disconnect()
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

  return (
    <div
      ref={hostRef}
      style={{ cursor: draft ? 'copy' : 'grab' }}
      className="absolute inset-0 overflow-hidden bg-wood-dark [&>canvas]:block"
      aria-label={`${room.name} — cozy room view`}
    />
  )
}
