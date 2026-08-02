import { supabase } from '../../lib/supabase'
import { calculateStreak, startOfStudyDay, toStudyDayKey } from './streak'

/**
 * How many cards count as "done for the day".
 *
 * The mockup shows a minutes goal ("32 / 60 min"), but nothing in the schema
 * records study *time* yet — study_sessions is a Phase 5 table. Cards reviewed
 * is the closest signal that actually exists, so the bar tracks that and says
 * so in its label. Swap this for minutes once Focus sessions land.
 */
export const DAILY_CARD_GOAL = 20

/** How far back to look when reconstructing the streak. */
const STREAK_WINDOW_DAYS = 120

export interface DailyProgress {
  reviewedToday: number
  goal: number
  streakDays: number
}

export async function fetchDailyProgress(): Promise<DailyProgress> {
  const since = new Date()
  since.setDate(since.getDate() - STREAK_WINDOW_DAYS)

  const { data, error } = await supabase
    .from('card_reviews')
    .select('reviewed_at')
    .gte('reviewed_at', since.toISOString())
    .order('reviewed_at', { ascending: false })

  if (error) throw error

  const rows = data ?? []
  const todayKey = toStudyDayKey(new Date())

  return {
    reviewedToday: rows.filter((r) => toStudyDayKey(r.reviewed_at) === todayKey).length,
    goal: DAILY_CARD_GOAL,
    streakDays: calculateStreak(rows.map((r) => r.reviewed_at)),
  }
}

export interface ContinueStudying {
  reviewerId: string
  title: string
  totalCards: number
  reviewedToday: number
}

/**
 * The deck to offer on the "Continue Studying" card: the most recently touched
 * reviewer that actually has cards in it. Returns null when the user has no
 * decks worth resuming.
 */
export async function fetchContinueStudying(): Promise<ContinueStudying | null> {
  const { data, error } = await supabase
    .from('reviewers')
    .select('id, title, updated_at, cards(id)')
    .order('updated_at', { ascending: false })

  if (error) throw error

  const rows = (data ?? []) as unknown as {
    id: string
    title: string
    cards: { id: string }[] | null
  }[]

  const deck = rows.find((r) => (r.cards?.length ?? 0) > 0)
  if (!deck) return null

  const cardIds = (deck.cards ?? []).map((c) => c.id)

  const { data: reviews, error: reviewError } = await supabase
    .from('card_reviews')
    .select('card_id')
    .in('card_id', cardIds)
    .gte('reviewed_at', startOfStudyDay().toISOString())

  if (reviewError) throw reviewError

  // The award-coins function dedups per card per day, but count distinct
  // anyway so progress can never exceed the deck size.
  const distinct = new Set((reviews ?? []).map((r) => r.card_id))

  return {
    reviewerId: deck.id,
    title: deck.title,
    totalCards: cardIds.length,
    reviewedToday: distinct.size,
  }
}
