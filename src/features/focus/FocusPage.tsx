import { Link } from 'react-router-dom'
import { PixelIcon } from '../../components/ui/PixelIcon'

export function FocusPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="max-w-md rounded-lg border-[3px] border-wood-dark bg-parchment p-8 text-center bevel-parchment">
        <div className="mb-3 flex justify-center">
          <PixelIcon name="focus" size={56} />
        </div>
        <h2 className="font-heading text-2xl text-mahogany">Focus Sessions</h2>
        <p className="mt-2 font-body text-sm text-ink">
          The timer-driven study block from the design handoff isn&apos;t built yet — it
          arrives in Phase 5, along with the session tracking that will turn the daily
          goal into minutes.
        </p>
        <p className="mt-3 font-body text-xs text-ink-soft">
          Nothing on this page is wired to data.
        </p>
        <Link
          to="/reviewers"
          className="mt-5 inline-block rounded-md border-[3px] border-wood-dark bg-gold px-5 py-2 font-heading text-sm text-wood-dark bevel-gold transition hover:brightness-105"
        >
          Study a deck instead
        </Link>
      </div>
    </div>
  )
}
