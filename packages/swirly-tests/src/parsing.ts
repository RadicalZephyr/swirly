import assert from 'node:assert/strict'
import test from 'node:test'

import { parseMarbleDiagramSpecification } from '@swirly/parser'
import {
  GridStreamRowSpecification,
  TimeAxisSpecification
} from '@swirly/types'

const parse = (source: string) => parseMarbleDiagramSpecification(source)

const gridRowsOf = (source: string): GridStreamRowSpecification[] => {
  const { content } = parse(source)
  return content.filter(
    (item): item is GridStreamRowSpecification => item.kind === 'R'
  )
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

test('a trailing pipe closes the last column rather than opening one', () => {
  assert.equal(axisOf('@ t | 0 | 1 | 2 |').columns.length, 3)
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
  const [row] = gridRowsOf('@ t | 0 | 1 | 2\n\n> s1 | 5 | 10 | 12')
  assert.equal(row.rowKind, 'stream')
  assert.equal(row.title, 's1')
  assert.deepEqual(row.slots, [
    { kind: 'text', value: '5' },
    { kind: 'text', value: '10' },
    { kind: 'text', value: '12' }
  ])
})

test('a blank slot becomes an empty slot value', () => {
  const [row] = gridRowsOf('@ t | 0 | 1 | 2\n\n> s1 | 0 |  | 2 |')
  assert.deepEqual(
    row.slots.map(({ kind }) => kind),
    ['text', 'empty', 'text']
  )
})

test('a multi-token slot value is kept verbatim', () => {
  const [row] = gridRowsOf("@ t | 0\n\n> s1 | return 'a'")
  assert.deepEqual(row.slots, [{ kind: 'text', value: "return 'a'" }])
})

test('a trailing pipe closes the last slot rather than opening one', () => {
  const [row] = gridRowsOf('@ t | 0 | 1\n\n> s1 | 5 | 10 |')
  assert.equal(row.slots.length, 2)
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
