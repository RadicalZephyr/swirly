import { FontDescription, TextMeasurer } from '@swirly/types'

// Measurements are memoized across renders: the presenter re-renders on every
// keystroke, and nearly every string survives from one render to the next. The
// memo is bounded, because every intermediate string typed on the way to a
// value would otherwise stay in it for the life of the editor. When it fills
// it is dropped wholesale, and the next render repopulates it with what the
// diagram contains at that point, which is all that is worth keeping.
const MEMO_LIMIT = 4096

/**
 * Exact text measurement via a 2d canvas.
 *
 * The renderer falls back to an estimator built from Arial advance widths when
 * it has no measurer, because the Node path has no layout engine at all. In the
 * browser there is one, so grid columns can be sized to their contents exactly
 * rather than to within a few percent.
 */
export const createCanvasTextMeasurer = (): TextMeasurer => {
  const context = document.createElement('canvas').getContext('2d')!
  const widths = new Map<string, number>()

  return (text: string, font: FontDescription): number => {
    const css = `${font.style} ${String(font.weight)} ${font.size}px ${
      font.family
    }`
    const key = css + '\0' + text
    let width = widths.get(key)
    if (width == null) {
      context.font = css
      width = context.measureText(text).width
      if (widths.size >= MEMO_LIMIT) {
        widths.clear()
      }
      widths.set(key, width)
    }
    return width
  }
}
