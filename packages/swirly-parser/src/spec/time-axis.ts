import { ColumnSpecification, TimeAxisSpecification } from '@swirly/types'

export const createTimeAxisSpecification = (
  columns: ColumnSpecification[],
  title: string | null = null
): TimeAxisSpecification => ({
  kind: 'T',
  title: title !== '' ? title : null,
  columns
})
