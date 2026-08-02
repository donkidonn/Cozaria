import { Outlet } from 'react-router-dom'
import { NavRail } from './NavRail'
import { TopHud } from './TopHud'

/**
 * The app shell: HUD across the top, icon rail down the left, page content in
 * the remaining area. Every route renders inside this — no page draws its own
 * chrome.
 *
 * Desktop-first per the handoff (1280x720 reference). The shell fills the
 * viewport and only the content area scrolls, so the HUD and rail stay put.
 */
export function AppLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-wood-dark">
      <TopHud />

      <div className="flex min-h-0 flex-1">
        <NavRail />

        {/* min-w-0 stops a wide child (the room canvas) forcing the whole
            shell to overflow horizontally. */}
        <main className="min-w-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
