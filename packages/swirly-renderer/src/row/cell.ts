import { GridCellRowSpecification, GridCellRowStyles } from '@swirly/types'

import { RendererContext, RendererResult } from '../types.js'
import { createSvgElement } from '../util/svg-xml.js'
import { textAttributes, textStyle } from '../util/text-style.js'
import { renderGridArrow } from './arrow.js'
import { finishRow } from './label.js'
import { foldRuns, SlotRun } from './runs.js'
import { assertSlotsMatchAxis, rowLabel, rowStyles } from './slots.js'

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
  const s: GridCellRowStyles = rowStyles(styles, row)

  const label = rowLabel(row)

  assertSlotsMatchAxis(row, axis)

  const columnIndex = (columnLabel: string, key: string): number => {
    const index = axis.indexOf(columnLabel)
    if (index < 0) {
      throw new Error(
        `Grid row ${label}declares \`${key} = ${columnLabel}\`, but the axis ` +
          'has no column with that label.'
      )
    }
    return index
  }

  // The columns the box spans, as a half-open range over the slots: it opens
  // at the opening boundary of `from` and closes at the opening boundary of
  // `to`. Left unset, it was already open when the diagram began, or is still
  // open when the diagram ends.
  const fromIndex = row.from != null ? columnIndex(row.from, 'from') : 0
  const toIndex = row.to != null ? columnIndex(row.to, 'to') : row.slots.length

  if (toIndex <= fromIndex) {
    throw new Error(
      `Grid row ${label}closes at or before it opens; \`from\` must name an ` +
        'earlier column than `to`.'
    )
  }

  // A value in a column the box does not span has nowhere to be drawn, and
  // says the cell held something before it existed or after it was gone.
  for (let i = 0; i < row.slots.length; ++i) {
    if (row.slots[i].kind !== 'empty' && (i < fromIndex || i >= toIndex)) {
      const side = i < fromIndex ? 'before its `from`' : 'at or after its `to`'
      throw new Error(
        `Grid row ${label}has a value in column \`${axis.columns[i].label}\`, ` +
          `${side}; a cell holds nothing outside the columns it spans.`
      )
    }
  }

  const height = s.height!
  const centerY = height / 2
  const strokeWidth = s.stroke_width!

  // Cell rows share the stream row's origin and arrow tip so the two line up.
  const rowStart = axis.gutterWidth - styles.grid_row_lead!
  const rowEnd = axis.width + styles.grid_row_tail!

  // A bounded edge overhangs the boundary that bounds it, the same way an
  // unbounded one overhangs the end of the axis. Sitting flush against a
  // dashed line reads as the box being clipped by it rather than as the cell
  // holding its value through that transaction.
  // Never further left than the row's own origin: `from` naming the first
  // column would otherwise push the box out past where the row's line starts.
  const boxLeft =
    row.from != null
      ? Math.max(rowStart, axis.scale(fromIndex) - s.overhang!)
      : rowStart
  const boxRight = axis.scale(toIndex) + s.overhang!

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

  // The runs are folded over the columns the box spans, so the run that opens
  // at `from` is the first one: measured from the box's own edge and given no
  // divider, exactly as a run opening at column 0 is in an unbounded box.
  const runs = foldRuns(row.slots.slice(fromIndex, toIndex))
  const runStart = (run: SlotRun): number =>
    axis.scale(fromIndex + run.startIndex)

  for (let i = 1; i < runs.length; ++i) {
    const x = runStart(runs[i])
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

  const valueStyle = textStyle(s, 'value_')
  for (let i = 0; i < runs.length; ++i) {
    const run = runs[i]
    if (run.value == null) {
      continue
    }
    // The first run is measured from the box's own edge, every later one from
    // the divider that opens it.
    const runLeft = i === 0 ? boxLeft : runStart(run)
    $group.appendChild(
      createSvgElement(
        document,
        'text',
        {
          x: runLeft + s.value_padding!,
          y: centerY,
          ...textAttributes(valueStyle),
          'dominant-baseline': 'middle'
        },
        run.value.value
      )
    )
  }

  const arrow = renderGridArrow(ctx, boxRight, rowEnd, centerY)
  for (const $el of arrow.elements) {
    $group.appendChild($el)
  }

  return finishRow(ctx, $group, row.title, {
    left: rowStart,
    right: rowEnd + arrow.protrusion,
    height
  })
}
