import fs from 'node:fs/promises'
import path from 'node:path'

import {
  goldenDir,
  goldenPath,
  listSpecs,
  renderSpec,
  SPEC_SOURCES,
  THEME_NAMES
} from './lib/specs.js'

let written = 0
let removed = 0

for (const source of SPEC_SOURCES) {
  const dir = goldenDir(source)
  await fs.mkdir(dir, { recursive: true })

  const names = await listSpecs(source)
  const expected = new Set<string>()

  for (const name of names) {
    for (const theme of THEME_NAMES) {
      const target = goldenPath(source, name, theme)
      await fs.writeFile(target, await renderSpec(source, name, theme))
      expected.add(path.basename(target))
      ++written
    }
  }

  // Drop renderings for specs that no longer exist, plus any .actual files
  // left behind by a failing run.
  for (const entry of await fs.readdir(dir)) {
    if (!expected.has(entry)) {
      await fs.rm(path.join(dir, entry))
      ++removed
    }
  }
}

console.log(
  `Wrote ${written} golden rendering(s)` +
    (removed > 0 ? `, removed ${removed} stale file(s)` : '')
)
