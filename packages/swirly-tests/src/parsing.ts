import assert from 'node:assert/strict'
import test from 'node:test'

import { parseMarbleDiagramSpecification } from '@swirly/parser'
import {
  GridAnnotationRowSpecification,
  GridCellRowSpecification,
  GridRowSpecification,
  GridStreamRowSpecification,
  SlotValue,
  TimeAxisSpecification
} from '@swirly/types'

const parse = (source: string) => parseMarbleDiagramSpecification(source)

const gridRowsOf = (source: string): GridRowSpecification[] => {
  const { content } = parse(source)
  return content.filter(
    (item): item is GridRowSpecification => item.kind === 'R'
  )
}

const streamRowsOf = (source: string): GridStreamRowSpecification[] =>
  gridRowsOf(source).filter(
    (row): row is GridStreamRowSpecification => row.rowKind === 'stream'
  )

const cellRowsOf = (source: string): GridCellRowSpecification[] =>
  gridRowsOf(source).filter(
    (row): row is GridCellRowSpecification => row.rowKind === 'cell'
  )

const annotationRowsOf = (source: string): GridAnnotationRowSpecification[] =>
  gridRowsOf(source).filter(
    (row): row is GridAnnotationRowSpecification => row.rowKind === 'annotation'
  )

const describeSlot = (slot: SlotValue): string =>
  slot.kind === 'empty' ? '-' : `${slot.kind}:${slot.value}`

const slotsOf = (source: string, title: string): string[] => {
  const row = gridRowsOf(source).find((row) => row.title === title)
  assert.ok(row != null, `expected the diagram to contain a row \`${title}\``)
  return row.slots.map(describeSlot)
}

const axisOf = (source: string): TimeAxisSpecification => {
  const { content } = parse(source)
  const axis = content.find((item) => item.kind === 'T')
  assert.ok(axis != null, 'expected the diagram to contain a time axis')
  return axis as TimeAxisSpecification
}

test('an axis block yields a title and one column per segment', () => {
  const axis = axisOf('@ t | 0 | 1 | 2')
  assert.equal(axis.title, 't')
  assert.deepEqual(
    axis.columns.map(({ label }) => label),
    ['0', '1', '2']
  )
})

test('one pipe declares one column', () => {
  assert.equal(axisOf('@ t | 0 | 1 | 2').columns.length, 3)
})

test('a final pipe with nothing after it declares an unlabelled column', () => {
  // How a diagram asks for a closing boundary: the column is real, so it
  // draws a line, but it has no label to centre in it.
  const axis = axisOf('@ t | 0 | 1 |')
  assert.deepEqual(
    axis.columns.map(({ label }) => label),
    ['0', '1', '']
  )
})

test('an empty label segment collapses the gutter', () => {
  assert.equal(axisOf('@ | 0 | 1').title, null)
})

test("each leading > raises a column's nesting depth", () => {
  const axis = axisOf('@ t | [0] | >[0,0] | >>[0,0,0] | [1]')
  assert.deepEqual(
    axis.columns.map(({ depth }) => depth),
    [0, 1, 2, 0]
  )
  assert.deepEqual(
    axis.columns.map(({ label }) => label),
    ['[0]', '[0,0]', '[0,0,0]', '[1]']
  )
})

test('an axis must declare at least one column', () => {
  assert.throws(() => parse('@ t'), /at least one column/)
})

test('a marble row is rejected in a diagram that declares an axis', () => {
  assert.throws(
    () => parse('@ t | 0 | 1\n\n--a--b--|'),
    /not valid in a diagram that declares a time axis/
  )
})

test('marble diagrams without an axis are unaffected', () => {
  const { content } = parse('--a--b--|\n\n> map(x => x)\n\n--c--d--|')
  assert.deepEqual(
    content.map(({ kind }) => kind),
    ['S', 'O', 'S']
  )
})

test('an operator still parses inside a grid diagram', () => {
  const { content } = parse('@ t | 0 | 1\n\n> concatAll')
  assert.deepEqual(
    content.map(({ kind }) => kind),
    ['T', 'O']
  )
})

test('a `>` row with a pipe after its label parses as a grid stream row', () => {
  const [row] = streamRowsOf('@ t | 0 | 1 | 2\n\n> s1 | 5 | 10 | 12')
  assert.equal(row.rowKind, 'stream')
  assert.equal(row.title, 's1')
  assert.deepEqual(row.slots, [
    { kind: 'text', value: '5' },
    { kind: 'text', value: '10' },
    { kind: 'text', value: '12' }
  ])
})

