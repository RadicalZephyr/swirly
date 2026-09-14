import { TimeGridStyles } from '@swirly/types'

import {
  PostRenderUpdateContext,
  RendererContext,
  UpdatableRendererResult
} from '../types.js'
import { mergeStyles } from '../util/merge-styles.js'
import { createSvgElement } from '../util/svg-xml.js'
import { ResolvedTimeAxis } from './resolve.js'

/**
 * The dashed transaction boundaries.
 *
 * These span the whole diagram rather than a single row, so their height is
 * only known once every row has been laid out. The element is rendered into a
 * background layer outside the vertical flow and finished in the post-render
 * pass, which is where the diagram's total height becomes available.
 */
export const renderTimeGrid = (
  ctx: RendererContext,
  axis: ResolvedTimeAxis
): UpdatableRendererResult => {
  const { document, styles } = ctx
  const s: TimeGridStyles = mergeStyles(styles, null, 'grid_')

  const $group = createSvgElement(document, 'g')
  const $lines: SVGElement[] = []

  // One boundary opens each column, and that is all of them: the last column
  // is left open on the right. The count has to match what the author wrote --
  // `@ t | 0 | 1 | 2` is three pipes and must draw three lines; a fourth would
  // be a transaction boundary the source never mentions, and it is not how the
  // book's figures are drawn either.
  for (const { x, depth } of axis.columns) {
    const strokeWidth = Math.max(
      0,
      s.line_stroke_width! - depth * s.line_depth_stroke_width_step!
    )
    const $line = createSvgElement(document, 'line', {
      x1: x,
      y1: 0,
      x2: x,
      y2: 0,
      stroke: s.line_color!,
      'stroke-width': strokeWidth,
      'stroke-dasharray': s.line_dash_width!
    })
    $group.appendChild($line)
    $lines.push($line)
  }

  const update = ({ height }: PostRenderUpdateContext) => {
    const bleed = s.line_bleed!
    for (const $line of $lines) {
      $line.setAttribute('y1', String(-bleed))
      $line.setAttribute('y2', String(height + bleed))
    }
  }

  return {
    element: $group,
    // The grid is not part of the vertical flow, so it contributes no extent.
    bbox: { x1: 0, y1: 0, x2: 0, y2: 0 },
    update
  }
}
