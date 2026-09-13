import assert from 'node:assert/strict'
import test from 'node:test'

import { parseMarbleDiagramSpecification } from '@swirly/parser'
import { estimateTextWidth, renderMarbleDiagram } from '@swirly/renderer-node'
import { lightStyles } from '@swirly/theme-default-light'
import { ColumnSizing, DiagramStyles, TextMeasurer } from '@swirly/types'

const FONT = {
  family: 'Arial, Helvetica, sans-serif',
  size: 18,
  weight: 'normal',
  style: 'normal'
}

// One unit of width per character, so a column's expected width follows from
// the source rather than from whatever the estimator happens to return.
const perCharacter: TextMeasurer = (text) => text.length * 10

const reBoundary = /<line x1="([\d.]+)"[^>]*stroke-dasharray/g

// A row's line ends at gutterWidth + contentWidth + grid_row_tail. It is the
// only thing in the output that marks where the last column stops, because the
// axis draws a boundary to *open* each column and none to close the last one.
const reRowLine =
  /<line x1="[\d.]+" y1="[\d.]+" x2="([\d.]+)"(?![^>]*dasharray)/g

/**
 * The width of each grid column, read back off the rendering.
 *
 * The boundaries give each column's left edge. The last column has no boundary
 * of its own on the right -- that is the point of the axis model -- so its
 * width comes from where the row's line ends, less the tail.
 */
const columnWidths = (
  source: string,
  styles: DiagramStyles,
  measureText?: TextMeasurer
): number[] => {
  const { xml } = renderMarbleDiagram(parseMarbleDiagramSpecification(source), {
    styles,
    measureText
  })

  const starts = [...xml.matchAll(reBoundary)].map((match) => Number(match[1]))
  const lineEnd = Math.max(
    ...[...xml.matchAll(reRowLine)].map((match) => Number(match[1]))
  )
  const edges = [...starts, lineEnd - styles.grid_row_tail!]

  return edges.slice(1).map((x, i) => x - edges[i])
}

const withSizing = (sizing: ColumnSizing): DiagramStyles => ({
  ...lightStyles,
  axis_column_sizing: sizing,
  axis_column_padding: 0,
  axis_column_min_width: 0
})

// Column 1 holds a much wider value than column 0, and no column is empty.
const SOURCE = '@ t | 0 | 1\n\n> s1 | ab | abcdefgh'

test('fixed sizing ignores the measurements', () => {
  assert.deepEqual(columnWidths(SOURCE, withSizing('fixed'), perCharacter), [
    lightStyles.axis_column_width,
    lightStyles.axis_column_width
  ])
})

test('content sizing gives each column its own width', () => {
  assert.deepEqual(
    columnWidths(SOURCE, withSizing('content'), perCharacter),
    [20, 80]
  )
})

test('uniform sizing gives every column the widest one', () => {
  assert.deepEqual(
    columnWidths(SOURCE, withSizing('uniform'), perCharacter),
    [80, 80]
  )
})

test('uniform is the default sizing', () => {
  const styles = {
    ...lightStyles,
    axis_column_padding: 0,
    axis_column_min_width: 0
  }
  assert.deepEqual(
    columnWidths(SOURCE, styles, perCharacter),
    columnWidths(SOURCE, withSizing('uniform'), perCharacter)
  )
})

test('column padding and the minimum width are applied on top', () => {
  const styles: DiagramStyles = {
    ...lightStyles,
    axis_column_sizing: 'content',
    axis_column_padding: 6,
    axis_column_min_width: 50
  }
  // Column 0 wants 20 + 6 and is floored at 50; column 1 wants 80 + 6.
  assert.deepEqual(columnWidths(SOURCE, styles, perCharacter), [50, 86])
})

test('an axis label widens its column just as a slot value does', () => {
  assert.deepEqual(
    columnWidths(
      '@ t | 0 | abcdefgh\n\n> s1 |  |',
      withSizing('content'),
      perCharacter
    ),
    [10, 80]
  )
})

test('the built-in estimator is used when no measurer is supplied', () => {
  const [width] = columnWidths(SOURCE, withSizing('content'))
  assert.equal(width, Math.ceil(estimateTextWidth('ab', FONT)))
})

test('the estimator scales with font size', () => {
  assert.equal(
    estimateTextWidth('abc', { ...FONT, size: 36 }),
    estimateTextWidth('abc', { ...FONT, size: 18 }) * 2
  )
})

test('the estimator distinguishes wide characters from narrow ones', () => {
  assert.ok(
    estimateTextWidth('MMMM', FONT) > estimateTextWidth('iiii', FONT) * 2
  )
})

test('the gutter grows past row_label_width to fit a long label', () => {
  const styles = { ...lightStyles, axis_column_sizing: 'fixed' as ColumnSizing }
  const gutterOf = (title: string): number => {
    const { xml } = renderMarbleDiagram(
      parseMarbleDiagramSpecification(`@ t | 0\n\n> ${title} | 'a'`),
      { styles, measureText: perCharacter }
    )
    return Number(reBoundary.exec(xml)![1]) - 0
  }
  reBoundary.lastIndex = 0
  const short = gutterOf('s1')
  reBoundary.lastIndex = 0
  const long = gutterOf('averyverylongrowlabel')
  assert.equal(short, lightStyles.row_label_width)
  assert.ok(
    long > short,
    `expected a long label to widen the gutter past ${short}, got ${long}`
  )
})
