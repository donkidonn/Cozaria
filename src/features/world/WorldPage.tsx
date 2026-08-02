import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RoomCanvas, getSprite } from '../../game'
import type { PlacedItem, PlacementDraft } from '../../game'
import { ItemSprite, LAYER_HINT, formatFootprint } from '../../components/ui/ItemSprite'
import { fetchOwnedRoomItems, savePlacement } from './api'
import type { OwnedRoomItem } from './api'
import { DailyQuestsCard } from './panels/DailyQuestsCard'
import { ContinueStudyingCard } from './panels/ContinueStudyingCard'
import { CompanionCard } from './panels/CompanionCard'

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
    <div className="flex h-full min-h-0">
      {/* ─── centre: the room is the centrepiece ─────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
        <div className="flex flex-none justify-center p-6">
          <div className="relative">
            <RoomCanvas
              placedItems={placedItems}
              draft={draft}
              onPlace={handlePlace}
              onPickUp={handlePickUp}
            />

            {/* Room tag — click-through so it can't block placing on the
                tiles it covers. */}
            <div className="pointer-events-none absolute left-4 top-4 rounded-md border-2 border-wood-dark bg-parchment px-3.5 py-1.5 bevel-parchment">
              <p className="font-heading text-[0.95rem] leading-none text-mahogany">Your Study</p>
              <p className="font-body text-[0.7rem] text-ink">
                {placedItems.length === 0 ? 'just moved in — decorate it!' : `${placedItems.length} pieces placed`}
              </p>
            </div>

            {/* Primary actions overlay the canvas, but step out of the way
                while something is being placed. */}
            {!draft && (
              <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3">
                <Link
                  to="/focus"
                  className="whitespace-nowrap rounded-md border-[3px] border-wood-dark bg-gold px-5 py-2.5 font-heading text-base text-wood-dark plaque-lift transition hover:brightness-105"
                >
                  ✦ Start a Focus Session
                </Link>
                <Link
                  to="/reviewers"
                  className="whitespace-nowrap rounded-md border-[3px] border-wood-dark bg-wood px-4 py-2.5 font-heading text-base text-text-light plaque-lift-wood transition hover:brightness-110"
                >
                  Open Decks
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ─── decorating tray under the stage ──────────────── */}
        <div className="flex flex-col gap-4 px-6 pb-6">
          {notice && (
            <div className="rounded-md border-2 border-mahogany bg-mahogany/20 px-4 py-2 font-body text-sm text-text-light">
              {notice}
            </div>
          )}

          {draft && draftItem ? (
            <div className="flex flex-wrap items-center gap-3 rounded-md border-2 border-gold bg-wood px-4 py-2">
              <ItemSprite spriteKey={draft.spriteKey} size={32} />
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
                    className="rounded border-2 border-wood-light px-3 py-1.5 font-heading text-xs text-parchment transition hover:border-mahogany hover:bg-mahogany/20"
                  >
                    Back to Shelf
                  </button>
                )}
                <button
                  onClick={() => setDraft(null)}
                  className="rounded border-2 border-wood-light px-3 py-1.5 font-heading text-xs text-parchment transition hover:border-gold hover:bg-gold/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="font-body text-xs text-muted">
              Pick a piece from your shelf, then click a tile to set it down. Click a piece
              already in the room to move it again.
            </p>
          )}

          <section>
            <div className="mb-3 flex items-baseline gap-3">
              <h3 className="font-heading text-lg text-gold-glow">Your Shelf</h3>
              <span className="font-body text-xs text-muted">
                {stored.length} waiting · {placedItems.length} in the room
              </span>
            </div>

            {loading ? (
              <p className="font-heading text-base text-gold-glow">Loading your items…</p>
            ) : error ? (
              <div className="flex flex-col items-start gap-3">
                <p className="font-body text-mahogany">{error}</p>
                <button
                  onClick={() => { setLoading(true); load() }}
                  className="rounded-md border-2 border-wood-dark bg-gold px-4 py-2 font-heading text-sm text-wood-dark bevel-gold"
                >
                  Retry
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-md border-2 border-dashed border-wood-light p-6">
                <p className="font-heading text-lg text-parchment">No items yet</p>
                <p className="mt-1 font-body text-sm text-muted">
                  Visit the Shop to spend your coins on cozy decorations!
                </p>
              </div>
            ) : stored.length === 0 ? (
              <div className="rounded-md border-2 border-dashed border-wood-light p-6">
                <p className="font-heading text-base text-parchment">Shelf is empty</p>
                <p className="mt-1 font-body text-sm text-muted">
                  Everything you own is already in the room.
                </p>
              </div>
            ) : (
              <ul className="flex flex-wrap gap-3">
                {stored.map((item) => {
                  const sprite = getSprite(item.spriteKey)
                  const selected = draft?.ownedItemId === item.id

                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => selectFromInventory(item)}
                        disabled={!sprite}
                        title={item.description ?? item.name}
                        className={`flex w-[132px] flex-col items-center gap-2 rounded-md border-[3px] p-3 transition ${
                          selected
                            ? 'border-gold bg-gold/20'
                            : 'border-wood-dark bg-wood bevel-wood hover:brightness-110'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        <ItemSprite spriteKey={item.spriteKey} size={72} />
                        <span className="text-center font-heading text-xs text-gold-glow">
                          {item.name}
                        </span>
                        {sprite && (
                          <span className="text-center font-body text-[0.65rem] text-parchment">
                            {formatFootprint(sprite)} · {LAYER_HINT[sprite.layer]}
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
      </div>

      {/* ─── right: quests, continue, companion ──────────────── */}
      <aside className="flex w-[330px] flex-none flex-col gap-3.5 overflow-auto border-l-[3px] border-wood-deep bg-wood-panel p-4 bevel-panel">
        <DailyQuestsCard />
        <ContinueStudyingCard />
        <CompanionCard />
      </aside>
    </div>
  )
}
