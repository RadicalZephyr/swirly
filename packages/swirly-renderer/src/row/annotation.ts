import {
  GridAnnotationRowSpecification,
  GridAnnotationRowStyles
} from '@swirly/types'

import { RendererContext, RendererResult } from '../types.js'
import { mergeStyles } from '../util/merge-styles.js'
import { createSvgElement } from '../util/svg-xml.js'
import { renderRowLabel } from './label.js'
import { assertSlotsMatchAxis } from './slots.js'
import { renderSlotValues } from './values.js'

/**
 * A grid annotation row: a gutter label and one value per column, with no line
 * of its own — figure 20's `a1` / `a2` rows, which comment on a transaction
 * rather than carrying a stream.
 */
export const renderGridAnnotationRow = (
  ctx: RendererContext,
  row: GridAnnotationRowSpecification
): RendererResult => {
  const { document, styles, axis } = ctx
  const s: GridAnnotationRowStyles = mergeStyles(
    styles,
    row.styles,
    'grid_annotation_'
  )

  assertSlotsMatchAxis(row, axis)

  const height = s.height!
  const $group = createSvgElement(document, 'g')

  for (const $text of renderSlotValues(ctx, row.slots, s, height / 2)) {
    $group.appendChild($text)
  }

  const $label = renderRowLabel(ctx, row.title, axis.gutterWidth, height)
  if ($label != null) {
    $group.appendChild($label)
  }

  return {
    element: $group,
    bbox: {
      x1: 0,
      y1: 0,
      x2: axis.gutterWidth + axis.contentWidth,
      y2: height
    }
  }
}
