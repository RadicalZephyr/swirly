import {
  FontFamily,
  FontStyle,
  FontWeight,
  NonNegativeNumber
} from './primitives.js'
import { DiagramStyles } from './styles.js'

export type FontDescription = {
  family: FontFamily
  size: NonNegativeNumber
  weight: FontWeight
  style: FontStyle
}

/**
 * Measures the rendered width of a string. Supplying one lets content-sized
 * columns be laid out exactly; without it the renderer falls back to an
 * estimator built from per-character advance widths.
 */
export type TextMeasurer = (text: string, font: FontDescription) => number

export type RendererOptions = {
  DOMParser?: typeof DOMParser
  styles?: DiagramStyles
  measureText?: TextMeasurer
}

// Although XMLDocument is supposed to be generic, it actually inherits from
// Document, which partly assumes HTML, including for documentElement.
export type SVGDocument = XMLDocument & {
  documentElement: SVGSVGElement
}

export type DiagramRendering = {
  document: SVGDocument
  width: number
  height: number
}
