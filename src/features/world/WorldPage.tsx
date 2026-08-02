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
  // Closed by default so the room reads as the centrepiece, like the mockup.
  const [shelfOpen, setShelfOpen] = useState(false)

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
      {/* ─── centre: the room fills the column, camera crops it ── */}
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <RoomCanvas
          placedItems={placedItems}
          draft={draft}
          onPlace={handlePlace}
          onPickUp={handlePickUp}
        />

        {/* Overlays are click-through unless they're interactive, so they
            never swallow a click meant for the tiles underneath. */}
        <div className="pointer-events-none absolute left-4 top-4 rounded-md border-2 border-wood-dark bg-parchment px-3.5 py-1.5 bevel-parchment">
          <p className="font-heading text-[0.95rem] leading-none text-mahogany">Your Study</p>
          <p className="font-body text-[0.7rem] text-ink">
            {placedItems.length === 0
              ? 'just moved in — decorate it!'
              : `${placedItems.length} pieces placed · drag to look around`}
          </p>
        </div>

        {notice && (
          <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-md border-2 border-mahogany bg-mahogany px-4 py-2 font-body text-sm text-text-light">
            {notice}
          </div>
        )}

        {/* ─── bottom overlay: actions, then the shelf drawer ─── */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col">
          <div className="pointer-events-none flex justify-center px-4 pb-3">
            {draft && draftItem ? (
              <div className="pointer-events-auto flex flex-wrap items-center gap-3 rounded-md border-[3px] border-gold bg-wood px-4 py-2">
                <ItemSprite spriteKey={draft.spriteKey} size={32} />
                <span className="font-heading text-sm text-gold-glow">
                  Placing {draftItem.name}
                </span>
                <span className="font-body text-xs text-parchment">
                  Green fits, red doesn&apos;t. Esc to cancel.
                </span>
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
            ) : (
              <div className="pointer-events-auto flex items-center gap-3">
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

          <div className="border-t-[3px] border-wood-deep bg-wood-panel bevel-topbar">
            <button
              onClick={() => setShelfOpen((v) => !v)}
              aria-expanded={shelfOpen}
              className="flex w-full items-center gap-3 px-4 py-2 text-left transition hover:brightness-110"
            >
              <span className="font-heading text-base text-gold-glow">Your Shelf</span>
              <span className="font-body text-xs text-muted">
                {stored.length} waiting · {placedItems.length} in the room
              </span>
              <span className="ml-auto font-heading text-sm text-parchment">
                {shelfOpen ? 'Hide ▾' : 'Open ▴'}
              </span>
            </button>

            {shelfOpen && (
              <div className="max-h-[228px] overflow-y-auto border-t-2 border-wood-deep px-4 py-3">
                {loading ? (
                  <p className="font-heading text-base text-gold-glow">Loading your items…</p>
                ) : error ? (
                  <div className="flex items-center gap-3">
                    <p className="font-body text-sm text-mahogany">{error}</p>
                    <button
                      onClick={() => { setLoading(true); load() }}
                      className="rounded-md border-2 border-wood-dark bg-gold px-4 py-1.5 font-heading text-sm text-wood-dark bevel-gold"
                    >
                      Retry
                    </button>
                  </div>
                ) : items.length === 0 ? (
                  <p className="font-body text-sm text-muted">
                    No items yet — visit the Shop to spend your coins on cozy decorations.
                  </p>
                ) : stored.length === 0 ? (
                  <p className="font-body text-sm text-muted">
                    Everything you own is already in the room. Click a piece to move it.
                  </p>
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
                            className={`flex w-[124px] flex-col items-center gap-1.5 rounded-md border-[3px] p-2.5 transition ${
                              selected
                                ? 'border-gold bg-gold/20'
                                : 'border-wood-dark bg-wood bevel-wood hover:brightness-110'
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            <ItemSprite spriteKey={item.spriteKey} size={64} />
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
              </div>
            )}
          </div>
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
