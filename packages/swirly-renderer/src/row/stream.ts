import { GridStreamRowSpecification, GridStreamRowStyles } from '@swirly/types'

import { RendererContext, RendererResult } from '../types.js'
import { mergeStyles } from '../util/merge-styles.js'
import { createSvgElement } from '../util/svg-xml.js'
import { arrowheadProtrusion, renderGridArrow } from './arrow.js'
import { renderRowLabel } from './label.js'
import { assertSlotsMatchAxis } from './slots.js'
import { renderSlotValues } from './values.js'

/**
 * A grid stream row: a horizontal line running the width of the axis, ending in
 * an arrowhead — Sodium streams never complete — with each non-empty slot's
 * value typeset on the line it names. The line is drawn over the values so it
 * reads as striking through them, matching the book's figures.
 */
export const renderGridStreamRow = (
  ctx: RendererContext,
  row: GridStreamRowSpecification
): RendererResult => {
  const { document, styles, axis } = ctx
  const s: GridStreamRowStyles = mergeStyles(styles, row.styles, 'grid_row_')

  assertSlotsMatchAxis(row, axis)

  const height = s.height!
  const centerY = height / 2

  const $group = createSvgElement(document, 'g')

  for (const $text of renderSlotValues(ctx, row.slots, s, centerY)) {
    $group.appendChild($text)
  }

  const lineStart = axis.gutterWidth - s.lead!
  const lineEnd = axis.gutterWidth + axis.contentWidth + s.tail!

  for (const $el of renderGridArrow(
    document,
    styles,
    lineStart,
    lineEnd,
    centerY
  )) {
    $group.appendChild($el)
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
      x2: lineEnd + arrowheadProtrusion(styles),
      y2: height
    }
  }
}
