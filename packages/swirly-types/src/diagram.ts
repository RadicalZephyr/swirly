import { TimeAxisSpecification } from './axis.js'
import { OperatorSpecification } from './operator.js'
import { StreamSpecification } from './stream.js'
import { DiagramStyles } from './styles.js'

export type DiagramContentItem =
  | StreamSpecification
  | OperatorSpecification
  | TimeAxisSpecification

export type DiagramContent = DiagramContentItem[]

export type DiagramSpecification = {
  content: DiagramContent
  styles?: DiagramStyles
}
