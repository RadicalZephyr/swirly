# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Swirly is a marble-diagram generator: it turns a text specification (an extension
of RxJS marble-testing syntax) into an SVG, and optionally rasterizes that to
PNG. It ships as a CLI (`swirly`), a web app (swirly.dev), and a set of
`@swirly/*` library packages. Upstream is https://github.com/timdp/swirly.

## Commands

Requires Node 16.19.1 (`.nvmrc`); yarn 1 (classic) with workspaces.

```bash
yarn                      # install
yarn build                # turbo run build — compiles every package to dist/
yarn test                 # lint + golden-file tests (what CI runs)
yarn test:golden          # golden tests only (builds deps first via turbo)
yarn test:golden:update   # rebuild @swirly/tests, then rewrite golden SVGs
yarn lint                 # lint:js (eslint) + lint:deps (polydepcheck)
yarn format               # prettier-eslint --write across the repo
```

Tests run from **compiled `dist/`**, not source — a stale build means stale test
results. `yarn test:golden` handles the build via turbo; if running the test
file directly, `yarn build` first.

Run a single golden test (after building):

```bash
node --test-name-pattern="concatAll" packages/swirly-tests/dist/golden.js
```

The pre-commit hook (`.husky/pre-commit`) runs lint-staged + `yarn lint` +
`yarn build` — heavy; expect it to be slow.

## Golden-file tests

`packages/swirly-tests` renders every `examples/*.txt` in both the light and dark
themes and compares the serialized SVG XML byte-for-byte against
`packages/swirly-tests/golden/<name>.<theme>.svg`. A failing run writes a
`<golden>.actual` file next to the golden. If a rendering change is intentional,
run `yarn test:golden:update` and review the diff.

Note: `examples/*.png` and `examples/*.svg` are **build outputs** of
`@swirly/examples` (rasterized locally); byte churn there after a build is
rasterizer noise, not a regression.

## Build system

Turborepo (`turbo.json`) + Lerna (publish only) over yarn workspaces. Each
package compiles with TypeScript project references: `scripts/build-ts.sh` runs
`scripts/build-tsconfig.js` (which auto-populates `tsconfig.json` `references`
from the package's `@swirly/*` deps) then `tsc`. `tsconfig.base.json` is
`strict`, ESM (`"type": "module"`, `.js` import specifiers in `.ts` source),
`composite`.

## Architecture

Pipeline: **spec text → parser → `DiagramSpecification` → renderer → SVG DOM →
serialized XML → rasterizer → PNG**.

### Packages

| Package | Role |
| --- | --- |
| `swirly` | CLI entry (`dist/cli.js`); wires parser + renderer + rasterization |
| `@swirly/parser` | Text spec → `DiagramSpecification` |
| `@swirly/parser-rxjs` | The RxJS marble parser (`parseMarbles`), extracted and bundled |
| `@swirly/renderer` | `renderMarbleDiagram(spec, options)` → SVG DOM (platform-agnostic) |
| `@swirly/renderer-node` | Node wrapper: injects `@xmldom/xmldom` `DOMParser`, serializes to `xml` string |
| `@swirly/types` | All shared TypeScript types (`DiagramSpecification`, `DiagramStyles`, …) |
| `@swirly/theme-default-base` | Shared style defaults; `-light` / `-dark` extend it |
| `@swirly/rasterization-{client,server}` | SVG → PNG over HTTP; server hosts rasterizer backends |
| `@swirly/rasterizer-{inkscape,puppeteer,imagemagick,cairo}` | Rasterizer backends |
| `@swirly/web` | swirly.dev editor; esbuild bundle, consumes `@swirly/renderer` directly |
| `@swirly/examples` | Builds `examples/*.{svg,png}` and `examples.md` from `examples/*.txt` |
| `@swirly/tests` | Golden-file tests (above) |

### Parser

`parseMarbleDiagramSpecification` splits the source into blocks on blank lines
(`%` starts a comment line) via `util/by-block.ts`. Each block's first line is
matched against the **ordered** `parsers` list in
`packages/swirly-parser/src/parsers/index.ts` — first match wins, and
`streamParser.match` returns `true` unconditionally, so it is the catch-all and
must stay last. Lines after the first in a block are `key: value` config
(`parseConfig`). RxJS `TestScheduler` frame times (factor 10) are divided back
out.

### Renderer

`packages/swirly-renderer/src/index.ts` — `renderMarbleDiagram`:

1. Merge styles: theme defaults ← `options.styles` ← `spec.styles`.
2. Single pass over `spec.content`, dispatching on `item.kind` (`'S'` stream,
   `'O'` operator) — an unknown kind throws.
3. Each item is placed down a running `y` cursor; bounding boxes are unioned;
   negative x is corrected with a group-wide `dx` shift.
4. Post-render `update({ width, height, dx })` pass for `UpdatableRendererResult`
   items (today only operator bands, for width).

There is **no layout engine on the Node path** — `@xmldom/xmldom` is a bare XML
DOM, so `getBBox`/`getComputedTextLength` do not exist. Swirly works around this
with fixed radii/widths and `foreignObject` + flexbox for rich operator titles,
deferring measurement to whatever finally renders the SVG.

## Grid mode (in progress)

Branch `grid-mode` is implementing `docs/grid-mode-plan.md`: transaction-aligned
grid/timeline diagrams for the Sodium FRP figures in `sodium-diagrams/`
(`e0fig01`–`e0fig20`, reference JPEGs). The plan introduces a diagram-level time
axis (`ResolvedTimeAxis`) as the single source of x-coordinates, with classic
frame mode re-expressed as a uniform unlabelled axis. Phase 0 (golden harness +
explicit `kind` dispatch, replacing `isStream = !isOperator`) is done. Read the
plan before touching the renderer's layout or the parser's dispatch list.
