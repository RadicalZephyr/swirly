import { lightStyles } from '@swirly/theme-default-light'
import { DiagramStyles } from '@swirly/types'

/**
 * Line art matching the figures in the Sodium FRP book: the light theme's
 * black on white, less its fills and tints, everything italic, and columns
 * sized to what they hold rather than to one width for the whole diagram —
 * figures 11 and 15 vary their column widths within a single diagram.
 *
 * Only what differs from the light theme is named here, so a change to a
 * light colour reaches the figures too.
 */
export const sodiumStyles: DiagramStyles = {
  ...lightStyles,
  axis_column_sizing: 'content',
  barrier_color: 'black',
  // The book draws no knockout fills; a marble is an outline with its value
  // inside, the same black on the same white as everything else.
  event_fill_color: 'white',
  event_value_font_style: 'italic',
  grid_annotation_value_font_style: 'italic',
  grid_cell_value_font_style: 'italic',
  grid_line_color: 'black',
  grid_row_value_font_style: 'italic',
  range_fill_color: 'white',
  stream_title_font_style: 'italic'
}
