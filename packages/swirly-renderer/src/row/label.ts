import { RowLabelStyles } from '@swirly/types'

import { RendererContext } from '../types.js'
import { mergeStyles } from '../util/merge-styles.js'
import { createSvgElement } from '../util/svg-xml.js'

/**
 * Renders a row's label into the gutter, right-aligned against the first
 * column. Shared by every grid row kind, including the axis header.
 */
export const renderRowLabel = (
  ctx: RendererContext,
  title: string | null,
  gutterWidth: number,
  rowHeight: number
): SVGElement | null => {
  if (title == null || title === '') {
    return null
  }

  const s: RowLabelStyles = mergeStyles(ctx.styles, null, 'row_label_')

  return createSvgElement(
    ctx.document,
    'text',
    {
      x: Math.max(0, gutterWidth - s.gap!),
      y: rowHeight / 2,
      fill: s.color!,
      'font-family': s.font_family!,
      'font-size': s.font_size! + 'px',
      'font-weight': s.font_weight!,
      'font-style': s.font_style!,
      'dominant-baseline': 'middle',
      'text-anchor': 'end'
    },
    title
  )
}
