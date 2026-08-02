import { PixelIcon } from '../../../components/ui/PixelIcon'

/**
 * Static slot. Pets are in the design handoff's entity list but no pet table,
 * levels, or state machine exist yet — this reserves the layout position and
 * says so rather than implying a feature that isn't there.
 */
export function CompanionCard() {
  return (
    <section className="rounded-md border-[3px] border-wood-dark bg-parchment p-3.5 bevel-parchment">
      <div className="flex items-center gap-3">
        <div className="flex h-[54px] w-[54px] flex-none items-center justify-center rounded-md border-2 border-wood-dark bg-parchment-light">
          <PixelIcon name="cat" size={38} />
        </div>
        <div className="min-w-0">
          <p className="font-heading text-base text-wood-dark">Your companion</p>
          <p className="font-body text-xs leading-snug text-ink">
            A study pet will curl up here once the feature is built.
          </p>
        </div>
      </div>

      <p className="mt-3 border-t-2 border-parchment-shadow pt-2 font-body text-[0.65rem] text-ink-soft">
        Placeholder — pets aren&apos;t implemented.
      </p>
    </section>
  )
}
