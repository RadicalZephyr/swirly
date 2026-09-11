import {
  Color,
  FontFamily,
  FontStyle,
  FontWeight,
  NonNegativeNumber,
  SlotValue
} from '@swirly/types'

import { RendererContext } from '../types.js'
import { createSvgElement } from '../util/svg-xml.js'

/** The value styling every line-less row kind shares. */
export type SlotValueStyles = {
  value_color?: Color
  value_font_family?: FontFamily
  value_font_size?: NonNegativeNumber
  value_font_style?: FontStyle
  value_font_weight?: FontWeight
}

/**
 * One centred `<text>` per non-empty slot, at the centre of the column it
 * names. Shared by stream rows, where the line is then drawn over the values,
 * and annotation rows, which carry no line at all.
 */
export const renderSlotValues = (
  { document, axis }: RendererContext,
  slots: readonly SlotValue[],
  s: SlotValueStyles,
  centerY: number
): SVGElement[] => {
  const $texts: SVGElement[] = []

  for (let i = 0; i < slots.length; ++i) {
    const slot = slots[i]
    if (slot.kind === 'empty') {
      continue
    }
    $texts.push(
      createSvgElement(
        document,
        'text',
        {
          x: axis.center(i),
          y: centerY,
          fill: s.value_color!,
          'font-family': s.value_font_family!,
          'font-size': s.value_font_size! + 'px',
          'font-weight': s.value_font_weight!,
          'font-style': s.value_font_style!,
          'dominant-baseline': 'middle',
          'text-anchor': 'middle'
        },
        slot.value
      )
    )
  }

  return $texts
}
