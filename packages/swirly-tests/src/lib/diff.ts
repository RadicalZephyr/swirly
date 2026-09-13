const CONTEXT = 80

const firstDifferenceOffset = (expected: string, actual: string): number => {
  const shared = Math.min(expected.length, actual.length)
  for (let i = 0; i < shared; ++i) {
    if (expected[i] !== actual[i]) {
      return i
    }
  }
  return shared
}

export const describeDifference = (
  expected: string,
  actual: string
): string => {
  const offset = firstDifferenceOffset(expected, actual)
  const preceding = expected.slice(Math.max(0, offset - CONTEXT), offset)
  return [
    `First difference at offset ${offset} of ${expected.length}.`,
    `  preceded by: ...${preceding}`,
    `  expected:    ${JSON.stringify(
      expected.slice(offset, offset + CONTEXT)
    )}`,
    `  actual:      ${JSON.stringify(actual.slice(offset, offset + CONTEXT))}`
  ].join('\n')
}
