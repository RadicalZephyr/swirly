import {
  GridAnnotationRowSpecification,
  GridCellRowSpecification,
  GridStreamRowSpecification,
  SlotValue
} from '@swirly/types'

export const createGridStreamRowSpecification = (
  title: string | null,
  slots: SlotValue[]
): GridStreamRowSpecification => ({
  kind: 'R',
  rowKind: 'stream',
  title: title !== '' ? title : null,
  slots
})

export const createGridCellRowSpecification = (
  title: string | null,
  slots: SlotValue[],
  from: string | null = null,
  to: string | null = null
): GridCellRowSpecification => ({
  kind: 'R',
  rowKind: 'cell',
  title: title !== '' ? title : null,
  slots,
  from,
  to
})

export const createGridAnnotationRowSpecification = (
  title: string | null,
  slots: SlotValue[]
): GridAnnotationRowSpecification => ({
  kind: 'R',
  rowKind: 'annotation',
  title: title !== '' ? title : null,
  slots
})
