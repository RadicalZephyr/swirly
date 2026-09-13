import { TimeAxisSpecification, TimeAxisStyles } from '@swirly/types'

import { renderRowLabel } from '../row/label.js'
import { RendererContext, RendererResult } from '../types.js'
import { mergeStyles } from '../util/merge-styles.js'
import { createSvgElement } from '../util/svg-xml.js'

/**
 * The `t` row: one label per transaction column, centred over the column it
 * names.
 */
export const renderAxisHeader = (
  ctx: RendererContext,
  axisSpec: TimeAxisSpecification
): RendererResult => {
  const { document, styles, axis } = ctx
  const s: TimeAxisStyles = mergeStyles(styles, axisSpec.styles, 'axis_')

  const height = s.header_height!
  const $group = createSvgElement(document, 'g')

  const $label = renderRowLabel(ctx, axisSpec.title, axis.gutterWidth, height)
  if ($label != null) {
    $group.appendChild($label)
  }

  for (let i = 0; i < axis.columns.length; ++i) {
    const { label } = axis.columns[i]
    if (label === '') {
      continue
    }
    $group.appendChild(
      createSvgElement(
        document,
        'text',
        {
          x: axis.center(i),
          y: height / 2,
          fill: s.label_color!,
          'font-family': s.label_font_family!,
          'font-size': s.label_font_size! + 'px',
          'font-weight': s.label_font_weight!,
          'font-style': s.label_font_style!,
          'dominant-baseline': 'middle',
          'text-anchor': 'middle'
        },
        label
      )
    )
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
