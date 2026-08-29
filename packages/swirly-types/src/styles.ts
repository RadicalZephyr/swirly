import {
  Color,
  FontFamily,
  FontStyle,
  FontWeight,
  NonNegativeNumber
} from './primitives.js'

/* eslint-disable */

export type StreamStyles = {
  title_color?: Color
  title_font_family?: FontFamily
  title_font_size?: NonNegativeNumber
  title_font_style?: FontStyle
  title_font_weight?: FontWeight
  title_width?: NonNegativeNumber
}

export type TimeAxisStyles = {
  column_width?: NonNegativeNumber
  header_height?: NonNegativeNumber
  label_color?: Color
  label_font_family?: FontFamily
  label_font_size?: NonNegativeNumber
  label_font_style?: FontStyle
  label_font_weight?: FontWeight
}

export type RowLabelStyles = {
  color?: Color
  font_family?: FontFamily
  font_size?: NonNegativeNumber
  font_style?: FontStyle
  font_weight?: FontWeight
  gap?: NonNegativeNumber
  width?: NonNegativeNumber
}

export type TimeGridStyles = {
  line_bleed?: NonNegativeNumber
  line_color?: Color
  line_dash_width?: NonNegativeNumber
  line_depth_stroke_width_step?: NonNegativeNumber
  line_stroke_width?: NonNegativeNumber
}

export type GridStreamRowStyles = {
  height?: NonNegativeNumber
  lead?: NonNegativeNumber
  tail?: NonNegativeNumber
  value_color?: Color
  value_font_family?: FontFamily
  value_font_size?: NonNegativeNumber
  value_font_style?: FontStyle
  value_font_weight?: FontWeight
}

export type ArrowStyles = {
  fill_color?: Color | ''
  stroke_color?: Color
  stroke_width?: NonNegativeNumber
  width?: NonNegativeNumber
}

export type ScalarNextMessageStyles = {
  fill_color?: Color | 'auto_light' | 'auto_dark' | 'auto'
  stroke_color?: Color
  stroke_width?: NonNegativeNumber
  value_color?: Color
  value_font_family?: FontFamily
  value_font_size?: NonNegativeNumber
  value_font_style?: FontStyle
  value_font_weight?: FontWeight
}

export type StreamNextMessageStyles = {}

export type CompletionMessageStyles = {
  height?: NonNegativeNumber
  stroke_color?: Color
  stroke_width?: NonNegativeNumber
}

export type ErrorMessageStyles = {
  color?: Color
  size?: NonNegativeNumber
  stroke_width?: NonNegativeNumber
}

export type OperatorStyles = {
  corner_radius?: NonNegativeNumber
  fill_color?: Color
  height?: NonNegativeNumber
  spacing?: NonNegativeNumber
  stroke_color?: Color
  stroke_width?: NonNegativeNumber
  title_color?: Color
  title_font_family?: FontFamily
  title_font_size?: NonNegativeNumber
  title_font_style?: FontStyle
  title_font_weight?: FontWeight
  stream_scale?: number
}

export type BarrierDecorationStyles = {
  color?: Color
  stroke_dash_width?: NonNegativeNumber
  stroke_width?: NonNegativeNumber
}

export type RangeDecorationStyles = {
  fill_color?: Color
  height?: NonNegativeNumber
  stroke_color?: Color
  stroke_width?: NonNegativeNumber
}

export type DiagramStyles = {
  arrow_fill_color?: Color | ''
  arrow_stroke_color?: Color
  arrow_stroke_width?: NonNegativeNumber
  arrow_width?: NonNegativeNumber
  arrowhead_angle?: NonNegativeNumber
  axis_column_width?: NonNegativeNumber
  axis_header_height?: NonNegativeNumber
  axis_label_color?: Color
  axis_label_font_family?: FontFamily
  axis_label_font_size?: NonNegativeNumber
  axis_label_font_style?: FontStyle
  axis_label_font_weight?: FontWeight
  background_color?: Color
  barrier_color?: Color
  barrier_stroke_dash_width?: NonNegativeNumber
  barrier_stroke_width?: NonNegativeNumber
  canvas_padding?: NonNegativeNumber
  completion_height?: NonNegativeNumber
  completion_stroke_color?: Color
  completion_stroke_width?: NonNegativeNumber
  error_color?: Color
  error_size?: NonNegativeNumber
  error_stroke_width?: NonNegativeNumber
  event_fill_color?: Color | 'auto_light' | 'auto_dark' | 'auto'
  event_radius?: NonNegativeNumber
  event_stroke_color?: Color
  event_stroke_width?: NonNegativeNumber
  event_value_color?: Color
  event_value_font_family?: FontFamily
  event_value_font_size?: NonNegativeNumber
  event_value_font_style?: FontStyle
  event_value_font_weight?: FontWeight
  frame_width?: NonNegativeNumber
  ghost_opacity?: NonNegativeNumber
  grid_line_bleed?: NonNegativeNumber
  grid_line_color?: Color
  grid_line_dash_width?: NonNegativeNumber
  grid_line_depth_stroke_width_step?: NonNegativeNumber
  grid_line_stroke_width?: NonNegativeNumber
  grid_row_height?: NonNegativeNumber
  grid_row_lead?: NonNegativeNumber
  grid_row_tail?: NonNegativeNumber
  grid_row_value_color?: Color
  grid_row_value_font_family?: FontFamily
  grid_row_value_font_size?: NonNegativeNumber
  grid_row_value_font_style?: FontStyle
  grid_row_value_font_weight?: FontWeight
  higher_order_angle?: NonNegativeNumber
  higher_order_event_value_angle?: NonNegativeNumber
  minimum_height?: NonNegativeNumber
  minimum_width?: NonNegativeNumber
  operator_corner_radius?: NonNegativeNumber
  operator_fill_color?: Color
  operator_height?: NonNegativeNumber
  operator_spacing?: NonNegativeNumber
  operator_stroke_color?: Color
  operator_stroke_width?: NonNegativeNumber
  operator_title_color?: Color
  operator_title_font_family?: FontFamily
  operator_title_font_size?: NonNegativeNumber
  operator_title_font_style?: FontStyle
  operator_title_font_weight?: FontWeight
  operator_stream_scale?: number
  range_fill_color?: Color
  range_height?: NonNegativeNumber
  range_stroke_color?: Color
  range_stroke_width?: NonNegativeNumber
  row_label_color?: Color
  row_label_font_family?: FontFamily
  row_label_font_size?: NonNegativeNumber
  row_label_font_style?: FontStyle
  row_label_font_weight?: FontWeight
  row_label_gap?: NonNegativeNumber
  row_label_width?: NonNegativeNumber
  stacking_height?: NonNegativeNumber
  stream_spacing?: NonNegativeNumber
  stream_title_color?: Color
  stream_title_font_family?: FontFamily
  stream_title_font_size?: NonNegativeNumber
  stream_title_font_style?: FontStyle
  stream_title_font_weight?: FontWeight
  stream_title_width?: NonNegativeNumber
}

/* eslint-enable */
