import { CoinGlyph } from '../../../components/ui/PixelIcon'

/**
 * Static for now. There is no quests table and no quest-progress tracking —
 * the copy below is lifted straight from the design handoff so the layout can
 * be judged, and the card says outright that it isn't live.
 */
const PLACEHOLDER_QUESTS = [
  { label: 'Study for 30 minutes', reward: 20, done: true },
  { label: 'Review one deck', reward: 15, done: false },
  { label: 'Add 5 new cards', reward: 10, done: false },
]

export function DailyQuestsCard() {
  const done = PLACEHOLDER_QUESTS.filter((q) => q.done).length

  return (
    <section className="rounded-md border-[3px] border-wood-dark bg-parchment p-3.5 bevel-parchment">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="font-heading text-[1.05rem] text-wood-dark">Daily Quests</h3>
        <span className="font-body text-xs font-bold text-mahogany">
          {done} / {PLACEHOLDER_QUESTS.length}
        </span>
      </div>

      <ul className="flex flex-col gap-2.5">
        {PLACEHOLDER_QUESTS.map((quest) => (
          <li key={quest.label} className="flex items-center gap-2.5">
            <span
              className={`flex h-5 w-5 flex-none items-center justify-center rounded border-2 font-heading text-xs ${
                quest.done
                  ? 'border-green-dark bg-green text-parchment-light'
                  : 'border-wood-dark bg-parchment-light'
              }`}
            >
              {quest.done ? '✓' : ''}
            </span>
            <span
              className={`flex-1 font-body text-[0.8rem] ${
                quest.done ? 'text-ink line-through' : 'text-wood-dark'
              }`}
            >
              {quest.label}
            </span>
            <span className="inline-flex items-center gap-1 font-heading text-xs text-gold-shadow">
              <CoinGlyph size={13} />
              {quest.reward}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 border-t-2 border-parchment-shadow pt-2 font-body text-[0.65rem] text-ink-soft">
        Placeholder — quests aren&apos;t tracked yet.
      </p>
    </section>
  )
}
