import { Parser } from '../types.js'
import { diagramStylesParser } from './diagram-styles.js'
import { gridRowParser } from './grid-row.js'
import { messageStylesParser } from './message-styles.js'
import { operatorParser } from './operator.js'
import { streamParser } from './stream.js'
import { timeAxisParser } from './time-axis.js'

export const parsers: readonly Parser[] = [
  diagramStylesParser,
  messageStylesParser,
  timeAxisParser,
  gridRowParser,
  operatorParser,
  streamParser
]
