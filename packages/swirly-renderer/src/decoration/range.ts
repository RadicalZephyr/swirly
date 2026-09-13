import {
  DecorationSpecification,
  RangeDecorationSpecification,
  RangeDecorationStyles
} from '@swirly/types'

import {
  DecorationRendererContext,
  DecorationRendererResult
} from '../types.js'
import { mergeStyles } from '../util/merge-styles.js'
import { createSvgElement } from '../util/svg-xml.js'
import { translate } from '../util/transform.js'

export const renderRangeDecoration = (
  { document, styles, streamHeight, scaleTime, axis }: DecorationRendererContext,
  decoration: DecorationSpecification
): DecorationRendererResult => {
  const {
    frame,
    duration,
    styles: ownStyles
  } = decoration as RangeDecorationSpecification

  const s: RangeDecorationStyles = mergeStyles(styles, ownStyles, 'range_')

  const x = axis.scale(scaleTime(frame))
  const y = (streamHeight - s.height!) / 2
  const width = axis.scale(scaleTime(duration))
  const height = s.height!

  const $rect = createSvgElement(document, 'rect', {
    x: 0,
    y: 0,
    width,
    height,
    fill: s.fill_color!,
    stroke: s.stroke_color!,
    'stroke-width': s.stroke_width!
  })

  translate($rect, x, y)

  return {
    element: $rect
  }
}
