import { TimeAxisStyles } from './styles.js'

export type ColumnSpecification = {
  label: string
  // Nesting level of the transaction this column represents. Drives the weight
  // of the grid line that opens it.
  depth?: number
  // Explicit width in pixels, overriding whatever the column sizing policy
  // would otherwise compute.
  width?: number
}

export type TimeAxisSpecification = {
  kind: 'T'
  title: string | null
  columns: ColumnSpecification[]
  styles?: TimeAxisStyles
}
