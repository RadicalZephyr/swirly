import { ColumnSpecification } from '@swirly/types'

import { createTimeAxisSpecification } from '../spec/time-axis.js'
import { Parser, ParserContext } from '../types.js'
import { parsePipeRow } from './pipe-row.js'

// `@` opens the axis whether or not a space follows it. `@t | 0 | 1` is a typo
// for `@ t | 0 | 1`, not a marble stream whose first value is `@`; handed to
// the marble parser it would render two marbles and leave the diagram out of
// grid mode, so that every grid row below it fails for the wrong reason.
const reSigil = /^@\s*/
const reColumn = /^(>*)\s*(.*)$/

/** Whether a block starting with this line declares the time axis. */
export const isTimeAxisLine = (line: string): boolean => reSigil.test(line)

/**
 * Parses a column label, where each leading `>` increases the nesting depth of
 * the transaction it names.
 */
const parseColumn = (raw: string): ColumnSpecification => {
  const [, markers, label] = reColumn.exec(raw.trim())!
  return {
    label: label.trim(),
    depth: markers.length
  }
}

const run = (lines: readonly string[], ctx: ParserContext) => {
  const { title, segments } = parsePipeRow(lines, reSigil)

  if (segments.length === 0) {
    throw new Error(
      'A time axis must declare at least one column, as in `@ t | 0 | 1 | 2`'
    )
  }

  ctx.content.push(
    createTimeAxisSpecification(segments.map(parseColumn), title)
  )
}

export const timeAxisParser: Parser = {
  match: isTimeAxisLine,
  run
}
