import { ArrowStyles } from '@swirly/types'

import { arrowheadProtrusion, renderArrowLine } from '../arrow.js'
import { RendererContext } from '../types.js'
import { mergeStyles } from '../util/merge-styles.js'

export type GridArrow = {
  elements: SVGElement[]
  // How far the head's mitre reaches past `x2`, for the row's bounding box.
  protrusion: number
}

/**
 * The arrow every grid row ends in -- Sodium streams and cells never complete
 * -- drawn by the same code as a marble stream's, so the two agree on the
 * head's shape and on `arrow_fill_color`.
 */
export const renderGridArrow = (
  { document, styles }: RendererContext,
  x1: number,
  x2: number,
  y: number
): GridArrow => {
  const arrowStyles: ArrowStyles = mergeStyles(styles, null, 'arrow_')
  const angle = styles.arrowhead_angle!
  return {
    elements: renderArrowLine(document, arrowStyles, angle, x1, x2, y),
    protrusion: arrowheadProtrusion(arrowStyles, angle)
  }
}
