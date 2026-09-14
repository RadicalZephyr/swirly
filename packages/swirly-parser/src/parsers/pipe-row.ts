import { parseConfig } from './config.js'

export type PipeRow = {
  // The label, trimmed; the empty string when there is none.
  title: string
  // What follows each `|`, in order and untrimmed.
  segments: string[]
  config: Record<string, any>
}

/**
 * The line grammar the axis and every grid row share: a sigil, a label, then
 * `|`-separated segments.
 *
 * One `|` declares one segment -- a column on the axis, a slot on a row -- on
 * every line, with no special case. A final `|` with nothing after it is one
 * more, empty, segment rather than a terminator, which is what keeps a row's
 * pipe count equal to the axis's, including when the row's last slot is empty.
 * The label may be empty too.
 *
 * The lines after the first are `key = value` config; a `title` there
 * overrides the label on the line.
 */
export const parsePipeRow = (
  lines: readonly string[],
  reSigil: RegExp,
  verbatimConfigKeys: readonly string[] = []
): PipeRow => {
  const [header, ...configLines] = lines
  const config = parseConfig(configLines, false, verbatimConfigKeys)

  const [labelSegment, ...segments] = header.replace(reSigil, '').split('|')
  const title =
    typeof config.title === 'string' ? config.title : labelSegment.trim()

  return { title, segments, config }
}
