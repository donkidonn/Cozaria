import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Reviewer, Card } from './types'
import {
  fetchReviewer,
  fetchCards,
  createCard,
  updateCard,
  deleteCard,
  updateReviewer,
  deleteReviewer,
} from './api'
import { ReviewerFormModal } from './ReviewerFormModal'
import { CardFormModal } from './CardFormModal'

export function ReviewerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [reviewer, setReviewer] = useState<Reviewer | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals
  const [showEditReviewer, setShowEditReviewer] = useState(false)
  const [showDeleteReviewer, setShowDeleteReviewer] = useState(false)
  const [deleteReviewerLoading, setDeleteReviewerLoading] = useState(false)
  const [showAddCard, setShowAddCard] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [deletingCard, setDeletingCard] = useState<Card | null>(null)
  const [deleteCardLoading, setDeleteCardLoading] = useState(false)
  // Track which card is flipped to show its back
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    if (!id) return
    setError(null)
    try {
      const [r, c] = await Promise.all([fetchReviewer(id), fetchCards(id)])
      setReviewer(r)
      setCards(c)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviewer')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const toggleFlip = (cardId: string) => {
    setFlippedCards((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
      return next
    })
  }

  // ─── Reviewer actions ──────────────────────────────────────

  const handleEditReviewer = async (fields: { title: string; description?: string }) => {
    if (!id) return
    const updated = await updateReviewer(id, fields)
    setReviewer(updated)
  }

  const handleDeleteReviewer = async () => {
    if (!id) return
    setDeleteReviewerLoading(true)
    try {
      await deleteReviewer(id)
      navigate('/reviewers', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reviewer')
      setDeleteReviewerLoading(false)
    }
  }

  // ─── Card actions ──────────────────────────────────────────

  const handleAddCard = async (fields: { front: string; back: string; hint?: string }) => {
    if (!id) return
    await createCard(id, fields)
    await load()
  }

  const handleEditCard = async (fields: { front: string; back: string; hint?: string }) => {
    if (!editingCard) return
    await updateCard(editingCard.id, fields)
    await load()
  }

  const handleDeleteCard = async () => {
    if (!deletingCard) return
    setDeleteCardLoading(true)
    try {
      await deleteCard(deletingCard.id)
      setDeletingCard(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete card')
    } finally {
      setDeleteCardLoading(false)
    }
  }

  // ─── Loading ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-heading text-xl text-gold-glow">Loading…</p>
      </div>
    )
  }

  if (error && !reviewer) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="font-body text-mahogany">{error}</p>
        <button
          onClick={() => navigate('/reviewers')}
          className="rounded-lg bg-gold px-4 py-2 font-heading text-sm font-bold text-wood-dark hover:bg-gold-glow"
        >
          Back to Reviewers
        </button>
      </div>
    )
  }

  if (!reviewer) return null

  return (
    <>
      {/* Top bar */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/reviewers')}
          className="mb-3 font-heading text-sm text-brick transition hover:text-gold"
        >
          &larr; Back to Reviewers
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-3xl text-gold-glow">{reviewer.title}</h2>
            {reviewer.description && (
              <p className="mt-1 font-body text-sm text-parchment">{reviewer.description}</p>
            )}
            <p className="mt-1 font-heading text-xs text-brick">
              {cards.length} {cards.length === 1 ? 'card' : 'cards'}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => setShowEditReviewer(true)}
              className="rounded-lg border border-wood-light px-3 py-1.5 font-heading text-xs text-parchment transition hover:bg-wood-light hover:text-gold-glow"
            >
              Edit
            </button>
            <button
              onClick={() => setShowDeleteReviewer(true)}
              className="rounded-lg border border-wood-light px-3 py-1.5 font-heading text-xs text-parchment transition hover:bg-mahogany/20 hover:text-mahogany"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded bg-mahogany/20 px-3 py-2 font-body text-xs text-mahogany">
          {error}
        </p>
      )}

      {/* Action buttons */}
      <div className="mb-4 flex gap-3">
        {cards.length > 0 && (
          <button
            onClick={() => navigate(`/reviewers/${id}/study`)}
            className="rounded-lg bg-green px-4 py-2 font-heading text-sm font-bold text-text-light transition hover:bg-green/80"
          >
            Study
          </button>
        )}
        <button
          onClick={() => setShowAddCard(true)}
          className="rounded-lg bg-gold px-4 py-2 font-heading text-sm font-bold text-wood-dark transition hover:bg-gold-glow"
        >
          + Add Cards
        </button>
      </div>

      {/* Cards list */}
      {cards.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-wood-light p-12">
          <p className="font-heading text-2xl text-parchment">No cards yet</p>
          <p className="font-body text-sm text-brick">
            Add flashcards to start building this reviewer!
          </p>
          <button
            onClick={() => setShowAddCard(true)}
            className="rounded-lg bg-gold px-5 py-2.5 font-heading text-sm font-bold text-wood-dark transition hover:bg-gold-glow"
          >
            + Add Your First Card
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => {
            const isFlipped = flippedCards.has(card.id)
            return (
              <div
                key={card.id}
                className="group relative rounded-xl border-2 border-wood-light bg-parchment p-4 transition hover:border-gold"
              >
                {/* Card number badge */}
                <span className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-wood-light font-heading text-xs text-parchment-light">
                  {i + 1}
                </span>

                {/* Front/Back toggle */}
                <button
                  onClick={() => toggleFlip(card.id)}
                  className="mb-2 w-full text-left"
                >
                  <p className="font-heading text-xs text-brick">
                    {isFlipped ? 'Back' : 'Front'}
                  </p>
                  <p className="font-body text-sm text-wood-dark leading-relaxed">
                    {isFlipped ? card.back : card.front}
                  </p>
                </button>

                {card.hint && !isFlipped && (
                  <p className="mt-1 font-body text-xs text-brick italic">
                    Hint: {card.hint}
                  </p>
                )}

                {/* Action buttons */}
                <div className="mt-3 flex justify-end gap-1 border-t border-wood-light/40 pt-2 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => toggleFlip(card.id)}
                    className="rounded px-2 py-1 font-heading text-xs text-wood transition hover:bg-wood-light/30 hover:text-wood-dark"
                  >
                    Flip
                  </button>
                  <button
                    onClick={() => setEditingCard(card)}
                    className="rounded px-2 py-1 font-heading text-xs text-wood transition hover:bg-wood-light/30 hover:text-wood-dark"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingCard(card)}
                    className="rounded px-2 py-1 font-heading text-xs text-mahogany transition hover:bg-mahogany/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit reviewer modal */}
      {showEditReviewer && (
        <ReviewerFormModal
          reviewer={reviewer}
          onSave={handleEditReviewer}
          onClose={() => setShowEditReviewer(false)}
        />
      )}

      {/* Delete reviewer confirm */}
      {showDeleteReviewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteReviewer(false) }}
        >
          <div className="w-full max-w-sm rounded-xl border-2 border-wood-light bg-wood p-6 shadow-xl">
            <h2 className="mb-2 font-heading text-xl text-gold-glow">Delete Reviewer?</h2>
            <p className="mb-4 font-body text-sm text-parchment">
              <span className="font-semibold text-text-light">"{reviewer.title}"</span>{' '}
              and all {cards.length} {cards.length === 1 ? 'card' : 'cards'} will be permanently deleted.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteReviewer(false)}
                className="rounded-lg border border-wood-light px-4 py-2 font-heading text-sm text-parchment transition hover:bg-wood-light"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReviewer}
                disabled={deleteReviewerLoading}
                className="rounded-lg bg-mahogany px-4 py-2 font-heading text-sm font-bold text-text-light transition hover:bg-mahogany/80 disabled:opacity-50"
              >
                {deleteReviewerLoading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add card modal (keepOpen for multi-add) */}
      {showAddCard && (
        <CardFormModal
          onSave={handleAddCard}
          onClose={() => setShowAddCard(false)}
          keepOpen
        />
      )}

      {/* Edit card modal */}
      {editingCard && (
        <CardFormModal
          card={editingCard}
          onSave={handleEditCard}
          onClose={() => setEditingCard(null)}
        />
      )}

      {/* Delete card confirm */}
      {deletingCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setDeletingCard(null) }}
        >
          <div className="w-full max-w-sm rounded-xl border-2 border-wood-light bg-wood p-6 shadow-xl">
            <h2 className="mb-2 font-heading text-xl text-gold-glow">Delete Card?</h2>
            <p className="mb-4 font-body text-sm text-parchment">
              This card will be permanently deleted.
            </p>
            <div className="rounded-lg bg-parchment/80 p-3 mb-4">
              <p className="font-body text-xs text-wood-dark">
                <span className="font-semibold">Front:</span> {deletingCard.front}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingCard(null)}
                className="rounded-lg border border-wood-light px-4 py-2 font-heading text-sm text-parchment transition hover:bg-wood-light"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCard}
                disabled={deleteCardLoading}
                className="rounded-lg bg-mahogany px-4 py-2 font-heading text-sm font-bold text-text-light transition hover:bg-mahogany/80 disabled:opacity-50"
              >
                {deleteCardLoading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
