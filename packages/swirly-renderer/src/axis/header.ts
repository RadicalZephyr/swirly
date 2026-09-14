import { TimeAxisSpecification, TimeAxisStyles } from '@swirly/types'

import { renderRowLabel } from '../row/label.js'
import { renderColumnTexts } from '../row/values.js'
import { RendererContext, RendererResult } from '../types.js'
import { mergeStyles } from '../util/merge-styles.js'
import { createSvgElement } from '../util/svg-xml.js'
import { textStyle } from '../util/text-style.js'

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

  const $label = renderRowLabel(ctx, axisSpec.title, height)
  if ($label != null) {
    $group.appendChild($label)
  }

  for (const $text of renderColumnTexts(
    ctx,
    axis.columns.map(({ label }) => label),
    textStyle(s, 'label_'),
    height / 2
  )) {
    $group.appendChild($text)
  }

  return {
    element: $group,
    bbox: {
      x1: 0,
      y1: 0,
      x2: axis.width,
      y2: height
    }
  }
}
