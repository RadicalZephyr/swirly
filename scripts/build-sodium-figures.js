#!/usr/bin/env node

// Renders docs/sodium-figures/*.txt with the Sodium theme and writes
// docs/sodium-figures.md, pairing each recreation with the scanned figure it
// was transcribed from. Run from anywhere: `node scripts/build-sodium-figures.js`.

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseMarbleDiagramSpecification } from '@swirly/parser'
import { renderMarbleDiagram } from '@swirly/renderer-node'
import { sodiumStyles } from '@swirly/theme-sodium'

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url))
const FIGURES_DIR = path.join(REPO_ROOT, 'docs', 'sodium-figures')
const OUT_FILE = path.join(REPO_ROOT, 'docs', 'sodium-figures.md')

// Figure number -> the scanned JPEG it was transcribed from, and what the
// diagram shows. Descriptions are read off the figures themselves, not from the
// book's prose.
const FIGURES = [
  [
    'fig01',
    'e0fig01',
    'The bare apparatus: a transaction axis labelled `t`, one dashed boundary opening each transaction, and a stream `s` that never fires. Sodium streams do not complete, so the line simply runs off the right.'
  ],
  [
    'fig02',
    'e0fig02',
    'Two streams firing in every transaction. Values sit on the line rather than inside a marble, and rows share one axis, so what happens simultaneously lines up vertically.'
  ],
  [
    'fig03',
    'e0fig03_alt',
    'A cell and two streams over nine transactions. The box holds `3`, then `4` from transaction 2, then `7` from transaction 6, while `s1` and `s2` fire at 0, 3 and 5. Unlike the `hold` figures below, the cell here does not track either stream one transaction behind.'
  ],
  [
    'fig04',
    'e0fig04',
    'Three streams, two of them merging into a third. Where both `s1` and `s2` fire in the same transaction — transaction 2 — `s3` carries a single combined value rather than two.'
  ],
  [
    'fig05',
    'e0fig05',
    "Filtering. `s2` carries only some of `s1`'s values, and a transaction in which nothing passes leaves a blank slot rather than a gap in the line."
  ],
  [
    'fig06',
    'e0fig06',
    "A cell holding streams. The slots of `c` name rows rather than literals, so `c` refers to `s1` and then to `s2`; `s3` is the result of switching on it, taking `s1`'s values and then `s2`'s."
  ],
  [
    'fig07',
    'e0fig07',
    "A single transaction with multi-token values. A slot is drawn verbatim, so it can hold an expression such as `return 'a'` and not just one character."
  ],
  [
    'fig08',
    'e0fig08',
    "`hold`: the cell takes each of `s1`'s values one transaction after it fires — `'b'` at 1 becomes the cell's value at 2 — and the box closes at transaction 5 while the line carries on."
  ],
  [
    'fig09',
    'e0fig09',
    'The same `hold` with the stream firing in consecutive transactions. The cell still lags by exactly one, and its initial value is already in place before transaction 0.'
  ],
  [
    'fig10',
    'e0fig10',
    "`hold` again, with a change in every early transaction: the box is divided at 1, 2 and 4, one step behind the stream's 0, 1 and 3."
  ],
  [
    'fig11',
    'e0fig11',
    'Split transactions. A column label can name a nested transaction — `[0,0]` inside `[0]` — and a stream may carry a list of values for the whole outer transaction while another fires once per inner one.'
  ],
  [
    'fig12',
    'e0fig12',
    'A constant cell. One value, no dividers, and the box is already open before transaction 0 and still open after the last.'
  ],
  [
    'fig13',
    'e0fig13',
    'A cell changing twice. Each divider marks the transaction in which the held value changes; between dividers the box simply holds.'
  ],
  [
    'fig14',
    'e0fig14',
    'Two cells changing in the same transactions, so their dividers line up. Reading a column downwards gives the state of both cells at that instant.'
  ],
  [
    'fig15',
    'e0fig15',
    'A cell of functions applied to a cell of values. `cf` holds `(0+)`, then `(5+)`, then `(6+)`; `cb` is the result, and changes whenever either input does — at 2, 3, 4 and 5 — where `ca` alone changes at 2, 3 and 5.'
  ],
  [
    'fig16',
    'e0fig16',
    "`switch`: `c3` holds a reference to another cell, and `c4` is what comes out — `c1`'s values while `c3` holds `c1`, then `c2`'s from transaction 2."
  ],
  [
    'fig17',
    'e0fig17',
    "The same switch with a `c2` that changes less often. `c4` still follows whichever cell `c3` currently names, holding `'X'` across the switch because that is `c2`'s value at the time."
  ],
  [
    'fig18',
    'e0fig18',
    "Switching to a cell that has not changed for a while: `c2` holds `'X'` from before transaction 0 through transaction 2, so `c4` picks up `'X'` at the switch and only moves again at 3."
  ],
  [
    'fig19',
    'e0fig19',
    'Switching twice, between three cells. `c4` names `c1`, then `c2` at transaction 2, then `c3` at 4, and `c5` takes its value from whichever is current.'
  ],
  [
    'fig20',
    'e0fig20',
    'Annotation rows. `a1` and `a2` address the same columns as every other row but carry no line — they comment on a transaction rather than being a stream or a cell. The cell `c` stops holding at transaction 3.'
  ]
]

