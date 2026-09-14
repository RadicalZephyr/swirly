import { SlotValue } from '@swirly/types'

import {
  createGridAnnotationRowSpecification,
  createGridCellRowSpecification,
  createGridStreamRowSpecification
} from '../spec/grid-row.js'
import { Parser, ParserContext } from '../types.js'
import { parsePipeRow } from './pipe-row.js'

// A grid row: a sigil (`>` stream, `=` cell, `.` annotation), a label of at
// most one bare word, then a pipe.
//
// `>` is also the operator sigil, and `gridRowParser` is ordered before
// `operatorParser`, so the shape has to tell the two apart. The pipe right
// after the label does most of it: an operator title runs on in prose before
// any pipe it carries. The rest is what a label may contain -- no backtick and
// no parenthesis -- so that a title whose first word runs straight into an
// inline stream, `> concat(`-a-|`)`, is not read as the label `concat(`-a-`
// with a slot of `)`. The label may be empty, as the axis's may.
const reSigil = /^[>=.]\s+/
const reMatch = /^[>=.]\s+[^\s|`()]*\s*\|/

// Outside grid mode a `>` line is an operator whatever follows it, as it was
// before grid rows existed. `=` and `.` mean nothing else, so a row written
// under one of those without an axis is claimed and reported rather than
// handed to the marble parser to misrender.
const match = (line: string, ctx: ParserContext): boolean =>
  reMatch.test(line) && (ctx.gridMode === true || line[0] !== '>')

const parseSlot = (raw: string): SlotValue => {
  const value = raw.trim()
  // A blank slot is "no event on this transaction" on a stream and "hold the
  // previous value" in a cell. Everything else starts out as a literal;
  // `resolveReferences` promotes the ones that name a row once the whole
  // diagram has been parsed.
  return value === '' ? { kind: 'empty' } : { kind: 'text', value }
}

const asLabel = (value: unknown): string | null =>
  typeof value === 'string' ? value.trim() : null

const run = (lines: readonly string[], ctx: ParserContext) => {
  if (ctx.gridMode !== true) {
    throw new Error(
      'A grid row is only meaningful in a diagram with a time axis; declare ' +
        'one with an `@` block.'
    )
  }

  const sigil = lines[0][0]

  // `from` and `to` name column labels, which are text even when they look
  // numeric: `01` names the column labelled `01`, not the one labelled `1`.
  const { title, segments, config } = parsePipeRow(lines, reSigil, [
    'from',
    'to'
  ])

  if (segments.length === 0) {
    throw new Error(
      'A grid row must declare at least one slot, as in `> s1 | 5 | 10 | 12`'
    )
  }

  const slots = segments.map(parseSlot)

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
