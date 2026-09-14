import {
  DiagramContent,
  DiagramStyles,
  GridRowSpecification,
  TextMeasurer,
  TimeAxisSpecification
} from '@swirly/types'

import { rowStyles } from '../row/slots.js'
import { fontOf, textStyle } from '../util/text-style.js'

const gridRows = (content: DiagramContent): GridRowSpecification[] =>
  content.filter((item): item is GridRowSpecification => item.kind === 'R')

/**
 * The widest thing that has to fit inside each column: its header label, plus
 * whatever every row puts in that column.
 *
 * A cell row's value actually opens a *run*, which may span several columns, so
 * charging its whole width to the one column it starts in is conservative. That
 * is the safe direction to be wrong in — the value always fits — and it keeps
 * the measurement a single pass that needs no knowledge of run folding.
 */
export const measureColumnContents = (
  content: DiagramContent,
  axisSpec: TimeAxisSpecification,
  styles: DiagramStyles,
  measureText: TextMeasurer
): number[] => {
  const widths = axisSpec.columns.map(() => 0)

  const headerFont = fontOf(textStyle(styles, 'axis_label_'))

  for (let i = 0; i < axisSpec.columns.length; ++i) {
    const { label } = axisSpec.columns[i]
    if (label !== '') {
      widths[i] = Math.max(widths[i], measureText(label, headerFont))
    }
  }

  for (const row of gridRows(content)) {
    const font = fontOf(textStyle(rowStyles(styles, row), 'value_'))
    const limit = Math.min(row.slots.length, widths.length)
    for (let i = 0; i < limit; ++i) {
      const slot = row.slots[i]
      if (slot.kind === 'empty') {
        continue
      }
      widths[i] = Math.max(widths[i], measureText(slot.value, font))
    }
  }

  return widths
}

/**
 * The gutter has to hold the widest row label, including the axis header's.
 * `row_label_width` is the floor rather than the answer, so a diagram with
 * short labels keeps the layout it had before anything was measured.
 */
export const measureGutter = (
  content: DiagramContent,
  axisSpec: TimeAxisSpecification,
  styles: DiagramStyles,
  measureText: TextMeasurer
): number => {
  const font = fontOf(textStyle(styles, 'row_label_'))

  const titles = [
    axisSpec.title,
    ...gridRows(content).map(({ title }) => title)
  ].filter((title): title is string => title != null && title !== '')

  const widest = titles.reduce(
    (widest, title) => Math.max(widest, measureText(title, font)),
    0
  )

  return Math.max(
    styles.row_label_width!,
    Math.ceil(widest + styles.row_label_gap! * 2)
  )
}
