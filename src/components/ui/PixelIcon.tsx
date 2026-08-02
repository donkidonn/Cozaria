/**
 * Hand-built 16x16 pixel icons, transcribed from the inline SVGs in
 * design_handoff_cozaria/Cozaria Desktop.dc.html.
 *
 * They stay as inline SVG rather than sprite-sheet crops because they're
 * chrome, not room furniture — the tileset has no UI glyphs. Colours are
 * literal here on purpose: each rect is a pixel of artwork, not a themeable
 * surface, and the handoff treats these as fixed art.
 */

export type PixelIconName =
  | 'logo'
  | 'world'
  | 'study'
  | 'focus'
  | 'shop'
  | 'settings'
  | 'avatar'
  | 'cat'

interface PixelIconProps {
  name: PixelIconName
  size?: number
  className?: string
}

const PATHS: Record<PixelIconName, React.ReactNode> = {
  logo: (
    <>
      <rect x="2" y="2" width="12" height="12" fill="#EFD9AE" />
      <rect x="2" y="2" width="12" height="2" fill="#9C3A2B" />
      <rect x="7" y="2" width="2" height="12" fill="#3A2416" />
      <rect x="3" y="6" width="3" height="1" fill="#4374A0" />
      <rect x="9" y="6" width="4" height="1" fill="#5E8C46" />
      <rect x="3" y="9" width="4" height="1" fill="#4374A0" />
      <rect x="9" y="9" width="3" height="1" fill="#5E8C46" />
    </>
  ),
  world: (
    <>
      <rect x="7" y="2" width="2" height="2" fill="#5E8C46" />
      <rect x="6" y="3" width="4" height="2" fill="#5E8C46" />
      <rect x="3" y="7" width="10" height="7" fill="#9C3A2B" />
      <rect x="2" y="6" width="12" height="2" fill="#6E4527" />
      <rect x="6" y="10" width="4" height="4" fill="#3A2416" />
      <rect x="4" y="8" width="2" height="2" fill="#F4D58A" />
      <rect x="10" y="8" width="2" height="2" fill="#F4D58A" />
    </>
  ),
  study: (
    <>
      <rect x="2" y="3" width="12" height="11" fill="#EFD9AE" />
      <rect x="7" y="3" width="2" height="11" fill="#8A5A35" />
      <rect x="3" y="5" width="3" height="1" fill="#4374A0" />
      <rect x="3" y="7" width="4" height="1" fill="#4374A0" />
      <rect x="10" y="5" width="3" height="1" fill="#9C3A2B" />
      <rect x="10" y="7" width="4" height="1" fill="#9C3A2B" />
      <rect x="2" y="3" width="12" height="1" fill="#3A2416" />
    </>
  ),
  focus: (
    <>
      <rect x="3" y="2" width="10" height="2" fill="#8A5A35" />
      <rect x="3" y="12" width="10" height="2" fill="#8A5A35" />
      <rect x="4" y="4" width="8" height="2" fill="#F4D58A" />
      <rect x="6" y="6" width="4" height="2" fill="#E0A53B" />
      <rect x="7" y="8" width="2" height="1" fill="#E0A53B" />
      <rect x="6" y="9" width="4" height="3" fill="#E0A53B" />
    </>
  ),
  shop: (
    <>
      <rect x="4" y="3" width="8" height="2" fill="#8A5A35" />
      <rect x="3" y="5" width="10" height="9" fill="#9C3A2B" />
      <rect x="3" y="5" width="10" height="1" fill="#c25543" />
      <rect x="6" y="7" width="4" height="4" fill="#E0A53B" />
      <rect x="7" y="8" width="1" height="2" fill="#9c6b1e" />
    </>
  ),
  settings: (
    <>
      <rect x="7" y="2" width="2" height="12" fill="#8A5A35" />
      <rect x="2" y="7" width="12" height="2" fill="#8A5A35" />
      <rect x="4" y="4" width="8" height="8" fill="#cbb488" />
      <rect x="6" y="6" width="4" height="4" fill="#3A2416" />
    </>
  ),
  avatar: (
    <>
      <rect x="0" y="0" width="16" height="16" fill="#cfe0ec" />
      <rect x="4" y="2" width="8" height="3" fill="#E0A53B" />
      <rect x="3" y="4" width="2" height="7" fill="#E0A53B" />
      <rect x="11" y="4" width="2" height="7" fill="#E0A53B" />
      <rect x="5" y="4" width="6" height="7" fill="#f0c9a0" />
      <rect x="6" y="6" width="1" height="2" fill="#4374A0" />
      <rect x="9" y="6" width="1" height="2" fill="#4374A0" />
      <rect x="7" y="9" width="2" height="1" fill="#9C3A2B" />
      <rect x="4" y="11" width="8" height="5" fill="#EFD9AE" />
      <rect x="7" y="11" width="2" height="5" fill="#9C3A2B" />
    </>
  ),
  cat: (
    <>
      <rect x="3" y="3" width="2" height="3" fill="#c47f2a" />
      <rect x="11" y="3" width="2" height="3" fill="#c47f2a" />
      <rect x="3" y="5" width="10" height="6" fill="#E0A53B" />
      <rect x="4" y="4" width="8" height="2" fill="#E0A53B" />
      <rect x="4" y="6" width="2" height="2" fill="#3A2416" />
      <rect x="10" y="6" width="2" height="2" fill="#3A2416" />
      <rect x="7" y="8" width="2" height="1" fill="#9C3A2B" />
      <rect x="4" y="11" width="9" height="3" fill="#c47f2a" />
      <rect x="12" y="9" width="2" height="5" fill="#c47f2a" />
      <rect x="5" y="6" width="1" height="1" fill="#fff" />
      <rect x="11" y="6" width="1" height="1" fill="#fff" />
    </>
  ),
}

export function PixelIcon({ name, size = 26, className = '' }: PixelIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden
      focusable="false"
      className={className}
      style={{ imageRendering: 'pixelated', flex: 'none' }}
    >
      {PATHS[name]}
    </svg>
  )
}

/** The spinning coin used in the HUD chip and quest rewards. */
export function CoinGlyph({ size = 20 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="flex items-center justify-center rounded-full border-2 border-wood-deep bg-gold bevel-gold"
      style={{ width: size, height: size }}
    >
      <span
        className="rounded-full border-2 border-gold-shadow"
        style={{ width: size * 0.3, height: size * 0.3 }}
      />
    </span>
  )
}
