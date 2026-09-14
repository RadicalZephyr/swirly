import { SlotValue } from '@swirly/types'

/** A slot that actually carries something, as opposed to an empty one. */
export type FilledSlotValue = Exclude<SlotValue, { kind: 'empty' }>

export type SlotRun = {
  // The value held across the run, or null when the row opens on an empty slot
  // and so holds nothing yet.
  value: FilledSlotValue | null
  // Index into the slots the runs were folded from. A run ends where the next
  // one starts, or with the last slot.
  startIndex: number
}

/**
 * Folds a cell row's slots into the runs its box is divided into: a non-empty
 * slot opens a run, an empty one extends the run before it. Segmentation is
 * derived rather than written out, so the source stays one slot per column.
 */
export const foldRuns = (slots: readonly SlotValue[]): SlotRun[] => {
  const runs: SlotRun[] = []

  for (let i = 0; i < slots.length; ++i) {
    const slot = slots[i]
    if (i === 0 || slot.kind !== 'empty') {
      runs.push({
        value: slot.kind === 'empty' ? null : slot,
        startIndex: i
      })
    }
  }

  return runs
}
