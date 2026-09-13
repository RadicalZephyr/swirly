import { TestMessage } from '@swirly/parser-rxjs'
import {
  DiagramContent,
  DiagramStyles,
  ScalarNextMessageStyles
} from '@swirly/types'

export type ParserContext = {
  content: DiagramContent
  diagramStyles: DiagramStyles
  messageStyles: Record<string, ScalarNextMessageStyles>
  allValues: Record<string, TestMessage[]>
  // True when the diagram declares a time axis, which puts it in grid mode.
  // Marble rows carry no meaning there and are rejected rather than parsed
  // into something that renders but is not what the author wrote.
  gridMode?: boolean
}

export type Parser = {
  match: (line: string) => boolean
  run: (lines: readonly string[], ctx: ParserContext) => void
}