test('a blank slot becomes an empty slot value', () => {
  const [row] = streamRowsOf('@ t | 0 | 1 | 2\n\n> s1 | 0 |  | 2')
  assert.deepEqual(
    row.slots.map(({ kind }) => kind),
    ['text', 'empty', 'text']
  )
})

test('a multi-token slot value is kept verbatim', () => {
  const [row] = streamRowsOf("@ t | 0\n\n> s1 | return 'a'")
  assert.deepEqual(row.slots, [{ kind: 'text', value: "return 'a'" }])
})

test('a row carries exactly as many pipes as the axis', () => {
  // The count is the same on both lines, including when the last slot is
  // empty -- that is a bare trailing pipe, not an extra one.
  const [row] = streamRowsOf('@ t | 0 | 1 | 2\n\n> s1 | 5 | 10 |')
  assert.deepEqual(
    row.slots.map((slot) => (slot.kind === 'empty' ? '-' : slot.value)),
    ['5', '10', '-']
  )
})

test('a row of nothing but empty slots needs no extra pipe', () => {
  const [row] = streamRowsOf('@ t | 0 | 1 | 2\n\n> s | | |')
  assert.equal(row.slots.length, 3)
  assert.ok(row.slots.every((slot) => slot.kind === 'empty'))
})

test('a grid row outside grid mode is rejected', () => {
  assert.throws(() => parse('> s1 | 5 | 10'), /only meaningful in a diagram/)
})

test('a bare `>` operator title is untouched by the grid row parser', () => {
  const { content } = parse('@ t | 0 | 1\n\n> map(x => x)')
  assert.deepEqual(
    content.map(({ kind }) => kind),
    ['T', 'O']
  )
})

test('an operator whose title contains a pipe is not stolen by the grid parser', () => {
  const { content } = parse('@ t | 0 | 1\n\n> debounce(() => `--|`)')
  assert.deepEqual(
    content.map(({ kind }) => kind),
    ['T', 'O']
  )
})

test('an `=` row with a pipe after its label parses as a grid cell row', () => {
  const [row] = cellRowsOf("@ t | 0 | 1 | 2\n\n= c | 'a' |  | 'b'")
  assert.equal(row.rowKind, 'cell')
  assert.equal(row.title, 'c')
  assert.deepEqual(
    row.slots.map(({ kind }) => kind),
    ['text', 'empty', 'text']
  )
})

test('a cell row without `from` or `to` spans the whole axis', () => {
  const [row] = cellRowsOf("@ t | 0 | 1\n\n= c | 'a' |")
  assert.equal(row.from, null)
  assert.equal(row.to, null)
})

test('`from` and `to` name columns, even when they look numeric', () => {
  const [row] = cellRowsOf(
    "@ t | 0 | 1 | 2 | 3\n\n= c |  | 'a' |  |\nfrom = 1\nto = 3"
  )
  assert.equal(row.from, '1')
  assert.equal(row.to, '3')
})

test('a cell row is rejected outside grid mode', () => {
  assert.throws(() => parse("= c | 'a' | 'b'"), /only meaningful in a diagram/)
})

test('a `.` row parses as a grid annotation row', () => {
  const [row] = annotationRowsOf("@ t | 0 | 1 | 2\n\n. a1 |  | 'a' |")
  assert.equal(row.rowKind, 'annotation')
  assert.equal(row.title, 'a1')
  assert.deepEqual(
    row.slots.map(({ kind }) => kind),
    ['empty', 'text', 'empty']
  )
})

test('a slot naming another row resolves to a reference', () => {
  assert.deepEqual(
    slotsOf("@ t | 0 | 1\n\n= c1 | 'a' | 'b'\n\n= c2 | c1 |", 'c2'),
    ['ref:c1', '-']
  )
})

test('a reference resolves even when it names a row declared later', () => {
  assert.deepEqual(
    slotsOf("@ t | 0 | 1\n\n= c2 | c1 |\n\n= c1 | 'a' | 'b'", 'c2'),
    ['ref:c1', '-']
  )
})

test('a cell may reference a stream row', () => {
  assert.deepEqual(
    slotsOf("@ t | 0 | 1\n\n> s1 | 'a' | 'b'\n\n= c | s1 |", 'c'),
    ['ref:s1', '-']
  )
})

test('a slot naming no row stays a literal', () => {
  assert.deepEqual(
    slotsOf("@ t | 0 | 1\n\n= c1 | 'a' | 'b'\n\n= c2 | c9 |", 'c2'),
    ['text:c9', '-']
  )
})

test('a row naming itself keeps a literal rather than referencing itself', () => {
  assert.deepEqual(slotsOf('@ t | 0 | 1\n\n= c | c |', 'c'), ['text:c', '-'])
})
