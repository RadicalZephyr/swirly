import { FontDescription } from '@swirly/types'

// Advance widths in ems for the printable ASCII range, from the Helvetica AFM
// — the metrics Arial was drawn to match, and so a good stand-in for the
// `Arial, Helvetica, sans-serif` stack Swirly defaults to. Index 0 is U+0020.
const ADVANCES_EM = [
  0.278, 0.278, 0.355, 0.556, 0.556, 0.889, 0.667, 0.191, 0.333, 0.333, 0.389,
  0.584, 0.278, 0.333, 0.278, 0.278, 0.556, 0.556, 0.556, 0.556, 0.556, 0.556,
  0.556, 0.556, 0.556, 0.556, 0.278, 0.278, 0.584, 0.584, 0.584, 0.556, 1.015,
  0.667, 0.667, 0.722, 0.722, 0.667, 0.611, 0.778, 0.722, 0.278, 0.5, 0.667,
  0.556, 0.833, 0.722, 0.778, 0.667, 0.778, 0.722, 0.667, 0.611, 0.722, 0.667,
  0.944, 0.667, 0.667, 0.611, 0.278, 0.278, 0.278, 0.469, 0.556, 0.333, 0.556,
  0.556, 0.5, 0.556, 0.556, 0.278, 0.556, 0.556, 0.222, 0.222, 0.5, 0.222,
  0.833, 0.556, 0.556, 0.556, 0.556, 0.333, 0.5, 0.278, 0.556, 0.5, 0.722, 0.5,
  0.5, 0.5, 0.334, 0.26, 0.334, 0.584
]

const FIRST_CODE_POINT = 0x20
const FALLBACK_EM = 0.556

// Arial Bold runs a little wider than regular at the same size; Arial Italic
// shares the regular advance widths.
const BOLD_FACTOR = 1.06

const isBold = (weight: string | number): boolean =>
  weight === 'bold' ||
  weight === 'bolder' ||
  (typeof weight === 'number' && weight >= 600) ||
  (typeof weight === 'string' && Number(weight) >= 600)

/**
 * Estimates the rendered width of a string without a layout engine.
 *
 * The Node path parses SVG into `@xmldom/xmldom`, which has no text metrics at
 * all, so content-sized columns would otherwise be impossible there. Summing
 * per-character advance widths is accurate to roughly ±8% for the default font
 * stack and worse for families with very different proportions — which is why
 * `axis_column_sizing` defaults to `uniform`, where an estimator error makes
 * every column equally too wide rather than one column visibly wrong.
 *
 * Pass `RendererOptions.measureText` to replace this with a real measurement
 * wherever one is available; the web app hands in a 2d canvas `measureText`.
 */
export const estimateTextWidth = (
  text: string,
  font: FontDescription
): number => {
  let em = 0
  for (const character of text) {
    const index = character.codePointAt(0)! - FIRST_CODE_POINT
    em += ADVANCES_EM[index] ?? FALLBACK_EM
  }
  if (isBold(font.weight)) {
    em *= BOLD_FACTOR
  }
  return em * font.size
}
