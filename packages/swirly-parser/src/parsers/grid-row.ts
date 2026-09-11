import { SlotValue } from '@swirly/types'

import {
  createGridAnnotationRowSpecification,
  createGridCellRowSpecification,
  createGridStreamRowSpecification
} from '../spec/grid-row.js'
import { Parser, ParserContext } from '../types.js'
import { parseConfig } from './config.js'

// A grid row: a sigil (`>` stream, `=` cell, `.` annotation), a single-token
// label, then a pipe. That pipe, sitting immediately after the first word, is
// what tells a `>` stream row apart from an operator block — whose title runs
// on in prose before any pipe it might carry (`> debounce(() => `--|`)`).
// `gridRowParser` is ordered before `operatorParser`, so it must not claim
// those.
const reSigil = /^[>=.]\s+/
const reMatch = /^[>=.]\s+[^\s|]+\s*\|/

const match = (line: string): boolean => reMatch.test(line)

const parseSlot = (raw: string): SlotValue => {
  const value = raw.trim()
  // A blank slot is "no event on this transaction" on a stream and "hold the
  // previous value" in a cell. Everything else starts out as a literal;
  // `resolveReferences` promotes the ones that name a row once the whole
  // diagram has been parsed.
  return value === '' ? { kind: 'empty' } : { kind: 'text', value }
}

// `from = 0` parses as a number, but column labels are strings.
const asLabel = (value: unknown): string | null =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : null

const run = (lines: readonly string[], ctx: ParserContext) => {
  if (ctx.gridMode !== true) {
    throw new Error(
      'A grid row is only meaningful in a diagram with a time axis; declare ' +
        'one with an `@` block.'
    )
  }

  const [header, ...configLines] = lines
  const config = parseConfig(configLines, false)

  const sigil = header[0]
  const segments = header.replace(reSigil, '').split('|')

  // A trailing pipe closes the last column rather than opening an empty one.
  if (segments.length > 1 && segments[segments.length - 1].trim() === '') {
    segments.pop()
  }

  // The first segment is the row label, which may be empty; every segment after
  // it is one column's slot.
  const [titleSegment, ...slotSegments] = segments
  const title =
    typeof config.title === 'string' ? config.title : titleSegment.trim()

  if (slotSegments.length === 0) {
    throw new Error(
      'A grid row must declare at least one slot, as in `> s1 | 5 | 10 | 12`'
    )
  }

  const slots = slotSegments.map(parseSlot)

  switch (sigil) {
    case '=':
      ctx.content.push(
        createGridCellRowSpecification(
          title,
          slots,
          asLabel(config.from),
          asLabel(config.to)
        )
      )
      break
    case '.':
      ctx.content.push(createGridAnnotationRowSpecification(title, slots))
      break
    default:
      ctx.content.push(createGridStreamRowSpecification(title, slots))
  }
}

export const gridRowParser: Parser = {
  match,
  run
}
