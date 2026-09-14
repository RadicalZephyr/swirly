import { createFrameAxis } from '../axis/resolve.js'
import { renderMessage } from '../message/index.js'
import { RendererContext } from '../types.js'
import { createRenderStream } from './factory.js'

export const renderStreamBase = createRenderStream(renderMessage)

/**
 * The context a marble stream renders in: the diagram's, with a frame axis in
 * place of whatever axis the diagram has.
 *
 * Marble geometry is frame-timed. It reads `axis.scale(duration)` as a length
 * and `axis.scale(frame)` as a position, and the two agree only on an axis
 * whose origin is 0. A grid axis offsets by the gutter and clamps to its
 * columns, so a stream nested in an operator title inside a grid diagram
 * would be stretched to the axis's end with its marbles pushed onto its
 * completion. In frame mode the diagram's axis already is a frame axis, so
 * nothing moves.
 */
export const marbleContext = (ctx: RendererContext): RendererContext => ({
  ...ctx,
  axis: createFrameAxis(ctx.styles)
})
