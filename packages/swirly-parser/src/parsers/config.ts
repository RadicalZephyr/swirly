import { isNumeric } from '../util/is-numeric.js'

const reLine = /^(.*?)(?:\s*(:?)=\s*(.*))?$/

const parseValue = (value: string): string | number | boolean => {
  if (value == null) {
    return true
  }
  if (isNumeric(value)) {
    return parseFloat(value)
  }
  return value
}

export const parseConfig = (
  lines: readonly string[],
  allowAssignment: boolean,
  // Keys whose value is kept as written rather than coerced: ones that name
  // something, where `01` and `1` are two different names.
  verbatimKeys: readonly string[] = []
): Record<string, any> => {
  const config: Record<string, any> = {}
  if (allowAssignment) {
    config.values = {}
  }

  for (const line of lines) {
    const match = reLine.exec(line.trim())
    if (match != null) {
      const [, name, isAssignment, value] = match
      if (isAssignment) {
        config.values[name] = value
      } else {
        config[name] = verbatimKeys.includes(name) ? value : parseValue(value)
      }
    }
  }

  return config
}
