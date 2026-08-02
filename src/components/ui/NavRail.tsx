import { Link, useLocation } from 'react-router-dom'
import { PixelIcon } from './PixelIcon'
import type { PixelIconName } from './PixelIcon'

interface RailItem {
  to: string
  label: string
  icon: PixelIconName
  /** Prefix that keeps the tab lit for nested routes, e.g. /reviewers/:id. */
  prefix: string
}

const ITEMS: RailItem[] = [
  { to: '/world', label: 'World', icon: 'world', prefix: '/world' },
  { to: '/reviewers', label: 'Study', icon: 'study', prefix: '/reviewers' },
  { to: '/focus', label: 'Focus', icon: 'focus', prefix: '/focus' },
  { to: '/shop', label: 'Shop', icon: 'shop', prefix: '/shop' },
]

const PLAQUE =
  'w-[62px] rounded-md border-[3px] px-0 pb-1.5 pt-2.5 flex flex-col items-center gap-1 transition'

export function NavRail() {
  const { pathname } = useLocation()
  const isActive = (prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`)

  return (
    <nav
      aria-label="Main"
      className="flex w-[88px] flex-none flex-col items-center gap-[11px] border-r-[3px] border-wood-deep bg-wood-rail py-4 bevel-rail"
    >
      {ITEMS.map((item) => {
        const active = isActive(item.prefix)
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            className={`${PLAQUE} border-wood-dark ${
              active ? 'bg-gold bevel-gold' : 'bg-wood bevel-wood hover:brightness-110'
            }`}
          >
            <PixelIcon name={item.icon} size={26} />
            <span
              className={`font-heading text-xs ${active ? 'text-wood-dark' : 'text-text-light'}`}
            >
              {item.label}
            </span>
          </Link>
        )
      })}

      <div className="flex-1" />

      <Link
        to="/settings"
        aria-current={isActive('/settings') ? 'page' : undefined}
        className={`${PLAQUE} ${
          isActive('/settings')
            ? 'border-wood-dark bg-gold bevel-gold'
            : 'border-wood-deep bg-wood-rail hover:brightness-125'
        }`}
      >
        <PixelIcon name="settings" size={24} />
        <span
          className={`font-heading text-[0.7rem] ${
            isActive('/settings') ? 'text-wood-dark' : 'text-muted'
          }`}
        >
          Settings
        </span>
      </Link>
    </nav>
  )
}
