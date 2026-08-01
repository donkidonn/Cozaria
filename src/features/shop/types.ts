export interface ShopItem {
  id: string
  name: string
  description: string | null
  price: number
  sprite_key: string | null
  category: string | null
  created_at: string
}

export interface OwnedItem {
  id: string
  user_id: string
  item_id: string
  acquired_at: string
  placement: unknown
}
