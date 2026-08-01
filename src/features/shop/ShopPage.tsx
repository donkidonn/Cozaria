import { useCallback, useEffect, useState } from 'react'
import { useWallet } from '../../lib/WalletContext'
import type { ShopItem } from './types'
import { fetchShopItems, fetchOwnedItems, buyItem } from './api'

const CATEGORY_ICONS: Record<string, string> = {
  furniture: '🪑',
  lighting: '💡',
  decor: '🖼',
  storage: '📦',
  rare: '✨',
}

export function ShopPage() {
  const { balance, setBalance } = useWallet()

  const [items, setItems] = useState<ShopItem[]>([])
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [buyError, setBuyError] = useState<string | null>(null)
  const [buySuccess, setBuySuccess] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [shopItems, owned] = await Promise.all([
        fetchShopItems(),
        fetchOwnedItems(),
      ])
      setItems(shopItems)
      setOwnedIds(new Set(owned.map((o) => o.item_id)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shop')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleBuy = async (item: ShopItem) => {
    setBuyError(null)
    setBuySuccess(null)
    setBuyingId(item.id)
    try {
      const result = await buyItem(item.id)
      setBalance(result.new_balance)
      setOwnedIds((prev) => new Set([...prev, item.id]))
      setBuySuccess(`Bought ${result.item_name}!`)
      setTimeout(() => setBuySuccess(null), 3000)
    } catch (err) {
      setBuyError(err instanceof Error ? err.message : 'Purchase failed')
      setTimeout(() => setBuyError(null), 4000)
    } finally {
      setBuyingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-heading text-xl text-gold-glow">Loading shop…</p>
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
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-heading text-3xl text-gold-glow">Shop</h2>
        <span className="flex items-center gap-1 rounded-lg bg-wood/60 px-4 py-1.5 font-heading text-sm text-gold">
          {balance ?? '--'}
          <span className="text-gold-glow">coins</span>
        </span>
      </div>

      {buySuccess && (
        <div className="mb-4 rounded-lg bg-green/20 px-4 py-2 font-body text-sm text-green">
          {buySuccess}
        </div>
      )}
      {buyError && (
        <div className="mb-4 rounded-lg bg-mahogany/20 px-4 py-2 font-body text-sm text-mahogany">
          {buyError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => {
          const owned = ownedIds.has(item.id)
          const buying = buyingId === item.id
          const canAfford = (balance ?? 0) >= item.price
          const icon = CATEGORY_ICONS[item.category ?? ''] ?? '📦'

          return (
            <div
              key={item.id}
              className={`flex flex-col rounded-xl border-2 p-4 transition ${
                owned
                  ? 'border-green/40 bg-wood/60'
                  : 'border-wood-light bg-wood hover:border-gold'
              }`}
            >
              {/* Placeholder sprite */}
              <div className="mb-3 flex h-20 items-center justify-center rounded-lg bg-parchment/20">
                <span className="text-3xl">{icon}</span>
              </div>

              <h3 className="mb-1 font-heading text-sm text-gold-glow line-clamp-1">
                {item.name}
              </h3>
              {item.description && (
                <p className="mb-3 font-body text-xs text-parchment line-clamp-2">
                  {item.description}
                </p>
              )}

              <div className="mt-auto flex items-center justify-between pt-2">
                <span className="font-heading text-sm text-gold">
                  {item.price} coins
                </span>

                {owned ? (
                  <span className="rounded-lg bg-green/20 px-3 py-1.5 font-heading text-xs text-green">
                    Owned
                  </span>
                ) : (
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={buying || !canAfford}
                    title={!canAfford ? 'Not enough coins' : undefined}
                    className="rounded-lg bg-gold px-3 py-1.5 font-heading text-xs font-bold text-wood-dark transition hover:bg-gold-glow disabled:opacity-50"
                  >
                    {buying ? 'Buying…' : 'Buy'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
