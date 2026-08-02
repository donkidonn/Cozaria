import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import { useWallet } from '../../lib/WalletContext'
import { fetchDailyProgress } from '../../features/progress/api'
import type { DailyProgress } from '../../features/progress/api'
import { CoinGlyph, PixelIcon } from './PixelIcon'

export function TopHud() {
  const { user, signOut } = useAuth()
  const { balance } = useWallet()

  const [progress, setProgress] = useState<DailyProgress | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    fetchDailyProgress()
      .then((p) => { if (!cancelled) setProgress(p) })
      .catch(() => { /* HUD is ambient — a failed read shouldn't break the page */ })
    return () => { cancelled = true }
  }, [])

  // Close the profile menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const done = progress?.reviewedToday ?? 0
  const goal = progress?.goal ?? 0
  const pct = goal > 0 ? Math.min(100, Math.round((done / goal) * 100)) : 0

  return (
    <header className="flex h-[60px] flex-none items-center gap-5 border-b-[3px] border-wood-deep bg-wood-panel px-5 bevel-topbar">
      <Link to="/" className="flex items-center gap-2.5" title="Cozaria home">
        <PixelIcon name="logo" size={28} />
        <span className="font-heading text-2xl text-gold-glow">Cozaria</span>
      </Link>

      {/* Daily goal — real data, but counted in cards rather than minutes. */}
      <div className="flex flex-1 justify-center">
        <div
          className="flex min-w-[380px] items-center gap-3 rounded-full border-2 border-wood-dark bg-parchment px-4 py-1.5 bevel-parchment"
          title="Cards reviewed today. Minute-based goals arrive with Focus sessions."
        >
          <span className="whitespace-nowrap font-heading text-sm text-mahogany">Daily Goal</span>
          <div
            className="h-3 flex-1 overflow-hidden rounded-full border-2 border-wood-dark bg-wood-panel bevel-sunk"
            role="progressbar"
            aria-valuenow={done}
            aria-valuemin={0}
            aria-valuemax={goal}
            aria-label="Daily study goal"
          >
            <div
              className="h-full bg-gold transition-[width] duration-500"
              style={{ width: `${pct}%`, boxShadow: 'inset 0 2px 0 var(--color-gold-glow)' }}
            />
          </div>
          <span className="whitespace-nowrap font-heading text-sm text-wood-dark">
            {progress ? `${done} / ${goal} cards` : '— / — cards'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-wood-deep bg-wood-dark py-1.5 pl-1.5 pr-4">
          <CoinGlyph size={20} />
          <span className="font-heading text-lg text-gold-glow">
            {balance ?? '--'}
          </span>
        </div>

        <div
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-wood-dark bg-gold px-3 py-1 font-heading text-[0.95rem] text-wood-dark"
          title={`${progress?.streakDays ?? 0}-day study streak`}
        >
          ★ {progress?.streakDays ?? 0}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title={user?.email ?? 'Profile'}
            className="block h-[38px] w-[38px] rounded-md border-2 border-wood-dark bg-wood p-[3px] bevel-wood transition hover:border-gold"
          >
            <PixelIcon name="avatar" size={26} className="h-full w-full" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-20 mt-2 w-56 rounded-md border-[3px] border-wood-dark bg-parchment p-3 bevel-parchment"
            >
              <p className="mb-2 truncate font-body text-xs text-ink" title={user?.email ?? ''}>
                {user?.email}
              </p>
              <button
                onClick={signOut}
                role="menuitem"
                className="w-full rounded border-2 border-wood-dark bg-mahogany px-3 py-1.5 font-heading text-sm text-text-light transition hover:brightness-110"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
