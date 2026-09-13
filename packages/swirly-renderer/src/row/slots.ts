import { GridRowSpecification } from '@swirly/types'

import { ResolvedTimeAxis } from '../axis/resolve.js'

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
