import { ColumnSpecification } from '@swirly/types'

import { createTimeAxisSpecification } from '../spec/time-axis.js'
import { Parser, ParserContext } from '../types.js'
import { parseConfig } from './config.js'

const reSigil = /^@(?:\s+|$)/
const reColumn = /^(>*)\s*(.*)$/

const match = (line: string): boolean => reSigil.test(line)

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
  const [header, ...configLines] = lines
  const config = parseConfig(configLines, false)

  // One `|` per column, with no special case for a trailing one: the count of
  // pipes on a line is the count of columns it declares, and the same rule
  // applies to grid rows, so a row always carries exactly as many pipes as the
  // axis. A final `|` with nothing after it declares an unlabelled column,
  // which is how a diagram asks for a closing boundary.
  const body = header.replace(reSigil, '').trim()
  const segments = body.split('|')

  // The first segment is the row label, which may be empty; every segment
  // after it is a column.
  const [titleSegment, ...columnSegments] = segments
  const title = titleSegment.trim()

  if (columnSegments.length === 0) {
    throw new Error(
      'A time axis must declare at least one column, as in `@ t | 0 | 1 | 2`'
    )
  }

  ctx.content.push(
    createTimeAxisSpecification(
      columnSegments.map(parseColumn),
      typeof config.title === 'string' ? config.title : title
    )
  )
}

export const timeAxisParser: Parser = {
  match,
  run
}
