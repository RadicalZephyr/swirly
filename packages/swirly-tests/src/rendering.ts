import assert from 'node:assert/strict'
import test from 'node:test'

import { parseMarbleDiagramSpecification } from '@swirly/parser'
import { renderMarbleDiagram } from '@swirly/renderer-node'
import { lightStyles } from '@swirly/theme-default-light'

// Errors the renderer raises for specs the parser accepts, because they only
// become wrong once the row is measured against the resolved axis.
const render = (source: string) =>
  renderMarbleDiagram(parseMarbleDiagramSpecification(source), {
    styles: lightStyles
  })

// Deliberately mismatched: these two are the slot-count check itself.
test('a row with fewer slots than columns is rejected', () => {
  assert.throws(
    () => render('@ t | 0 | 1 | 2\n\n> s1 | 5 | 10'),
    /2 slot\(s\) but the axis has 3 column\(s\)/
  )
})

test('a row with more slots than columns is rejected', () => {
  assert.throws(
    () => render("@ t | 0\n\n= c | 'a' | 'b'"),
    /2 slot\(s\) but the axis has 1 column\(s\)/
  )
})

test('a cell row whose `to` names no column is rejected', () => {
  assert.throws(
    () => render("@ t | 0 | 1\n\n= c | 'a' |\nto = 9"),
    /`to = 9`, but the axis has no column with that label/
  )
})

test('a cell row that closes before it opens is rejected', () => {
  assert.throws(
    () => render("@ t | 0 | 1 | 2\n\n= c | 'a' |  |\nfrom = 2\nto = 1"),
    /closes at or before it opens/
  )
})

test('an annotation row with the wrong slot count is rejected', () => {
  assert.throws(
    () => render("@ t | 0 | 1 | 2\n\n. a1 |  | 'a'"),
    /2 slot\(s\) but the axis has 3 column\(s\)/
  )
})

// The `<svg>` an operator's inline stream is drawn into, inside the title's
// `foreignObject`; the foreignObject itself is sized to the diagram.
const inlineStreamSvg = (xml: string): string => {
  const match = /<foreignObject[^>]*>[\s\S]*?(<svg[\s\S]*?<\/svg>)/.exec(xml)
  assert.ok(match != null, 'expected an operator title with an inline stream')
  return match[1]
}

test('an inline operator stream is drawn the same inside a grid diagram', () => {
  // Marble geometry is frame-timed, and the grid axis must not reach it: a
  // grid axis offsets by the gutter and clamps to its columns, which would
  // stretch the inline stream and pile its marbles onto its completion.
  const operator = '> debounce(() => `-a-b|`)'
  assert.equal(
    inlineStreamSvg(render(`@ t | 0 | 1\n\n${operator}`).xml),
    inlineStreamSvg(render(`--a--|\n\n${operator}`).xml)
  )
})
