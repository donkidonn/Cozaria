import { useAuth } from '../auth/AuthContext'
import { PixelIcon } from '../../components/ui/PixelIcon'

export function SettingsPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <PixelIcon name="settings" size={32} />
        <h2 className="font-heading text-3xl text-gold-glow">Settings</h2>
      </div>

      <div className="rounded-lg border-[3px] border-wood-dark bg-parchment p-6 bevel-parchment">
        <p className="font-body text-[0.7rem] uppercase tracking-widest text-ink-soft">
          Signed in as
        </p>
        <p className="mt-1 font-heading text-lg text-wood-dark">{user?.email}</p>

        <button
          onClick={signOut}
          className="mt-5 rounded-md border-[3px] border-wood-dark bg-mahogany px-5 py-2 font-heading text-sm text-text-light transition hover:brightness-110"
        >
          Log Out
        </button>
      </div>

      <p className="mt-4 font-body text-xs text-muted">
        Preferences (daily goal, theme, audio) aren&apos;t built yet — this page only
        exposes account actions for now.
      </p>
    </div>
  )
}