const HEADER = `# The Sodium figures, recreated

Every diagram in \`sodium-diagrams/\` (\`e0fig01\`–\`e0fig20\`) rebuilt as a Swirly
grid-mode specification. This is the acceptance test for grid mode: if a figure
here cannot be expressed, grid mode is missing something.

Recreations are rendered with [\`@swirly/theme-sodium\`](../packages/swirly-theme-sodium),
which matches the book's line art — black on white, no fills, everything italic,
and columns sized to what they hold. Each is shown beside the scan it was
transcribed from; the transcriptions were measured off those scans rather than
eyeballed, so column counts, divider positions and early box closures line up.

One systematic difference is visible in every pair, and it is deliberate: the
book **left-aligns each column label** just past the boundary that opens it,
where Swirly centres it in the column.

Boundaries now match one-for-one. Swirly draws exactly one dashed line per
column declared in the source and none after the last, which is how fifteen of
these twenty figures are drawn. The other five -- 4, 5, 6, 7 and 12 -- do close
their last column, and say so with a trailing unlabelled column:

\`\`\`text
@ t | 0 | 1 | |
\`\`\`

Regenerate with:

\`\`\`bash
yarn build && node scripts/build-sodium-figures.js
\`\`\`
`

const main = async () => {
  const sections = []

  for (const [name, source, description] of FIGURES) {
    const specPath = path.join(FIGURES_DIR, `${name}.txt`)
    const spec = await fs.readFile(specPath, 'utf8')

    const { xml } = renderMarbleDiagram(parseMarbleDiagramSpecification(spec), {
      styles: sodiumStyles
    })
    await fs.writeFile(path.join(FIGURES_DIR, `${name}.svg`), xml)

    const number = Number(name.slice(3))
    sections.push(
      [
        `## Figure ${number}`,
        '',
        description,
        '',
        '| Recreation | Source |',
        '| --- | --- |',
        `| <img alt="Figure ${number} recreated" src="sodium-figures/${name}.svg"> ` +
          `| <img alt="Figure ${number}" src="../sodium-diagrams/${source}.jpg"> |`,
        '',
        '```',
        spec.trimEnd(),
        '```'
      ].join('\n')
    )
  }

  const contents = FIGURES.map(([name]) => {
    const number = Number(name.slice(3))
    return `[${number}](#figure-${number})`
  }).join(' · ')

  await fs.writeFile(
    OUT_FILE,
    [HEADER, '', contents, '', sections.join('\n\n'), ''].join('\n')
  )

  console.log(
    `Wrote ${FIGURES.length} figures to ${path.relative(REPO_ROOT, OUT_FILE)}`
  )
}

await main()
