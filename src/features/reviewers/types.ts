export interface Reviewer {
  id: string
  user_id: string
  title: string
  description: string | null
  is_public: boolean
  created_at: string
  updated_at: string
  card_count?: number
}

export interface Card {
  id: string
  reviewer_id: string
  front: string
  back: string
  hint: string | null
  position: number
  created_at: string
}
