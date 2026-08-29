import { GridStreamRowSpecification, SlotValue } from '@swirly/types'

export const createGridStreamRowSpecification = (
  title: string | null,
  slots: SlotValue[]
): GridStreamRowSpecification => ({
  kind: 'R',
  rowKind: 'stream',
  title: title !== '' ? title : null,
  slots
})
