import { baseStyles } from '@swirly/theme-default-base'
import { DiagramStyles } from '@swirly/types'

/**
 * Line art matching the figures in the Sodium FRP book: black on white, no
 * fills, everything italic, and columns sized to what they hold rather than to
 * one width for the whole diagram — figures 11 and 15 vary their column widths
 * within a single diagram.
 */
export const sodiumStyles: DiagramStyles = {
  ...baseStyles,
  arrow_fill_color: '',
  arrow_stroke_color: 'black',
  axis_column_sizing: 'content',
  axis_label_color: 'black',
  axis_label_font_style: 'italic',
  background_color: 'white',
  barrier_color: 'black',
  completion_stroke_color: 'black',
  error_color: 'black',
  // The book draws no knockout fills; a marble is an outline with its value
  // inside, the same black on the same white as everything else.
  event_fill_color: 'white',
  event_stroke_color: 'black',
  event_value_color: 'black',
  event_value_font_style: 'italic',
  grid_annotation_value_color: 'black',
  grid_annotation_value_font_style: 'italic',
  grid_cell_fill_color: 'white',
  grid_cell_stroke_color: 'black',
  grid_cell_value_color: 'black',
  grid_cell_value_font_style: 'italic',
  grid_line_color: 'black',
  grid_row_value_color: 'black',
  grid_row_value_font_style: 'italic',
  operator_fill_color: 'white',
  operator_stroke_color: 'black',
  operator_title_color: 'black',
  range_fill_color: 'white',
  range_stroke_color: 'black',
  row_label_color: 'black',
  row_label_font_style: 'italic',
  stream_title_color: 'black',
  stream_title_font_style: 'italic'
}
