import { DiagramStyles, TimeAxisSpecification } from '@swirly/types'

export type ResolvedColumn = {
  label: string
  depth: number
  x: number
  width: number
}

export type ResolvedBoundary = {
  x: number
  depth: number
}

/**
 * The single source of every x coordinate in a diagram.
 *
 * Frame mode and grid mode differ only in how a time is turned into a
 * position. Frame mode scales a continuous frame number by `frame_width` and
 * has no columns; grid mode looks up a discrete column index. Everything that
 * positions something horizontally goes through `scale`, so neither mode needs
 * to know which one is in play.
 */
export type ResolvedTimeAxis = {
  mode: 'frame' | 'grid'
  columns: readonly ResolvedColumn[]
  boundaries: readonly ResolvedBoundary[]
  gutterWidth: number
  contentWidth: number
  scale: (time: number) => number
  center: (index: number) => number
  end: (index: number) => number
  indexOf: (label: string) => number
}

export const createFrameAxis = (styles: DiagramStyles): ResolvedTimeAxis => {
  const scale = (time: number) => time * styles.frame_width!
  return {
    mode: 'frame',
    columns: [],
    boundaries: [],
    gutterWidth: 0,
    contentWidth: 0,
    scale,
    center: scale,
    end: (index) => scale(index + 1),
    indexOf: () => -1
  }
}

/**
 * Turns measured content widths into the width of every column, per
 * `axis_column_sizing`:
 *
 * - `fixed` ignores the measurements and gives every column
 *   `axis_column_width`.
 * - `content` sizes each column to its own contents.
 * - `uniform` (the default) sizes every column to the widest contents in the
 *   diagram, so an estimator that is off makes all of them equally too wide
 *   rather than one of them visibly wrong.
 *
 * A column's explicit `width` always wins, and never counts towards `uniform`.
 * Measured widths are rounded up to whole pixels, so a diagram's coordinates
 * stay readable and its golden rendering stays stable.
 */
const resolveColumnWidths = (
  axis: TimeAxisSpecification,
  styles: DiagramStyles,
  contentWidths: readonly number[]
): number[] => {
  const sizing = styles.axis_column_sizing!
  const padding = styles.axis_column_padding!
  const minWidth = styles.axis_column_min_width!

  if (sizing === 'fixed') {
    return axis.columns.map(
      (column) => column.width ?? styles.axis_column_width!
    )
  }

  const intrinsic = axis.columns.map((column, i) =>
    Math.max(minWidth, Math.ceil((contentWidths[i] ?? 0) + padding))
  )
  const measured =
    sizing === 'uniform'
      ? intrinsic.reduce(
        (widest, width, i) =>
          axis.columns[i].width != null ? widest : Math.max(widest, width),
        minWidth
      )
      : null

  return axis.columns.map(
    (column, i) => column.width ?? measured ?? intrinsic[i]
  )
}

export const resolveTimeAxis = (
  axis: TimeAxisSpecification,
  styles: DiagramStyles,
  gutterWidth: number,
  contentWidths: readonly number[] = []
): ResolvedTimeAxis => {
  const widths = resolveColumnWidths(axis, styles, contentWidths)

  const columns: ResolvedColumn[] = []
  let x = gutterWidth
  for (let i = 0; i < axis.columns.length; ++i) {
    const column = axis.columns[i]
    const width = widths[i]
    columns.push({
      label: column.label,
      depth: column.depth ?? 0,
      x,
      width
    })
    x += width
  }

  const contentWidth = x - gutterWidth

  // One boundary opens each column, and that is all of them: the last column is
  // left open on the right.
  //
  // The count has to match what the author wrote. `@ t | 0 | 1 | 2` is three
  // pipes and must draw three lines -- a fourth would be a transaction
  // boundary the source never mentions, and it is not how the book's figures
  // are drawn either.
  const boundaries: ResolvedBoundary[] = columns.map(({ x, depth }) => ({
    x,
    depth
  }))

  const clamp = (index: number) =>
    Math.max(0, Math.min(index, columns.length - 1))

  const start = (index: number): number => {
    if (columns.length === 0) {
      return gutterWidth
    }
    if (index >= columns.length) {
      return gutterWidth + contentWidth
    }
    return columns[clamp(index)].x
  }

  return {
    mode: 'grid',
    columns,
    boundaries,
    gutterWidth,
    contentWidth,
    scale: start,
    center: (index) => {
      if (columns.length === 0) {
        return gutterWidth
      }
      const column = columns[clamp(index)]
      return column.x + column.width / 2
    },
    end: (index) => start(index + 1),
    indexOf: (label) => columns.findIndex((column) => column.label === label)
  }
}
