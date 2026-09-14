import { ArrowStyles, SVGDocument } from '@swirly/types'

import { RendererContext, RendererResult } from './types.js'
import { degreesToRadians } from './util/degrees-to-radians.js'
import { createSvgElement } from './util/svg-xml.js'

/** How far the arrowhead's mitre sticks out past the tip it is drawn to. */
export const arrowheadProtrusion = (
  arrowStyles: ArrowStyles,
  arrowheadAngle: number
): number =>
  arrowStyles.stroke_width! / Math.sin(degreesToRadians(arrowheadAngle))

/**
 * A horizontal line from `x1` to `x2` at `y`, tipped with an arrowhead at
 * `x2`. With an `arrow_fill_color` the head is a filled polygon and the line
 * stops where the head begins; without one it is an open polyline drawn over
 * the line's end. Every arrow in a diagram -- a marble stream's, a grid
 * row's -- is drawn here, so they all agree on this.
 */
export const renderArrowLine = (
  document: SVGDocument,
  arrowStyles: ArrowStyles,
  arrowheadAngle: number,
  x1: number,
  x2: number,
  y: number
): SVGElement[] => {
  const headWidth = arrowStyles.width!
  const headHalfHeight =
    headWidth * Math.tan(degreesToRadians(arrowheadAngle / 2))
  const strokeWidth = arrowStyles.stroke_width!
  const strokeColor = arrowStyles.stroke_color!
  const fillColor = arrowStyles.fill_color!
  const filled = typeof fillColor === 'string' && fillColor !== ''

  return [
    createSvgElement(document, 'line', {
      x1,
      y1: y,
      x2: x2 - (filled ? headWidth : 0),
      y2: y,
      stroke: strokeColor,
      'stroke-width': strokeWidth
    }),
    createSvgElement(document, filled ? 'polygon' : 'polyline', {
      points: [
        `${x2 - headWidth},${y - headHalfHeight}`,
        `${x2},${y}`,
        `${x2 - headWidth},${y + headHalfHeight}`
      ].join(' '),
      fill: filled ? fillColor : 'none',
      stroke: strokeColor,
      'stroke-width': strokeWidth,
      'stroke-linecap': 'square'
    })
  ]
}

/** A marble stream's arrow: from its origin, `duration` frames plus a margin. */
export const renderArrow = (
  { document, streamHeight, axis }: RendererContext,
  arrowStyles: ArrowStyles,
  arrowheadAngle: number,
  duration: number
): RendererResult => {
  const centerY = streamHeight / 2
  const lineWidth = axis.scale(duration) + streamHeight

  const $group = createSvgElement(document, 'g')
  for (const $el of renderArrowLine(
    document,
    arrowStyles,
    arrowheadAngle,
    0,
    lineWidth,
    centerY
  )) {
    $group.appendChild($el)
  }

  return {
    element: $group,
    bbox: {
      x1: 0,
      y1: 0,
      x2: lineWidth + arrowheadProtrusion(arrowStyles, arrowheadAngle),
      y2: streamHeight
    }
  }
}
