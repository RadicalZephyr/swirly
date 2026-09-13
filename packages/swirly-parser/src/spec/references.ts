import { DiagramContent, GridRowSpecification } from '@swirly/types'

/**
 * Promotes every slot whose text names another grid row from a literal to a
 * reference — the `switch` figures, where a cell holds a stream or another cell
 * rather than a value of its own.
 *
 * This runs over the finished diagram rather than inside the row parser: rows
 * are parsed one block at a time, and nothing requires the row being named to
 * have been declared first.
 */
export const resolveReferences = (content: DiagramContent): void => {
  const rows = content.filter(
    (item): item is GridRowSpecification => item.kind === 'R'
  )

  const titles = new Set(
    rows
      .map(({ title }) => title)
      .filter((title): title is string => title != null && title !== '')
  )

  if (titles.size === 0) {
    return
  }

  for (const row of rows) {
    row.slots = row.slots.map((slot) =>
      // A row naming itself is a literal, not a reference to itself.
      slot.kind === 'text' && slot.value !== row.title && titles.has(slot.value)
        ? { kind: 'ref', value: slot.value }
        : slot
    )
  }
}
