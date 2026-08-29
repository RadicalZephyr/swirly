import { GridStreamRowStyles } from './styles.js'

/**
 * One column's worth of a grid row. An empty slot means "no event here" on a
 * stream; a text slot is a value typeset on the line; a ref slot names another
 * row and is resolved to that row rather than shown literally (Phase 4).
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

/**
 * The row kinds share one address space — a label plus one slot per column —
 * and differ only in how they draw. Cells and annotations join this union in
 * later phases.
 */
export type GridRowSpecification = GridStreamRowSpecification
