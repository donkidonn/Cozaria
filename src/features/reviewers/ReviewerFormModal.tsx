import { useEffect, useRef, useState } from 'react'
import type { Reviewer } from './types'

interface Props {
  reviewer?: Reviewer | null
  onSave: (fields: { title: string; description?: string }) => Promise<void>
  onClose: () => void
}

export function ReviewerFormModal({ reviewer, onSave, onClose }: Props) {
  const [title, setTitle] = useState(reviewer?.title ?? '')
  const [description, setDescription] = useState(reviewer?.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    setSaving(true)
    setError(null)
    try {
      await onSave({ title: trimmed, description: description.trim() || undefined })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-xl border-2 border-wood-light bg-wood p-6 shadow-xl">
        <h2 className="mb-4 font-heading text-2xl text-gold-glow">
          {reviewer ? 'Edit Reviewer' : 'New Reviewer'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block font-heading text-sm text-parchment">Title</label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={120}
              placeholder="e.g. Biology Chapter 5"
              className="w-full rounded-lg border border-wood-light bg-parchment-light px-4 py-2.5 font-body text-sm text-wood-dark placeholder:text-brick outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>

          <div>
            <label className="mb-1 block font-heading text-sm text-parchment">
              Description <span className="text-xs text-brick">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="What's this reviewer about?"
              className="w-full resize-none rounded-lg border border-wood-light bg-parchment-light px-4 py-2.5 font-body text-sm text-wood-dark placeholder:text-brick outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>

          {error && (
            <p className="rounded bg-mahogany/20 px-3 py-2 font-body text-xs text-mahogany">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-wood-light px-4 py-2 font-heading text-sm text-parchment transition hover:bg-wood-light"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="rounded-lg bg-gold px-4 py-2 font-heading text-sm font-bold text-wood-dark transition hover:bg-gold-glow disabled:opacity-50"
            >
              {saving ? 'Saving…' : reviewer ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
