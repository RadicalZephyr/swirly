import {
  GridAnnotationRowStyles,
  GridCellRowStyles,
  GridStreamRowStyles
} from './styles.js'

/**
 * One column's worth of a grid row. An empty slot means "no event here" on a
 * stream and "hold the previous value" in a cell; a text slot is a value drawn
 * as-is; a ref slot is one whose text names another grid row, resolved after
 * the whole diagram is parsed.
 */
export type SlotValue =
  | { kind: 'empty' }
  | { kind: 'text'; value: string }
  | { kind: 'ref'; value: string }

export type BaseGridRow = {
  kind: 'R'
  title: string | null
  slots: SlotValue[]
}

export type GridStreamRowSpecification = BaseGridRow & {
  rowKind: 'stream'
  styles?: GridStreamRowStyles | null
}

export type GridCellRowSpecification = BaseGridRow & {
  rowKind: 'cell'
  // Column label at whose opening boundary the box starts. Unset means the box
  // was already open when the diagram begins, so it opens before column 0.
  from?: string | null
  // Column label at whose opening boundary the box closes. Unset means it is
  // still open when the diagram ends, so it closes after the last column.
  to?: string | null
  styles?: GridCellRowStyles | null
}

export type GridAnnotationRowSpecification = BaseGridRow & {
  rowKind: 'annotation'
  styles?: GridAnnotationRowStyles | null
}

/**
 * The row kinds share one address space — a label plus one slot per column —
 * and differ only in how they draw.
 */
export type GridRowSpecification =
  | GridStreamRowSpecification
  | GridCellRowSpecification
  | GridAnnotationRowSpecification
