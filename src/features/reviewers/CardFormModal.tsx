import { useEffect, useRef, useState } from 'react'
import type { Card } from './types'

interface Props {
  card?: Card | null
  onSave: (fields: { front: string; back: string; hint?: string }) => Promise<void>
  onClose: () => void
  /** When true, form resets after save so user can add another card quickly */
  keepOpen?: boolean
}

export function CardFormModal({ card, onSave, onClose, keepOpen }: Props) {
  const [front, setFront] = useState(card?.front ?? '')
  const [back, setBack] = useState(card?.back ?? '')
  const [hint, setHint] = useState(card?.hint ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const frontRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    frontRef.current?.focus()
  }, [])

  const reset = () => {
    setFront('')
    setBack('')
    setHint('')
    setSaved(true)
    setTimeout(() => setSaved(false), 1200)
    frontRef.current?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedFront = front.trim()
    const trimmedBack = back.trim()
    if (!trimmedFront || !trimmedBack) return

    setSaving(true)
    setError(null)
    try {
      await onSave({
        front: trimmedFront,
        back: trimmedBack,
        hint: hint.trim() || undefined,
      })
      if (keepOpen && !card) {
        reset()
      } else {
        onClose()
      }
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
      <div className="w-full max-w-lg rounded-xl border-2 border-wood-light bg-wood p-6 shadow-xl">
        <h2 className="mb-4 font-heading text-2xl text-gold-glow">
          {card ? 'Edit Card' : 'Add Card'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block font-heading text-sm text-parchment">Front</label>
            <textarea
              ref={frontRef}
              value={front}
              onChange={(e) => setFront(e.target.value)}
              required
              rows={3}
              placeholder="Question or term"
              className="w-full resize-none rounded-lg border border-wood-light bg-parchment-light px-4 py-2.5 font-body text-sm text-wood-dark placeholder:text-brick outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>

          <div>
            <label className="mb-1 block font-heading text-sm text-parchment">Back</label>
            <textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              required
              rows={3}
              placeholder="Answer or definition"
              className="w-full resize-none rounded-lg border border-wood-light bg-parchment-light px-4 py-2.5 font-body text-sm text-wood-dark placeholder:text-brick outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>

          <div>
            <label className="mb-1 block font-heading text-sm text-parchment">
              Hint <span className="text-xs text-brick">(optional)</span>
            </label>
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="A little nudge…"
              className="w-full rounded-lg border border-wood-light bg-parchment-light px-4 py-2.5 font-body text-sm text-wood-dark placeholder:text-brick outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>

          {error && (
            <p className="rounded bg-mahogany/20 px-3 py-2 font-body text-xs text-mahogany">
              {error}
            </p>
          )}

          {saved && (
            <p className="rounded bg-green/20 px-3 py-2 font-body text-xs text-green">
              Card added! Keep going.
            </p>
          )}

          <div className="flex items-center justify-between">
            {!card && (
              <label className="flex items-center gap-2 font-body text-xs text-parchment">
                <span>Add multiple</span>
              </label>
            )}
            <div className="ml-auto flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-wood-light px-4 py-2 font-heading text-sm text-parchment transition hover:bg-wood-light"
              >
                {keepOpen && !card ? 'Done' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={saving || !front.trim() || !back.trim()}
                className="rounded-lg bg-gold px-4 py-2 font-heading text-sm font-bold text-wood-dark transition hover:bg-gold-glow disabled:opacity-50"
              >
                {saving ? 'Saving…' : card ? 'Save Changes' : keepOpen ? 'Add & Next' : 'Add Card'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
