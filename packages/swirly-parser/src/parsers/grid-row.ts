import { SlotValue } from '@swirly/types'

import { createGridStreamRowSpecification } from '../spec/grid-row.js'
import { Parser, ParserContext } from '../types.js'
import { parseConfig } from './config.js'

// A stream row: the `>` sigil, a single-token label, then a pipe. That pipe,
// sitting immediately after the first word, is what tells the row apart from an
// operator block — whose title runs on in prose before any pipe it might carry
// (`> debounce(() => `--|`)`). `gridRowParser` is ordered before
// `operatorParser`, so it must not claim those.
const reSigil = /^>\s+/
const reMatch = /^>\s+[^\s|]+\s*\|/

const match = (line: string): boolean => reMatch.test(line)

const parseSlot = (raw: string): SlotValue => {
  const value = raw.trim()
  // A blank slot is "no event on this transaction". Everything else is a value
  // typeset on the line; reference resolution arrives in Phase 4.
  return value === '' ? { kind: 'empty' } : { kind: 'text', value }
}

const run = (lines: readonly string[], ctx: ParserContext) => {
  if (ctx.gridMode !== true) {
    throw new Error(
      'A grid row is only meaningful in a diagram with a time axis; declare ' +
        'one with an `@` block.'
    )
  }

  const [header, ...configLines] = lines
  const config = parseConfig(configLines, false)

  const segments = header.replace(reSigil, '').split('|')

  // A trailing pipe closes the last column rather than opening an empty one.
  if (segments.length > 1 && segments[segments.length - 1].trim() === '') {
    segments.pop()
  }

  // The first segment is the row label, which may be empty; every segment after
  // it is one column's slot.
  const [titleSegment, ...slotSegments] = segments
  const title = titleSegment.trim()

  if (slotSegments.length === 0) {
    throw new Error(
      'A grid row must declare at least one slot, as in `> s1 | 5 | 10 | 12`'
    )
  }

  ctx.content.push(
    createGridStreamRowSpecification(
      typeof config.title === 'string' ? config.title : title,
      slotSegments.map(parseSlot)
    )
  )
}

export const gridRowParser: Parser = {
  match,
  run
}
