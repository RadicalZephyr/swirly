import { SlotValue } from '@swirly/types'

import { RendererContext } from '../types.js'
import { createSvgElement } from '../util/svg-xml.js'
import { textAttributes, TextStyle } from '../util/text-style.js'

/** The text a slot shows: its value, or nothing for an empty slot. */
export const slotText = (slot: SlotValue): string | null =>
  slot.kind === 'empty' ? null : slot.value

/**
 * One centred `<text>` per column that has something to show, at the centre of
 * the column it belongs to. The axis header sets its labels this way; stream
 * rows set their values this way and then draw their line over them; an
 * annotation row is nothing but this.
 */
export const renderColumnTexts = (
  { document, axis }: RendererContext,
  texts: readonly (string | null)[],
  s: TextStyle,
  centerY: number
): SVGElement[] => {
  const $texts: SVGElement[] = []

  for (let i = 0; i < texts.length; ++i) {
    const text = texts[i]
    if (text == null || text === '') {
      continue
    }
    $texts.push(
      createSvgElement(
        document,
        'text',
        {
          x: axis.center(i),
          y: centerY,
          ...textAttributes(s),
          'dominant-baseline': 'middle',
          'text-anchor': 'middle'
        },
        text
      )
    )
  }

  return $texts
}
