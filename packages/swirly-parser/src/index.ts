import { DiagramSpecification } from '@swirly/types'

import { parsers } from './parsers/index.js'
import { isTimeAxisLine } from './parsers/time-axis.js'
import { createDiagramSpecification } from './spec/diagram.js'
import {
  createGridAnnotationRowSpecification,
  createGridCellRowSpecification,
  createGridStreamRowSpecification
} from './spec/grid-row.js'
import { createOperatorSpecification } from './spec/operator.js'
import { resolveReferences } from './spec/references.js'
import { createStreamSpecification } from './spec/stream.js'
import { createTimeAxisSpecification } from './spec/time-axis.js'
import { ParserContext } from './types.js'
import { byBlock } from './util/by-block.js'

const parseMarbleDiagramSpecification = (str: string): DiagramSpecification => {
  const blocks = [...byBlock(str)]

  const ctx: ParserContext = {
    content: [],
    diagramStyles: {},
    messageStyles: {},
    allValues: {},
    // Grid mode is a property of the whole diagram, and the axis block need
    // not come first, so it is decided before any block is parsed.
    gridMode: blocks.some((lines) => isTimeAxisLine(lines[0]))
  }

  for (const lines of blocks) {
    const parser = parsers.find((parser) => parser.match(lines[0], ctx))!
    parser.run(lines, ctx)
  }

  resolveReferences(ctx.content)

  return createDiagramSpecification(ctx.content, ctx.diagramStyles)
}

export {
  createDiagramSpecification,
  createGridAnnotationRowSpecification,
  createGridCellRowSpecification,
  createGridStreamRowSpecification,
  createOperatorSpecification,
  createStreamSpecification,
  createTimeAxisSpecification,
  parseMarbleDiagramSpecification
}
