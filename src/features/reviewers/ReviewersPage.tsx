import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Reviewer } from './types'
import { fetchReviewers, createReviewer, updateReviewer, deleteReviewer } from './api'
import { ReviewerFormModal } from './ReviewerFormModal'

export function ReviewersPage() {
  const navigate = useNavigate()
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Reviewer | null>(null)
  const [deleting, setDeleting] = useState<Reviewer | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      setReviewers(await fetchReviewers())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviewers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async (fields: { title: string; description?: string }) => {
    await createReviewer(fields)
    await load()
  }

  const handleEdit = async (fields: { title: string; description?: string }) => {
    if (!editing) return
    await updateReviewer(editing.id, fields)
    await load()
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await deleteReviewer(deleting.id)
      setDeleting(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleteLoading(false)
    }
  }

  // ─── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-heading text-xl text-gold-glow">Loading reviewers…</p>
      </div>
    )
  }

  // ─── Error ────────────────────────────────────────────────
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
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-heading text-3xl text-gold-glow">Your Reviewers</h2>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="rounded-lg bg-gold px-4 py-2 font-heading text-sm font-bold text-wood-dark transition hover:bg-gold-glow"
        >
          + New Reviewer
        </button>
      </div>

      {/* Empty state */}
      {reviewers.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-wood-light p-12">
          <p className="font-heading text-2xl text-parchment">No reviewers yet</p>
          <p className="font-body text-sm text-brick">
            Create your first flashcard reviewer to start studying!
          </p>
          <button
            onClick={() => { setEditing(null); setShowForm(true) }}
            className="rounded-lg bg-gold px-5 py-2.5 font-heading text-sm font-bold text-wood-dark transition hover:bg-gold-glow"
          >
            + Create Reviewer
          </button>
        </div>
      ) : (
        /* Reviewer grid */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviewers.map((r) => (
            <div
              key={r.id}
              className="group flex cursor-pointer flex-col rounded-xl border-2 border-wood-light bg-wood p-5 transition hover:border-gold"
              onClick={() => navigate(`/reviewers/${r.id}`)}
            >
              <h3 className="mb-1 font-heading text-lg text-gold-glow line-clamp-1">
                {r.title}
              </h3>
              {r.description && (
                <p className="mb-3 font-body text-sm text-parchment line-clamp-2">
                  {r.description}
                </p>
              )}
              <div className="mt-auto flex items-center justify-between pt-3">
                <span className="font-heading text-xs text-brick">
                  {r.card_count ?? 0} {r.card_count === 1 ? 'card' : 'cards'}
                </span>
                <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing(r); setShowForm(true) }}
                    className="rounded px-2 py-1 font-heading text-xs text-parchment transition hover:bg-wood-light hover:text-gold-glow"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleting(r) }}
                    className="rounded px-2 py-1 font-heading text-xs text-parchment transition hover:bg-mahogany/20 hover:text-mahogany"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {showForm && (
        <ReviewerFormModal
          reviewer={editing}
          onSave={editing ? handleEdit : handleCreate}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {/* Delete confirmation */}
      {deleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleting(null) }}
        >
          <div className="w-full max-w-sm rounded-xl border-2 border-wood-light bg-wood p-6 shadow-xl">
            <h2 className="mb-2 font-heading text-xl text-gold-glow">Delete Reviewer?</h2>
            <p className="mb-4 font-body text-sm text-parchment">
              <span className="font-semibold text-text-light">"{deleting.title}"</span>{' '}
              and all its cards will be permanently deleted.
            </p>
            {error && (
              <p className="mb-3 rounded bg-mahogany/20 px-3 py-2 font-body text-xs text-mahogany">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleting(null)}
                className="rounded-lg border border-wood-light px-4 py-2 font-heading text-sm text-parchment transition hover:bg-wood-light"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="rounded-lg bg-mahogany px-4 py-2 font-heading text-sm font-bold text-text-light transition hover:bg-mahogany/80 disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
