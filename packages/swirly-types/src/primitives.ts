export type NonNegativeNumber = number

export type Color = string

export type FontFamily = string

export type FontStyle = string

export type FontWeight = string | number

export type FreeformStyles = Record<string, any>

/** How `resolveTimeAxis` decides a grid column's width. */
export type ColumnSizing = 'fixed' | 'uniform' | 'content'
