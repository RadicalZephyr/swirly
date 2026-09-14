import {
  GridAnnotationRowSpecification,
  GridAnnotationRowStyles
} from '@swirly/types'

import { RendererContext, RendererResult } from '../types.js'
import { createSvgElement } from '../util/svg-xml.js'
import { textStyle } from '../util/text-style.js'
import { finishRow } from './label.js'
import { assertSlotsMatchAxis, rowStyles } from './slots.js'
import { renderColumnTexts, slotText } from './values.js'

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
  const s: GridAnnotationRowStyles = rowStyles(styles, row)

  assertSlotsMatchAxis(row, axis)

  const height = s.height!
  const $group = createSvgElement(document, 'g')

  for (const $text of renderColumnTexts(
    ctx,
    row.slots.map(slotText),
    textStyle(s, 'value_'),
    height / 2
  )) {
    $group.appendChild($text)
  }

  return finishRow(ctx, $group, row.title, { right: axis.width, height })
}
