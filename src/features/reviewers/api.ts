import { supabase } from '../../lib/supabase'
import type { Reviewer, Card } from './types'

// ─── Reviewers ──────────────────────────────────────────────

export async function fetchReviewers(): Promise<Reviewer[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get reviewers with a card count via a subquery
  const { data, error } = await supabase
    .from('reviewers')
    .select('*, cards(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((r) => ({
    ...r,
    card_count: (r.cards as unknown as { count: number }[])?.[0]?.count ?? 0,
    cards: undefined,
  })) as Reviewer[]
}

export async function fetchReviewer(id: string): Promise<Reviewer> {
  const { data, error } = await supabase
    .from('reviewers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Reviewer
}

export async function createReviewer(
  fields: { title: string; description?: string },
): Promise<Reviewer> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('reviewers')
    .insert({ ...fields, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data as Reviewer
}

export async function updateReviewer(
  id: string,
  fields: { title?: string; description?: string },
): Promise<Reviewer> {
  const { data, error } = await supabase
    .from('reviewers')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Reviewer
}

export async function deleteReviewer(id: string): Promise<void> {
  const { error } = await supabase
    .from('reviewers')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ─── Cards ──────────────────────────────────────────────────

export async function fetchCards(reviewerId: string): Promise<Card[]> {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('reviewer_id', reviewerId)
    .order('position', { ascending: true })

  if (error) throw error
  return (data ?? []) as Card[]
}

export async function createCard(
  reviewerId: string,
  fields: { front: string; back: string; hint?: string },
): Promise<Card> {
  // Get the next position
  const { count } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('reviewer_id', reviewerId)

  const { data, error } = await supabase
    .from('cards')
    .insert({ ...fields, reviewer_id: reviewerId, position: count ?? 0 })
    .select()
    .single()

  if (error) throw error
  return data as Card
}

export async function updateCard(
  id: string,
  fields: { front?: string; back?: string; hint?: string | null },
): Promise<Card> {
  const { data, error } = await supabase
    .from('cards')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Card
}

export async function deleteCard(id: string): Promise<void> {
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', id)

  if (error) throw error
}
