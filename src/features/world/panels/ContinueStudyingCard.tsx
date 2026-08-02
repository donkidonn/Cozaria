import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchContinueStudying } from '../../progress/api'
import type { ContinueStudying } from '../../progress/api'

/** Real data: the user's most recently touched deck that has cards in it. */
export function ContinueStudyingCard() {
  const [deck, setDeck] = useState<ContinueStudying | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false
    fetchContinueStudying()
      .then((d) => {
        if (cancelled) return
        setDeck(d)
        setState('ready')
      })
      .catch(() => { if (!cancelled) setState('error') })
    return () => { cancelled = true }
  }, [])

  return (
    <section className="rounded-md border-[3px] border-wood-dark bg-parchment p-3.5 bevel-parchment">
      <p className="font-body text-[0.7rem] uppercase tracking-widest text-ink-soft">
        Continue Studying
      </p>

      {state === 'loading' && (
        <p className="mt-2 font-body text-sm text-ink">Looking up your decks…</p>
      )}

      {state === 'error' && (
        <p className="mt-2 font-body text-sm text-mahogany">Couldn&apos;t load your decks.</p>
      )}

      {state === 'ready' && !deck && (
        <>
          <p className="mb-2 mt-1 font-heading text-lg text-mahogany">No decks yet</p>
          <Link
            to="/reviewers"
            className="inline-block rounded border-2 border-wood-dark bg-gold px-4 py-1.5 font-heading text-sm text-wood-dark bevel-gold transition hover:brightness-105"
          >
            Make one
          </Link>
        </>
      )}

      {state === 'ready' && deck && (
        <>
          <h3 className="mb-2.5 mt-0.5 truncate font-heading text-lg text-mahogany" title={deck.title}>
            {deck.title}
          </h3>

          <div
            className="mb-2.5 h-2.5 overflow-hidden rounded-full border-2 border-wood-dark bg-wood-panel"
            role="progressbar"
            aria-valuenow={deck.reviewedToday}
            aria-valuemin={0}
            aria-valuemax={deck.totalCards}
            aria-label={`${deck.title} progress today`}
          >
            <div
              className="h-full bg-green"
              style={{
                width: `${deck.totalCards ? Math.min(100, (deck.reviewedToday / deck.totalCards) * 100) : 0}%`,
                boxShadow: 'inset 0 2px 0 var(--color-green-light)',
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="font-body text-xs text-ink">
              {deck.reviewedToday} of {deck.totalCards} cards today
            </span>
            <Link
              to={`/reviewers/${deck.reviewerId}/study`}
              className="rounded border-2 border-wood-dark bg-gold px-4 py-1.5 font-heading text-sm text-wood-dark bevel-gold transition hover:brightness-105"
            >
              Resume
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
