import {
  DiagramStyles,
  FreeformStyles,
  GridRowSpecification
} from '@swirly/types'

import { ResolvedTimeAxis } from '../axis/resolve.js'
import { mergeStyles } from '../util/merge-styles.js'

/**
 * The style family each row kind reads. Measurement and rendering both go
 * through this table, so they cannot disagree about which keys a row uses.
 */
export const ROW_STYLE_PREFIX: Record<GridRowSpecification['rowKind'], string> =
  {
    stream: 'grid_row_',
    cell: 'grid_cell_',
    annotation: 'grid_annotation_'
  }

/** A row's styles: the diagram's under its kind's prefix, its own on top. */
export const rowStyles = (
  styles: DiagramStyles,
  row: GridRowSpecification
): FreeformStyles =>
  mergeStyles(styles, row.styles, ROW_STYLE_PREFIX[row.rowKind])

/** How a row names itself in an error message. */
export const rowLabel = (row: GridRowSpecification): string =>
  row.title != null ? `\`${row.title}\` ` : ''

/**
 * A grid row addresses the axis one slot per column, so a row that disagrees
 * about how many there are cannot be placed at all.
 */
export const assertSlotsMatchAxis = (
  row: GridRowSpecification,
  axis: ResolvedTimeAxis
): void => {
  if (row.slots.length === axis.columns.length) {
    return
  }
  throw new Error(
    `Grid row ${rowLabel(row)}has ${row.slots.length} slot(s) but the axis ` +
      `has ${axis.columns.length} column(s); they must correspond one to one.`
  )
}
