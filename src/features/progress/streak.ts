/**
 * A "study day" as UTC YYYY-MM-DD.
 *
 * UTC, not local time, because the award-coins Edge Function already defines a
 * day that way (`setUTCHours(0,0,0,0)` when it dedups reviews). If the HUD used
 * local dates it would disagree with the backend for however many hours the
 * user is offset from UTC — a UTC+8 user would see "0 reviewed today" every
 * morning while the server still refused to award coins for cards it counted
 * as already done today. One calendar, and it has to be the server's.
 */
export function toStudyDayKey(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toISOString().slice(0, 10)
}

function shiftDays(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10)
}

/** UTC midnight that opens the current study day. */
export function startOfStudyDay(now = new Date()): Date {
  const start = new Date(now)
  start.setUTCHours(0, 0, 0, 0)
  return start
}

/**
 * Consecutive study days ending today.
 *
 * Studying yesterday but not yet today still counts — the streak only breaks
 * once a full day passes with nothing, which is what every streak UI does.
 * Otherwise the number would drop to 0 at every midnight.
 */
export function calculateStreak(reviewDates: string[], today = new Date()): number {
  if (reviewDates.length === 0) return 0

  const days = new Set(reviewDates.map(toStudyDayKey))
  const todayKey = toStudyDayKey(today)

  let cursor = todayKey
  if (!days.has(cursor)) {
    cursor = shiftDays(todayKey, -1)
    if (!days.has(cursor)) return 0
  }

  let streak = 0
  while (days.has(cursor)) {
    streak++
    cursor = shiftDays(cursor, -1)
  }

  return streak
}
