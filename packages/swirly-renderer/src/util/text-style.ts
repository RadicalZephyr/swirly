import {
  Color,
  FontDescription,
  FontFamily,
  FontStyle,
  FontWeight,
  FreeformStyles,
  NonNegativeNumber
} from '@swirly/types'

import { mergeStyles } from './merge-styles.js'

/**
 * How a run of text is set: the five keys every `*_color` / `*_font_*` family
 * in `DiagramStyles` shares, under whatever prefix it carries there.
 */
export type TextStyle = {
  color?: Color
  font_family?: FontFamily
  font_size?: NonNegativeNumber
  font_style?: FontStyle
  font_weight?: FontWeight
}

/** The text style under `prefix` in `styles`: `axis_label_`, `value_`, ... */
export const textStyle = (styles: FreeformStyles, prefix: string): TextStyle =>
  mergeStyles(styles, null, prefix)

/** The presentation attributes of a `<text>` set in `s`. */
export const textAttributes = (s: TextStyle): Record<string, string> => ({
  fill: s.color!,
  'font-family': s.font_family!,
  'font-size': s.font_size! + 'px',
  'font-weight': String(s.font_weight!),
  'font-style': s.font_style!
})

/** The same style as a `FontDescription`, for measuring text set in it. */
export const fontOf = (s: TextStyle): FontDescription => ({
  family: s.font_family!,
  size: s.font_size!,
  weight: s.font_weight!,
  style: s.font_style!
})
