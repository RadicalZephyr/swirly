import { DiagramStyles, SVGDocument } from '@swirly/types'

import { degreesToRadians } from '../util/degrees-to-radians.js'
import { createSvgElement } from '../util/svg-xml.js'

/** How far the arrowhead's mitre sticks out past its tip. */
export const arrowheadProtrusion = (styles: DiagramStyles): number =>
  styles.arrow_stroke_width! /
  Math.sin(degreesToRadians(styles.arrowhead_angle!))

/**
 * A horizontal line ending in an arrowhead at `x2`. Shared by grid stream rows
 * and by the tail of a grid cell row, so every grid row terminates identically:
 * Sodium streams and cells never complete.
 */
export const renderGridArrow = (
  document: SVGDocument,
  styles: DiagramStyles,
  x1: number,
  x2: number,
  y: number
): SVGElement[] => {
  const headWidth = styles.arrow_width!
  const strokeColor = styles.arrow_stroke_color!
  const strokeWidth = styles.arrow_stroke_width!
  const headHalfHeight =
    headWidth * Math.tan(degreesToRadians(styles.arrowhead_angle! / 2))

  return [
    createSvgElement(document, 'line', {
      x1,
      y1: y,
      x2,
      y2: y,
      stroke: strokeColor,
      'stroke-width': strokeWidth
    }),
    createSvgElement(document, 'polyline', {
      points: [
        `${x2 - headWidth},${y - headHalfHeight}`,
        `${x2},${y}`,
        `${x2 - headWidth},${y + headHalfHeight}`
      ].join(' '),
      fill: 'none',
      stroke: strokeColor,
      'stroke-width': strokeWidth,
      'stroke-linecap': 'square'
    })
  ]
}
