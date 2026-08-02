import { Outlet } from 'react-router-dom'

/**
 * Layout route for every page except World.
 *
 * World is full-bleed — its three columns run to the shell edges like the
 * mockup — so the padding lives here rather than in AppLayout. The flex column
 * reproduces what the old `<main>` gave pages, so their `flex-1` centring keeps
 * working untouched.
 */
export function PaddedPage() {
  return (
    <div className="flex min-h-full flex-col p-6">
      <Outlet />
    </div>
  )
}
