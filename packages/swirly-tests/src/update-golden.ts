import fs from 'node:fs/promises'
import path from 'node:path'

import {
  GOLDEN_DIR,
  goldenPath,
  listExamples,
  renderExample,
  THEME_NAMES
} from './lib/examples.js'

await fs.mkdir(GOLDEN_DIR, { recursive: true })

const names = await listExamples()

const expected = new Set<string>()
for (const name of names) {
  for (const theme of THEME_NAMES) {
    const target = goldenPath(name, theme)
    await fs.writeFile(target, await renderExample(name, theme))
    expected.add(path.basename(target))
  }
}

// Drop renderings for examples that no longer exist, plus any .actual files
// left behind by a failing run.
const stale = (await fs.readdir(GOLDEN_DIR)).filter(
  (entry) => !expected.has(entry)
)
for (const entry of stale) {
  await fs.rm(path.join(GOLDEN_DIR, entry))
}

console.log(
  `Wrote ${expected.size} golden rendering(s) for ${names.length} example(s)` +
    (stale.length > 0 ? `, removed ${stale.length} stale file(s)` : '')
)
