import { GridStreamRowSpecification, GridStreamRowStyles } from '@swirly/types'

import { RendererContext, RendererResult } from '../types.js'
import { degreesToRadians } from '../util/degrees-to-radians.js'
import { mergeStyles } from '../util/merge-styles.js'
import { createSvgElement } from '../util/svg-xml.js'
import { renderRowLabel } from './label.js'

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

  if (row.slots.length !== axis.columns.length) {
    const label = row.title != null ? `\`${row.title}\` ` : ''
    throw new Error(
      `Grid row ${label}has ${row.slots.length} slot(s) but the axis has ` +
        `${axis.columns.length} column(s); they must correspond one to one.`
    )
  }

  const height = s.height!
  const centerY = height / 2

  const $group = createSvgElement(document, 'g')

  for (let i = 0; i < row.slots.length; ++i) {
    const slot = row.slots[i]
    if (slot.kind === 'empty') {
      continue
    }
    $group.appendChild(
      createSvgElement(
        document,
        'text',
        {
          x: axis.center(i),
          y: centerY,
          fill: s.value_color!,
          'font-family': s.value_font_family!,
          'font-size': s.value_font_size! + 'px',
          'font-weight': s.value_font_weight!,
          'font-style': s.value_font_style!,
          'dominant-baseline': 'middle',
          'text-anchor': 'middle'
        },
        slot.value
      )
    )
  }

  const lineStart = axis.gutterWidth - s.lead!
  const lineEnd = axis.gutterWidth + axis.contentWidth + s.tail!

  const arrowheadWidth = styles.arrow_width!
  const strokeColor = styles.arrow_stroke_color!
  const strokeWidth = styles.arrow_stroke_width!
  const arrowheadHalfHeight =
    arrowheadWidth * Math.tan(degreesToRadians(styles.arrowhead_angle! / 2))
  const arrowheadProtrusion =
    strokeWidth / Math.sin(degreesToRadians(styles.arrowhead_angle!))

  $group.appendChild(
    createSvgElement(document, 'line', {
      x1: lineStart,
      y1: centerY,
      x2: lineEnd,
      y2: centerY,
      stroke: strokeColor,
      'stroke-width': strokeWidth
    })
  )
  $group.appendChild(
    createSvgElement(document, 'polyline', {
      points: [
        `${lineEnd - arrowheadWidth},${centerY - arrowheadHalfHeight}`,
        `${lineEnd},${centerY}`,
        `${lineEnd - arrowheadWidth},${centerY + arrowheadHalfHeight}`
      ].join(' '),
      fill: 'none',
      stroke: strokeColor,
      'stroke-width': strokeWidth,
      'stroke-linecap': 'square'
    })
  )

  const $label = renderRowLabel(ctx, row.title, axis.gutterWidth, height)
  if ($label != null) {
    $group.appendChild($label)
  }

  return {
    element: $group,
    bbox: {
      x1: 0,
      y1: 0,
      x2: lineEnd + arrowheadProtrusion,
      y2: height
    }
  }
}
