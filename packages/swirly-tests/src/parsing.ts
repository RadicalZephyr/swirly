import assert from 'node:assert/strict'
import test from 'node:test'

import { parseMarbleDiagramSpecification } from '@swirly/parser'
import { TimeAxisSpecification } from '@swirly/types'

const parse = (source: string) => parseMarbleDiagramSpecification(source)

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

test('each leading > raises a column\'s nesting depth', () => {
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
