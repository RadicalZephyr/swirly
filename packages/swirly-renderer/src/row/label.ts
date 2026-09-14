import { RowLabelStyles } from '@swirly/types'

import { RendererContext, RendererResult } from '../types.js'
import { mergeStyles } from '../util/merge-styles.js'
import { createSvgElement } from '../util/svg-xml.js'
import { textAttributes } from '../util/text-style.js'

/**
 * Renders a row's label into the gutter, right-aligned against the first
 * column. Shared by every grid row kind, including the axis header.
 */
export const renderRowLabel = (
  { document, styles, axis }: RendererContext,
  title: string | null,
  rowHeight: number
): SVGElement | null => {
  if (title == null || title === '') {
    return null
  }

  const s: RowLabelStyles = mergeStyles(styles, null, 'row_label_')

  return createSvgElement(
    document,
    'text',
    {
      x: Math.max(0, axis.gutterWidth - s.gap!),
      y: rowHeight / 2,
      ...textAttributes(s),
      'dominant-baseline': 'middle',
      'text-anchor': 'end'
    },
    title
  )
}

export type RowExtent = {
  // Where the row's drawing starts when that is left of 0: a line's lead-in
  // when no row is labelled and the gutter has collapsed. The diagram's dx
  // shift covers whatever is reported here.
  left?: number
  right: number
  height: number
}

/**
 * What every grid row ends with: its label in the gutter, drawn last so it
 * sits over anything that reaches into it, and a bounding box `height` tall
 * from `left` to `right`.
 */
export const finishRow = (
  ctx: RendererContext,
  $group: SVGElement,
  title: string | null,
  { left = 0, right, height }: RowExtent
): RendererResult => {
  const $label = renderRowLabel(ctx, title, height)
  if ($label != null) {
    $group.appendChild($label)
  }

  return {
    element: $group,
    bbox: {
      x1: Math.min(0, left),
      y1: 0,
      x2: right,
      y2: height
    }
  }
}
