import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface OwnedItemWithDetails {
  id: string
  item_id: string
  acquired_at: string
  item: {
    name: string
    description: string | null
    sprite_key: string | null
    category: string | null
  }
}

const CATEGORY_ICONS: Record<string, string> = {
  furniture: '🪑',
  lighting: '💡',
  decor: '🖼',
  storage: '📦',
  rare: '✨',
}

export function WorldPage() {
  const [items, setItems] = useState<OwnedItemWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('owned_items')
        .select('id, item_id, acquired_at, items(name, description, sprite_key, category)')
        .order('acquired_at', { ascending: false })

      if (fetchError) throw fetchError

      const mapped = (data ?? []).map((row) => ({
        id: row.id,
        item_id: row.item_id,
        acquired_at: row.acquired_at,
        item: row.items as unknown as OwnedItemWithDetails['item'],
      }))

      setItems(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-heading text-xl text-gold-glow">Loading your room…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="font-body text-mahogany">{error}</p>
        <button
          onClick={() => { setLoading(true); load() }}
          className="rounded-lg bg-gold px-4 py-2 font-heading text-sm font-bold text-wood-dark hover:bg-gold-glow"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="font-heading text-3xl text-gold-glow">Your Room</h2>
        <p className="mt-1 font-body text-sm text-parchment">
          Items you've collected — room decoration coming soon.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-wood-light p-12">
          <p className="font-heading text-2xl text-parchment">No items yet</p>
          <p className="font-body text-sm text-brick">
            Visit the Shop to spend your coins on cozy decorations!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((owned) => {
            const icon = CATEGORY_ICONS[owned.item.category ?? ''] ?? '📦'
            return (
              <div
                key={owned.id}
                className="flex flex-col rounded-xl border-2 border-wood-light bg-wood p-4"
              >
                <div className="mb-3 flex h-20 items-center justify-center rounded-lg bg-parchment/20">
                  <span className="text-3xl">{icon}</span>
                </div>

                <h3 className="mb-1 font-heading text-sm text-gold-glow">
                  {owned.item.name}
                </h3>
                {owned.item.description && (
                  <p className="mb-2 font-body text-xs text-parchment line-clamp-2">
                    {owned.item.description}
                  </p>
                )}

                <p className="mt-auto font-body text-xs text-brick">
                  Acquired {new Date(owned.acquired_at).toLocaleDateString()}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
