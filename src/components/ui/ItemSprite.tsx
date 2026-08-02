import { TILE_SIZE, TILESET_PATH, getSprite } from '../../game'
import type { FurnitureLayer, FurnitureSprite } from '../../game'

interface ItemSpriteProps {
  spriteKey: string | null
  /** Square box the sprite is letterboxed into, in CSS pixels. */
  size?: number
  className?: string
}

/** Plain-English hint for what a piece stacks with. */
export const LAYER_HINT: Record<FurnitureLayer, string> = {
  floor: 'goes under furniture',
  furniture: 'stands on floor',
  surface: 'sits on furniture',
}

/** e.g. "7×4" — the item's footprint in tiles. */
export function formatFootprint(sprite: FurnitureSprite): string {
  return `${sprite.widthTiles}×${sprite.heightTiles}`
}

/**
 * Picks a whole-number zoom so pixels stay square.
 *
 * Upscaling uses integer multiples (2x, 3x); downscaling uses integer divisors
 * (1/2, 1/3). A fractional ratio like 0.38 would still be sharp under
 * `image-rendering: pixelated`, but it drops source pixels unevenly, which
 * makes some rows of the art visibly thicker than others. Snapping trades a
 * little unused box space for art that reads correctly.
 */
function pixelPerfectScale(native: number, box: number): number {
  const raw = box / native
  if (raw >= 1) return Math.floor(raw)
  return 1 / Math.ceil(1 / raw)
}

/**
 * Renders one furniture sprite straight from the tileset with CSS.
 *
 * The single place the sheet is cropped outside the Phaser canvas — shop
 * cards, the World shelf, and the placing banner all come through here, so a
 * sprite can never drift between screens. Deliberately not a Phaser canvas:
 * the shop shows ten of these at once and a WebGL context each would be absurd.
 *
 * The sprite is letterboxed, never stretched — one scale factor drives both
 * axes, so the aspect ratio is preserved by construction.
 */
export function ItemSprite({ spriteKey, size = 64, className = '' }: ItemSpriteProps) {
  const sprite = getSprite(spriteKey)

  if (!sprite) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded-md bg-wood-dark/40 font-body text-xs text-brick ${className}`}
        title={spriteKey ? `No sprite for "${spriteKey}"` : 'No sprite'}
      >
        ?
      </div>
    )
  }

  const nativeWidth = sprite.widthTiles * TILE_SIZE
  const nativeHeight = sprite.heightTiles * TILE_SIZE
  const scale = Math.min(
    pixelPerfectScale(nativeWidth, size),
    pixelPerfectScale(nativeHeight, size),
  )

  return (
    <div
      style={{ width: size, height: size }}
      className={`flex items-center justify-center ${className}`}
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
