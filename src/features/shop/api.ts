import { supabase } from '../../lib/supabase'
import type { ShopItem, OwnedItem } from './types'

export async function fetchShopItems(): Promise<ShopItem[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('price', { ascending: true })

  if (error) throw error
  return (data ?? []) as ShopItem[]
}

export async function fetchOwnedItems(): Promise<OwnedItem[]> {
  const { data, error } = await supabase
    .from('owned_items')
    .select('*')

  if (error) throw error
  return (data ?? []) as OwnedItem[]
}

export interface BuyItemResult {
  new_balance: number
  item_name: string
}

export async function buyItem(itemId: string): Promise<BuyItemResult> {
  const response = await supabase.functions.invoke('buy-item', {
    body: { item_id: itemId },
  })

  if (response.error) {
    throw new Error(response.error.message ?? 'Purchase failed')
  }

  const data = response.data as BuyItemResult & { error?: string }
  if (data.error) {
    throw new Error(data.error)
  }

  return data
}
