import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import { useWallet } from '../../lib/WalletContext'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/reviewers', label: 'Reviewers' },
  { to: '/shop', label: 'Shop' },
  { to: '/world', label: 'World' },
] as const

export function AppLayout() {
  const { user, signOut } = useAuth()
  const { balance } = useWallet()

  return (
    <div className="flex min-h-screen flex-col bg-wood-dark">
      <header className="flex items-center justify-between border-b border-wood-light bg-wood px-6 py-3">
        <h1 className="font-heading text-2xl text-gold-glow">Cozaria</h1>

        <nav className="flex gap-1">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 font-heading text-sm transition ${
                  isActive
                    ? 'bg-gold text-wood-dark'
                    : 'text-parchment hover:bg-wood-light hover:text-gold-glow'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 rounded-lg bg-wood-dark/50 px-3 py-1 font-heading text-sm text-gold">
            {balance ?? '--'}
            <span className="text-gold-glow">coins</span>
          </span>
          <span className="font-body text-xs text-parchment truncate max-w-[140px]">
            {user?.email}
          </span>
          <button
            onClick={signOut}
            className="rounded-lg border border-wood-light px-3 py-1.5 font-heading text-xs text-parchment transition hover:border-mahogany hover:bg-mahogany/20 hover:text-text-light"
          >
            Log Out
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col p-6">
        <Outlet />
      </main>
    </div>
  )
}
