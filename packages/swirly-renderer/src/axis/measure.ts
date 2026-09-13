import {
  DiagramContent,
  DiagramStyles,
  FontDescription,
  GridRowSpecification,
  TextMeasurer,
  TimeAxisSpecification
} from '@swirly/types'

import { mergeStyles } from '../util/merge-styles.js'

type ValueStyles = {
  value_font_family?: string
  value_font_size?: number
  value_font_style?: string
  value_font_weight?: string | number
}

const ROW_STYLE_PREFIX: Record<GridRowSpecification['rowKind'], string> = {
  stream: 'grid_row_',
  cell: 'grid_cell_',
  annotation: 'grid_annotation_'
}

const valueFont = (
  styles: DiagramStyles,
  row: GridRowSpecification
): FontDescription => {
  const s: ValueStyles = mergeStyles(
    styles,
    row.styles,
    ROW_STYLE_PREFIX[row.rowKind]
  )
  return {
    family: s.value_font_family!,
    size: s.value_font_size!,
    weight: s.value_font_weight!,
    style: s.value_font_style!
  }
}

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

  const headerFont: FontDescription = {
    family: styles.axis_label_font_family!,
    size: styles.axis_label_font_size!,
    weight: styles.axis_label_font_weight!,
    style: styles.axis_label_font_style!
  }

  for (let i = 0; i < axisSpec.columns.length; ++i) {
    const { label } = axisSpec.columns[i]
    if (label !== '') {
      widths[i] = Math.max(widths[i], measureText(label, headerFont))
    }
  }

  for (const row of gridRows(content)) {
    const font = valueFont(styles, row)
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
  const font: FontDescription = {
    family: styles.row_label_font_family!,
    size: styles.row_label_font_size!,
    weight: styles.row_label_font_weight!,
    style: styles.row_label_font_style!
  }

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
