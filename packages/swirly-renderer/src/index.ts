import { lightStyles } from '@swirly/theme-default-light'
import {
  DiagramContentItem,
  DiagramRendering,
  DiagramSpecification,
  RendererOptions,
  TimeAxisSpecification
} from '@swirly/types'

import { renderTimeGrid } from './axis/grid.js'
import { renderAxisHeader } from './axis/header.js'
import { measureColumnContents, measureGutter } from './axis/measure.js'
import { createFrameAxis, resolveTimeAxis } from './axis/resolve.js'
import { renderOperator } from './operator.js'
import { renderGridAnnotationRow } from './row/annotation.js'
import { renderGridCellRow } from './row/cell.js'
import { renderGridStreamRow } from './row/stream.js'
import { renderStream } from './stream/full.js'
import {
  PostRenderUpdateContext,
  RendererContext,
  RendererResult,
  UpdatableRendererResult
} from './types.js'
import {
  createSvgDocument,
  createSvgElement,
  setSvgDimensions
} from './util/svg-xml.js'
import { estimateTextWidth } from './util/text-metrics.js'
import { translate } from './util/transform.js'

// The fallback `RendererOptions.measureText` uses when none is supplied, so
// callers can reuse or compare against it.
export { estimateTextWidth } from './util/text-metrics.js'

const hasTitle = (item: DiagramContentItem): boolean =>
  item.kind !== 'O' && item.title != null && item.title !== ''

const renderContentItem = (
  ctx: RendererContext,
  item: DiagramContentItem
): RendererResult => {
  switch (item.kind) {
    case 'S':
      return renderStream(ctx, item)
    case 'O':
      return renderOperator(ctx, item)
    case 'T':
      return renderAxisHeader(ctx, item)
    case 'R':
      switch (item.rowKind) {
        case 'stream':
          return renderGridStreamRow(ctx, item)
        case 'cell':
          return renderGridCellRow(ctx, item)
        case 'annotation':
          return renderGridAnnotationRow(ctx, item)
        default:
          throw new Error(
            `Unsupported grid row kind: ${String(
              (item as { rowKind: unknown }).rowKind
            )}`
          )
      }
    default:
      throw new Error(
        `Unsupported diagram content kind: ${String(
          (item as { kind: unknown }).kind
        )}`
      )
  }
}

export const renderMarbleDiagram = (
  spec: DiagramSpecification,
  options: RendererOptions = {}
): DiagramRendering => {
  const styles = {
    ...lightStyles,
    ...options.styles,
    ...spec.styles
  }

  const document = createSvgDocument(options.DOMParser)
  const $svg = document.documentElement

  const $group = createSvgElement(document, 'g')
  translate($group, styles.canvas_padding!, styles.canvas_padding!)
  $svg.appendChild($group)

  const streamHeight = Math.max(
    styles.event_radius! * 2,
    styles.completion_height!,
    styles.error_size!
  )

  const streamTitleEnabled = spec.content.some(
    (item) => item.kind === 'S' && hasTitle(item)
  )

  const axisSpecs = spec.content.filter(
    (item): item is TimeAxisSpecification => item.kind === 'T'
  )
  if (axisSpecs.length > 1) {
    throw new Error(
      `A diagram can define at most one time axis, found ${axisSpecs.length}`
    )
  }
  const axisSpec = axisSpecs.length > 0 ? axisSpecs[0] : null

  // Without a layout engine on the Node path there is nothing to measure text
  // with, so fall back to an estimator unless the caller supplies something
  // better. See util/text-metrics.ts.
  const measureText = options.measureText ?? estimateTextWidth

  // In grid mode every row kind can carry a label, so the gutter is sized as
  // soon as any of them does. Frame mode keeps using stream_title_width.
  const gutterWidth =
    axisSpec != null && spec.content.some(hasTitle)
      ? measureGutter(spec.content, axisSpec, styles, measureText)
      : 0

  const axis =
    axisSpec != null
      ? resolveTimeAxis(
        axisSpec,
        styles,
        gutterWidth,
        measureColumnContents(spec.content, axisSpec, styles, measureText)
      )
      : createFrameAxis(styles)

  const ctx: RendererContext = {
    DOMParser: options.DOMParser,
    document,
    styles,
    streamHeight,
    streamTitleEnabled,
    axis,
    measureText
  }

  const updaters: Array<(ctx: PostRenderUpdateContext) => void> = []

  // The transaction grid spans every row, so it is rendered into a background
  // layer that sits outside the vertical flow and is sized in the post-render
  // pass, once the diagram's total height is known.
  if (axisSpec != null) {
    const grid = renderTimeGrid(ctx, axis)
    $group.appendChild(grid.element)
    updaters.push(grid.update!)
  }

  let minX = 0
  let maxX = 0
  let y = 0
  for (const item of spec.content) {
    const rendererResult: RendererResult = renderContentItem(ctx, item)
    const { element, bbox, update } = rendererResult as UpdatableRendererResult

    translate(element, 0, y - bbox.y1)
    $group.appendChild(element)

    minX = Math.min(minX, bbox.x1)
    maxX = Math.max(maxX, bbox.x2)

    const height = bbox.y2 - bbox.y1
    y += height + styles.stream_spacing!

    if (update != null) {
      updaters.push(update)
    }
  }

  const dx = minX < 0 ? -minX : 0
  translate($group, dx, 0)

  const innerWidth = Math.max(maxX - minX, styles.minimum_width!)
  const innerHeight = Math.max(
    y - styles.stream_spacing!,
    styles.minimum_height!
  )

  const width = styles.canvas_padding! + innerWidth + styles.canvas_padding!
  const height = styles.canvas_padding! + innerHeight + styles.canvas_padding!

  setSvgDimensions($svg, width, height)

  const bgColor = styles.background_color!
  if (bgColor !== '' && bgColor !== 'transparent') {
    const $bg = createSvgElement(document, 'rect', {
      x: 0,
      y: 0,
      width,
      height,
      fill: bgColor
    })
    $svg.insertBefore($bg, $svg.firstChild)
  }

  for (const update of updaters) {
    update({
      width: innerWidth,
      height: innerHeight,
      dx
    })
  }

  return {
    document,
    width,
    height
  }
}
