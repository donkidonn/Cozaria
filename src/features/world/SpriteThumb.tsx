import { TILE_SIZE, TILESET_PATH, getSprite } from '../../game'

interface SpriteThumbProps {
  spriteKey: string | null
  /** Box the sprite is fitted into, in CSS pixels. */
  size?: number
}

/**
 * Renders one furniture sprite straight from the tileset with CSS.
 *
 * Deliberately not a Phaser canvas: the inventory needs a dozen small
 * thumbnails, and spinning up a WebGL context per tile would be absurd. The
 * atlas is plain data, so React can crop the sheet itself.
 */
export function SpriteThumb({ spriteKey, size = 64 }: SpriteThumbProps) {
  const sprite = getSprite(spriteKey)

  if (!sprite) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-md bg-wood-dark/40 font-body text-xs text-brick"
        title={spriteKey ? `No sprite for "${spriteKey}"` : 'No sprite'}
      >
        ?
      </div>
    )
  }

  const nativeWidth = sprite.widthTiles * TILE_SIZE
  const nativeHeight = sprite.heightTiles * TILE_SIZE
  // Fit inside the box without ever upscaling past a whole-pixel look.
  const scale = Math.min(size / nativeWidth, size / nativeHeight)

  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center"
    >
      <div
        style={{ width: nativeWidth * scale, height: nativeHeight * scale }}
        className="relative overflow-hidden"
      >
        <img
          src={TILESET_PATH}
          alt=""
          aria-hidden
          draggable={false}
          style={{
            transform: `scale(${scale}) translate(${-sprite.x}px, ${-sprite.y}px)`,
            transformOrigin: 'top left',
            imageRendering: 'pixelated',
            // Tailwind's preflight caps images at 100%; the sheet must stay native.
            maxWidth: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      </div>
    </div>
  )
}
