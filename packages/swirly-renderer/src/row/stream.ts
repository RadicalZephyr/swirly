import { GridStreamRowSpecification, GridStreamRowStyles } from '@swirly/types'

import { RendererContext, RendererResult } from '../types.js'
import { createSvgElement } from '../util/svg-xml.js'
import { textStyle } from '../util/text-style.js'
import { renderGridArrow } from './arrow.js'
import { finishRow } from './label.js'
import { assertSlotsMatchAxis, rowStyles } from './slots.js'
import { renderColumnTexts, slotText } from './values.js'

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
  const s: GridStreamRowStyles = rowStyles(styles, row)

  assertSlotsMatchAxis(row, axis)

  const height = s.height!
  const centerY = height / 2

  const $group = createSvgElement(document, 'g')

  for (const $text of renderColumnTexts(
    ctx,
    row.slots.map(slotText),
    textStyle(s, 'value_'),
    centerY
  )) {
    $group.appendChild($text)
  }

  const lineStart = axis.gutterWidth - s.lead!
  const lineEnd = axis.width + s.tail!

  const arrow = renderGridArrow(ctx, lineStart, lineEnd, centerY)
  for (const $el of arrow.elements) {
    $group.appendChild($el)
  }

  return finishRow(ctx, $group, row.title, {
    left: lineStart,
    right: lineEnd + arrow.protrusion,
    height
  })
}
