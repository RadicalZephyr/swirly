import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'

import { describeDifference } from './lib/diff.js'
import {
  goldenPath,
  listExamples,
  renderExample,
  THEME_NAMES
} from './lib/examples.js'

const UPDATE_HINT =
  'If the change is intentional, regenerate the golden files by running ' +
  '`yarn workspace @swirly/tests run update-golden`, then review the diff.'

const readGolden = async (
  path: string,
  name: string,
  theme: string
): Promise<string> => {
  try {
    return await fs.readFile(path, 'utf8')
  } catch (err: any) {
    if (err?.code === 'ENOENT') {
      throw new Error(
        `No golden rendering for ${name} (${theme}) at ${path}. ${UPDATE_HINT}`
      )
    }
    throw err
  }
}

const names = await listExamples()

test('every example specification has a golden rendering', () => {
  assert.ok(
    names.length > 0,
    'no example specifications were found; is the examples directory missing?'
  )
})

for (const name of names) {
  for (const theme of THEME_NAMES) {
    test(`${name} (${theme}) renders identically to its golden file`, async () => {
      const path = goldenPath(name, theme)
      const expected = await readGolden(path, name, theme)
      const actual = await renderExample(name, theme)

      if (actual === expected) {
        return
      }

      const actualPath = `${path}.actual`
      await fs.writeFile(actualPath, actual)

      assert.fail(
        [
          `Rendering of ${name} (${theme}) changed.`,
          `  golden: ${path}`,
          `  actual: ${actualPath}`,
          describeDifference(expected, actual),
          UPDATE_HINT
        ].join('\n')
      )
    })
  }
}
