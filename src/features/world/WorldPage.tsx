import { useCallback, useEffect, useMemo, useState } from 'react'
import { RoomCanvas, getSprite } from '../../game'
import type { FurnitureLayer, PlacedItem, PlacementDraft } from '../../game'
import { fetchOwnedRoomItems, savePlacement } from './api'
import type { OwnedRoomItem } from './api'
import { SpriteThumb } from './SpriteThumb'

/** Plain-English hint for what a piece stacks with, shown on each shelf card. */
const LAYER_HINT: Record<FurnitureLayer, string> = {
  floor: 'goes under',
  furniture: 'stands on floor',
  surface: 'sits on top',
}

export function WorldPage() {
  const [items, setItems] = useState<OwnedRoomItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [draft, setDraft] = useState<PlacementDraft | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setItems(await fetchOwnedRoomItems())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Escape drops whatever is on the cursor.
  useEffect(() => {
    if (!draft) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDraft(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [draft])

  const placedItems = useMemo<PlacedItem[]>(
    () =>
      items
        .filter((item) => item.placement && item.spriteKey && getSprite(item.spriteKey))
        .map((item) => ({
          ownedItemId: item.id,
          spriteKey: item.spriteKey as string,
          col: item.placement!.x,
          row: item.placement!.y,
        })),
    [items],
  )

  const stored = useMemo(() => items.filter((item) => !item.placement), [items])
  const draftItem = useMemo(
    () => items.find((item) => item.id === draft?.ownedItemId) ?? null,
    [items, draft],
  )

  /** Optimistic write — on failure we reload rather than guess at the truth. */
  const persist = useCallback(
    async (ownedItemId: string, placement: { x: number; y: number } | null) => {
      setNotice(null)
      setItems((prev) =>
        prev.map((item) => (item.id === ownedItemId ? { ...item, placement } : item)),
      )
      try {
        await savePlacement(ownedItemId, placement)
      } catch (err) {
        setNotice(err instanceof Error ? err.message : 'Could not save that move')
        load()
      }
    },
    [load],
  )

  const handlePlace = useCallback(
    (ownedItemId: string, col: number, row: number) => {
      setDraft(null)
      persist(ownedItemId, { x: col, y: row })
    },
    [persist],
  )

  const handlePickUp = useCallback(
    (ownedItemId: string) => {
      const item = items.find((candidate) => candidate.id === ownedItemId)
      if (!item?.spriteKey) return
      setDraft({ ownedItemId, spriteKey: item.spriteKey })
    },
    [items],
  )

  const selectFromInventory = useCallback((item: OwnedRoomItem) => {
    if (!item.spriteKey || !getSprite(item.spriteKey)) return
    setDraft({ ownedItemId: item.id, spriteKey: item.spriteKey })
  }, [])

  const returnToInventory = useCallback(() => {
    if (!draft) return
    setDraft(null)
    persist(draft.ownedItemId, null)
  }, [draft, persist])

  return (
    <>
      <div className="mb-6">
        <h2 className="font-heading text-3xl text-gold-glow">Your Room</h2>
        <p className="mt-1 font-body text-sm text-parchment">
          Pick something from your shelf, then click a tile to set it down. Click a piece
          already in the room to move it again.
        </p>
      </div>

      {notice && (
        <div className="mb-4 rounded-lg border-2 border-mahogany bg-mahogany/20 px-4 py-2 font-body text-sm text-text-light">
          {notice}
        </div>
      )}

      <div className="flex flex-col items-start gap-6 xl:flex-row">
        <div className="flex flex-col gap-3">
          <RoomCanvas
            placedItems={placedItems}
            draft={draft}
            onPlace={handlePlace}
            onPickUp={handlePickUp}
          />

          <div className="min-h-[3.25rem]">
            {draft && draftItem ? (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border-2 border-gold bg-wood px-4 py-2">
                <SpriteThumb spriteKey={draft.spriteKey} size={32} />
                <span className="font-heading text-sm text-gold-glow">
                  Placing {draftItem.name}
                </span>
                <span className="font-body text-xs text-parchment">
                  Green means it fits, red means it doesn&apos;t. Esc to cancel.
                </span>
                <div className="ml-auto flex gap-2">
                  {draftItem.placement && (
                    <button
                      onClick={returnToInventory}
                      className="rounded-lg border border-wood-light px-3 py-1.5 font-heading text-xs text-parchment transition hover:border-mahogany hover:bg-mahogany/20"
                    >
                      Back to Shelf
                    </button>
                  )}
                  <button
                    onClick={() => setDraft(null)}
                    className="rounded-lg border border-wood-light px-3 py-1.5 font-heading text-xs text-parchment transition hover:border-gold hover:bg-gold/20"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="font-body text-xs text-brick">
                Nothing selected. Choose a piece from your shelf to start decorating.
              </p>
            )}
          </div>
        </div>

        <section className="w-full xl:max-w-md">
          <h3 className="mb-1 font-heading text-xl text-gold-glow">Your Shelf</h3>
          <p className="mb-4 font-body text-xs text-brick">
            {stored.length} waiting · {placedItems.length} in the room
          </p>

          {loading ? (
            <p className="font-heading text-lg text-gold-glow">Loading your items…</p>
          ) : error ? (
            <div className="flex flex-col items-start gap-3">
              <p className="font-body text-mahogany">{error}</p>
              <button
                onClick={() => { setLoading(true); load() }}
                className="rounded-lg bg-gold px-4 py-2 font-heading text-sm font-bold text-wood-dark hover:bg-gold-glow"
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-wood-light p-8">
              <p className="font-heading text-xl text-parchment">No items yet</p>
              <p className="mt-1 font-body text-sm text-brick">
                Visit the Shop to spend your coins on cozy decorations!
              </p>
            </div>
          ) : stored.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-wood-light p-8">
              <p className="font-heading text-lg text-parchment">Shelf is empty</p>
              <p className="mt-1 font-body text-sm text-brick">
                Everything you own is already in the room.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {stored.map((item) => {
                const sprite = getSprite(item.spriteKey)
                const selected = draft?.ownedItemId === item.id

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => selectFromInventory(item)}
                      disabled={!sprite}
                      title={item.description ?? item.name}
                      className={`flex w-full flex-col items-center gap-2 rounded-xl border-2 p-3 transition ${
                        selected
                          ? 'border-gold bg-gold/20'
                          : 'border-wood-light bg-wood hover:border-gold-glow'
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <SpriteThumb spriteKey={item.spriteKey} size={56} />
                      <span className="text-center font-heading text-xs text-gold-glow">
                        {item.name}
                      </span>
                      {sprite && (
                        <span className="font-body text-[0.65rem] text-brick">
                          {sprite.widthTiles}×{sprite.heightTiles} · {LAYER_HINT[sprite.layer]}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
