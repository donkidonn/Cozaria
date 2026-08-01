import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Reviewer, Card } from './types'
import { fetchReviewer, fetchCards } from './api'
import { awardCoins } from '../../lib/wallet'
import { useWallet } from '../../lib/WalletContext'

type Phase = 'loading' | 'studying' | 'submitting' | 'summary' | 'error'

interface CardAnswer {
  card_id: string
  was_correct: boolean
}

export function StudyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { setBalance } = useWallet()

  const [reviewer, setReviewer] = useState<Reviewer | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [phase, setPhase] = useState<Phase>('loading')
  const [error, setError] = useState<string | null>(null)

  // Study state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [answers, setAnswers] = useState<CardAnswer[]>([])

  // Summary state
  const [coinsEarned, setCoinsEarned] = useState(0)
  const [newBalance, setNewBalance] = useState(0)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const [r, c] = await Promise.all([fetchReviewer(id), fetchCards(id)])
      setReviewer(r)
      if (c.length === 0) {
        setError('This reviewer has no cards. Add some cards first!')
        setPhase('error')
        return
      }
      setCards(c)
      setPhase('studying')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviewer')
      setPhase('error')
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const currentCard = cards[currentIndex]
  const isLastCard = currentIndex === cards.length - 1

  const handleAnswer = (wasCorrect: boolean) => {
    const answer: CardAnswer = { card_id: currentCard.id, was_correct: wasCorrect }
    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)

    if (isLastCard) {
      submitResults(newAnswers)
    } else {
      setCurrentIndex((i) => i + 1)
      setRevealed(false)
    }
  }

  const submitResults = async (finalAnswers: CardAnswer[]) => {
    setPhase('submitting')
    try {
      const result = await awardCoins(
        finalAnswers.map(({ card_id, was_correct }) => ({ card_id, was_correct })),
      )
      setCoinsEarned(result.coins_earned)
      setNewBalance(result.new_balance)
      setBalance(result.new_balance)
      setPhase('summary')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit results')
      setPhase('error')
    }
  }

  // ─── Loading ──────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-heading text-xl text-gold-glow">Preparing your study session…</p>
      </div>
    )
  }

  // ─── Error ────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="font-body text-mahogany">{error}</p>
        <button
          onClick={() => navigate(`/reviewers/${id}`)}
          className="rounded-lg bg-gold px-4 py-2 font-heading text-sm font-bold text-wood-dark hover:bg-gold-glow"
        >
          Back to Reviewer
        </button>
      </div>
    )
  }

  // ─── Submitting ───────────────────────────────────────────
  if (phase === 'submitting') {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-heading text-xl text-gold-glow">Tallying your coins…</p>
      </div>
    )
  }

  // ─── Summary ──────────────────────────────────────────────
  if (phase === 'summary') {
    const correct = answers.filter((a) => a.was_correct).length
    const wrong = answers.length - correct

    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md rounded-xl border-2 border-wood-light bg-wood p-8 text-center shadow-xl">
          <h2 className="mb-2 font-heading text-3xl text-gold-glow">Session Complete!</h2>
          <p className="mb-6 font-body text-sm text-parchment">
            {reviewer?.title}
          </p>

          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-wood-dark/40 p-3">
              <p className="font-heading text-2xl text-text-light">{answers.length}</p>
              <p className="font-heading text-xs text-brick">Reviewed</p>
            </div>
            <div className="rounded-lg bg-green/20 p-3">
              <p className="font-heading text-2xl text-green">{correct}</p>
              <p className="font-heading text-xs text-green/70">Correct</p>
            </div>
            <div className="rounded-lg bg-mahogany/20 p-3">
              <p className="font-heading text-2xl text-mahogany">{wrong}</p>
              <p className="font-heading text-xs text-mahogany/70">Missed</p>
            </div>
          </div>

          <div className="mb-6 rounded-lg border-2 border-gold/30 bg-gold/10 p-4">
            <p className="font-heading text-lg text-gold">
              {coinsEarned > 0
                ? `You earned ${coinsEarned} coins!`
                : 'No new coins — cards already reviewed today.'}
            </p>
            <p className="mt-1 font-body text-xs text-parchment">
              Balance: {newBalance} coins
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setCurrentIndex(0)
                setRevealed(false)
                setAnswers([])
                setPhase('studying')
              }}
              className="rounded-lg border border-wood-light px-4 py-2 font-heading text-sm text-parchment transition hover:bg-wood-light hover:text-gold-glow"
            >
              Study Again
            </button>
            <button
              onClick={() => navigate(`/reviewers/${id}`)}
              className="rounded-lg bg-gold px-4 py-2 font-heading text-sm font-bold text-wood-dark transition hover:bg-gold-glow"
            >
              Back to Reviewer
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Studying ─────────────────────────────────────────────
  return (
    <div className="flex flex-1 flex-col">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(`/reviewers/${id}`)}
          className="font-heading text-sm text-brick transition hover:text-gold"
        >
          &larr; Exit Study
        </button>
        <span className="font-heading text-sm text-parchment">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-8 h-2 overflow-hidden rounded-full bg-wood-light/40">
        <div
          className="h-full rounded-full bg-gold transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-lg">
          <div className="rounded-xl border-2 border-wood-light bg-parchment p-8 shadow-lg">
            {!revealed ? (
              <>
                <p className="mb-2 font-heading text-xs text-brick">Front</p>
                <p className="mb-6 font-body text-lg text-wood-dark leading-relaxed">
                  {currentCard.front}
                </p>

                {currentCard.hint && (
                  <p className="mb-6 font-body text-sm text-brick italic">
                    Hint: {currentCard.hint}
                  </p>
                )}

                <button
                  onClick={() => setRevealed(true)}
                  className="w-full rounded-lg bg-gold px-4 py-3 font-heading text-sm font-bold text-wood-dark transition hover:bg-gold-glow"
                >
                  Reveal Answer
                </button>
              </>
            ) : (
              <>
                <p className="mb-1 font-heading text-xs text-brick">Front</p>
                <p className="mb-4 font-body text-sm text-wood leading-relaxed">
                  {currentCard.front}
                </p>

                <div className="mb-6 border-t-2 border-dashed border-wood-light/50 pt-4">
                  <p className="mb-1 font-heading text-xs text-brick">Back</p>
                  <p className="font-body text-lg text-wood-dark leading-relaxed">
                    {currentCard.back}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleAnswer(false)}
                    className="flex-1 rounded-lg border-2 border-mahogany bg-mahogany/10 px-4 py-3 font-heading text-sm font-bold text-mahogany transition hover:bg-mahogany/20"
                  >
                    Missed
                  </button>
                  <button
                    onClick={() => handleAnswer(true)}
                    className="flex-1 rounded-lg border-2 border-green bg-green/10 px-4 py-3 font-heading text-sm font-bold text-green transition hover:bg-green/20"
                  >
                    Got it!
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
