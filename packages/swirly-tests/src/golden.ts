import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'

import { describeDifference } from './lib/diff.js'
import {
  goldenPath,
  listSpecs,
  renderSpec,
  SPEC_SOURCES,
  SpecSource,
  THEME_NAMES
} from './lib/specs.js'

const UPDATE_HINT =
  'If the change is intentional, regenerate the golden files by running ' +
  '`yarn run test:golden:update` from the repository root, then review the diff.'

const readGolden = async (
  path: string,
  label: string
): Promise<string> => {
  try {
    return await fs.readFile(path, 'utf8')
  } catch (err: any) {
    if (err?.code === 'ENOENT') {
      throw new Error(`No golden rendering for ${label} at ${path}. ${UPDATE_HINT}`)
    }
    throw err
  }
}

const specsBySource = new Map<SpecSource, string[]>()
for (const source of SPEC_SOURCES) {
  specsBySource.set(source, await listSpecs(source))
}

test('every specification source contributes at least one spec', () => {
  for (const [source, names] of specsBySource) {
    assert.ok(
      names.length > 0,
      `no specifications found in ${source.dir}; is the directory missing?`
    )
  }
})

for (const [source, names] of specsBySource) {
  for (const name of names) {
    for (const theme of THEME_NAMES) {
      const label = `${source.name}/${name} (${theme})`

      test(`${label} renders identically to its golden file`, async () => {
        const path = goldenPath(source, name, theme)
        const expected = await readGolden(path, label)
        const actual = await renderSpec(source, name, theme)

        if (actual === expected) {
          return
        }

        const actualPath = `${path}.actual`
        await fs.writeFile(actualPath, actual)

        assert.fail(
          [
            `Rendering of ${label} changed.`,
            `  golden: ${path}`,
            `  actual: ${actualPath}`,
            describeDifference(expected, actual),
            UPDATE_HINT
          ].join('\n')
        )
      })
    }
  }
}
