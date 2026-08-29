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

export const resolveTimeAxis = (
  axis: TimeAxisSpecification,
  styles: DiagramStyles,
  gutterWidth: number
): ResolvedTimeAxis => {
  const defaultWidth = styles.axis_column_width!

  const columns: ResolvedColumn[] = []
  let x = gutterWidth
  for (const column of axis.columns) {
    const width = column.width ?? defaultWidth
    columns.push({
      label: column.label,
      depth: column.depth ?? 0,
      x,
      width
    })
    x += width
  }

  const contentWidth = x - gutterWidth

  // One boundary opens each column, plus a closing boundary after the last.
  // The closing boundary belongs to the outermost nesting level, since it ends
  // every transaction that was still open.
  const boundaries: ResolvedBoundary[] = columns.map(({ x, depth }) => ({
    x,
    depth
  }))
  boundaries.push({ x, depth: 0 })

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
