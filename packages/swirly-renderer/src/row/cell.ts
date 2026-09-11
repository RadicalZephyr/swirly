import { GridCellRowSpecification, GridCellRowStyles } from '@swirly/types'

import { RendererContext, RendererResult } from '../types.js'
import { mergeStyles } from '../util/merge-styles.js'
import { createSvgElement } from '../util/svg-xml.js'
import { arrowheadProtrusion, renderGridArrow } from './arrow.js'
import { renderRowLabel } from './label.js'
import { foldRuns } from './runs.js'
import { assertSlotsMatchAxis, rowLabel } from './slots.js'

/**
 * A grid cell row: a box holding a value across an interval, divided by a solid
 * divider wherever the value changes, with the held value left-aligned in each
 * run. The box is opaque, so the dashed transaction grid stops at its edges.
 *
 * It opens before column 0 and closes after the last column unless `from` and
 * `to` name the boundaries it opens and closes at; a lead-in line runs from the
 * row's left origin to a late-opening box, and a tail arrow runs from the box's
 * right edge to the same tip a stream row's arrow reaches, so rows line up.
 */
export const renderGridCellRow = (
  ctx: RendererContext,
  row: GridCellRowSpecification
): RendererResult => {
  const { document, styles, axis } = ctx
  const s: GridCellRowStyles = mergeStyles(styles, row.styles, 'grid_cell_')

  const label = rowLabel(row)

  assertSlotsMatchAxis(row, axis)

  const boundaryOf = (columnLabel: string, key: string): number => {
    const index = axis.indexOf(columnLabel)
    if (index < 0) {
      throw new Error(
        `Grid row ${label}declares \`${key} = ${columnLabel}\`, but the axis ` +
          'has no column with that label.'
      )
    }
    return axis.scale(index)
  }

  const height = s.height!
  const centerY = height / 2
  const strokeWidth = s.stroke_width!

  // Cell rows share the stream row's origin and arrow tip so the two line up.
  const rowStart = axis.gutterWidth - styles.grid_row_lead!
  const rowEnd = axis.gutterWidth + axis.contentWidth + styles.grid_row_tail!

  const boxLeft = row.from != null ? boundaryOf(row.from, 'from') : rowStart
  const boxRight =
    row.to != null
      ? boundaryOf(row.to, 'to')
      : axis.gutterWidth + axis.contentWidth + s.overhang!

  if (boxRight <= boxLeft) {
    throw new Error(
      `Grid row ${label}closes at or before it opens; \`from\` must name an ` +
        'earlier column than `to`.'
    )
  }

  const $group = createSvgElement(document, 'g')

  // A box that opens late is reached by a plain lead-in line — no arrowhead,
  // which belongs only at the row's far end.
  if (boxLeft > rowStart) {
    $group.appendChild(
      createSvgElement(document, 'line', {
        x1: rowStart,
        y1: centerY,
        x2: boxLeft,
        y2: centerY,
        stroke: styles.arrow_stroke_color!,
        'stroke-width': styles.arrow_stroke_width!
      })
    )
  }

  $group.appendChild(
    createSvgElement(document, 'rect', {
      x: boxLeft,
      y: strokeWidth / 2,
      width: boxRight - boxLeft,
      height: height - strokeWidth,
      fill: s.fill_color!,
      stroke: s.stroke_color!,
      'stroke-width': strokeWidth
    })
  )

  const runs = foldRuns(row.slots)

  for (let i = 1; i < runs.length; ++i) {
    const x = axis.scale(runs[i].startIndex)
    if (x <= boxLeft || x >= boxRight) {
      continue
    }
    $group.appendChild(
      createSvgElement(document, 'line', {
        x1: x,
        y1: strokeWidth / 2,
        x2: x,
        y2: height - strokeWidth / 2,
        stroke: s.stroke_color!,
        'stroke-width': s.divider_stroke_width!
      })
    )
  }

  for (let i = 0; i < runs.length; ++i) {
    const run = runs[i]
    if (run.value == null) {
      continue
    }
    // The first run is measured from the box's own edge, every later one from
    // the divider that opens it.
    const runLeft =
      i === 0 ? boxLeft : Math.max(boxLeft, axis.scale(run.startIndex))
    if (runLeft >= boxRight) {
      continue
    }
    $group.appendChild(
      createSvgElement(
        document,
        'text',
        {
          x: runLeft + s.value_padding!,
          y: centerY,
          fill: s.value_color!,
          'font-family': s.value_font_family!,
          'font-size': s.value_font_size! + 'px',
          'font-weight': s.value_font_weight!,
          'font-style': s.value_font_style!,
          'dominant-baseline': 'middle'
        },
        run.value.value
      )
    )
  }

  for (const $el of renderGridArrow(
    document,
    styles,
    boxRight,
    rowEnd,
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
      x2: rowEnd + arrowheadProtrusion(styles),
      y2: height
    }
  }
}
