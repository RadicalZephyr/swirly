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

`packages/swirly-tests` renders specs from two directories in both the light and
dark themes and compares the serialized SVG XML byte-for-byte against
`packages/swirly-tests/golden/<source>/<name>.<theme>.svg`:

- `examples/*.txt` — the user-facing gallery rendered into `examples.md`.
- `packages/swirly-tests/fixtures/*.txt` — syntax still being built out, kept
  out of the gallery until it is ready to document.

A failing run writes a `<golden>.actual` file next to the golden. If a rendering
change is intentional, run `yarn test:golden:update` and review the diff.

`src/parsing.ts` covers parser behaviour that has no rendering of its own, such
as the errors raised for malformed input; `src/rendering.ts` covers the errors
the renderer raises for specs the parser accepts, which only become wrong once a
row is measured against the resolved axis. `dist/all.js` is the entry point that
runs all three suites.

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
must stay last. Order: `timeAxisParser` (`@`), then `gridRowParser` (`>` stream
rows, `=` cell rows, `.` annotation rows), then `operatorParser` (`>`).
`gridRowParser` and `operatorParser` share the `>` sigil; a grid row is told
apart by the pipe that comes right after its single-token label (`> s1 | … `),
which an operator title never has before its first word
(`> debounce(() => \`--|\`)`). Lines after the first in a block are
`key = value` config (`parseConfig`) — a cell row's `from` and `to` arrive that
way. RxJS `TestScheduler` frame times (factor 10) are divided back out.

`resolveReferences` (`spec/references.ts`) runs once over the finished content,
after every block is parsed: a slot whose text names some other grid row becomes
a `ref` rather than a literal. It cannot live in the row parser, because rows
are parsed one block at a time and nothing requires the row being named to come
first.

### Renderer

`packages/swirly-renderer/src/index.ts` — `renderMarbleDiagram`:

1. Merge styles: theme defaults ← `options.styles` ← `spec.styles`.
2. Resolve the time axis — see Grid mode below. Every x coordinate in the
   diagram comes from `axis.scale(time)`, in both frame and grid mode.
3. Render the background layer: the transaction grid, when the diagram has an
   axis. It sits outside the vertical flow.
4. Single pass over `spec.content`, dispatching on `item.kind` (`'S'` stream,
   `'O'` operator, `'T'` time axis, `'R'` grid row — sub-dispatched on
   `rowKind`) — an unknown kind throws.
5. Each item is placed down a running `y` cursor; bounding boxes are unioned;
   negative x is corrected with a group-wide `dx` shift.
6. Post-render `update({ width, height, dx })` pass for `UpdatableRendererResult`
   items: operator bands take the width, the transaction grid takes the height.

There is **no layout engine on the Node path** — `@xmldom/xmldom` is a bare XML
DOM, so `getBBox`/`getComputedTextLength` do not exist. Swirly works around this
with fixed radii/widths and `foreignObject` + flexbox for rich operator titles,
deferring measurement to whatever finally renders the SVG.

## Grid mode (in progress)

Branch `grid-mode` is implementing `docs/grid-mode-plan.md`: transaction-aligned
grid/timeline diagrams for the Sodium FRP figures in `sodium-diagrams/`
(`e0fig01`–`e0fig20`, reference JPEGs). Read the plan before touching the
renderer's layout or the parser's dispatch list.

`ResolvedTimeAxis` (`renderer/src/axis/resolve.ts`) is the single source of
x-coordinates. Grid mode looks up a discrete, labelled column; frame mode scales
a continuous frame number by `frame_width` and has no columns. Nothing that
positions something horizontally needs to know which mode is active — there is
no second time model, and `frame_width` appears in exactly one place.

A diagram is in grid mode if it declares an axis with an `@` block, which the
parser detects across all blocks before parsing any of them, since the axis need
not come first. Marble rows are rejected there.

Done: **Phase 0** (golden harness; explicit `kind` dispatch, replacing
`isStream = !isOperator`), **Phase 1** (`@` parser, `ResolvedTimeAxis`, axis
header row, full-height dashed grid in a background layer, frame mode routed
through the axis), **Phase 2** (`SlotValue`, `GridStreamRowSpecification`
(`kind: 'R'`, `rowKind: 'stream'`), `gridRowParser` for the `>` sigil —
distinguished from an operator block by the pipe right after a single-token
label, ordered before `operatorParser` — and `renderGridStreamRow`
(`renderer/src/row/stream.ts`): a strike-through line the width of the axis
ending in an arrowhead, with each non-empty slot's value typeset on it), and
**Phase 3** (`GridCellRowSpecification` (`rowKind: 'cell'`) with `from`/`to`,
the `=` sigil, `foldRuns` (`renderer/src/row/runs.ts`) and `renderGridCellRow`
(`renderer/src/row/cell.ts`)) and **Phase 4** (reference slots,
`GridAnnotationRowSpecification` (`rowKind: 'annotation'`) and the `.` sigil,
`renderGridAnnotationRow` (`renderer/src/row/annotation.ts`)). All twenty
figures are now reachable.

Every grid row's slot count must equal the column count — `assertSlotsMatchAxis`
(`row/slots.ts`) is the one place that checks it. Style keys are `grid_row_*`
for stream rows, `grid_cell_*` for cell rows and `grid_annotation_*` for
annotation rows. `renderSlotValues` (`row/values.ts`) draws the centred
per-column values that stream and annotation rows share.

Cell geometry, all of it derived from the axis: the box is opaque, so the dashed
grid stops at its edges. It opens at `axis.gutterWidth - grid_row_lead` (exactly
where a stream row's line starts, so rows line up) and closes at
`contentWidth + grid_cell_overhang`, unless `from` / `to` name the columns whose
opening boundaries it starts and ends at. `foldRuns` derives the segmentation —
a non-empty slot opens a run, an empty one extends the run before it — giving a
solid divider at each run's opening boundary and one left-aligned value per run,
the first measured from the box's own edge rather than from column 0's boundary.
A box that opens late is reached by a plain lead-in line; every row ends with the
same arrow at `contentWidth + grid_row_tail` (`row/arrow.ts`, shared with stream
rows).

A `ref` slot renders exactly like the literal it was promoted from — that is
what the figures show, so Phase 4 added no styling for it. The distinction is
semantic, and it is the hook `@swirly/theme-sodium` needs in Phase 5 if
references should ever read differently from values.

Column *depth* needed nothing beyond Phase 1: the `>` prefix already sets it and
the grid already thins each boundary by `grid_line_depth_stroke_width_step`.
Measuring `e0fig11.jpg` shows the book draws every boundary identically and
distinguishes nesting only by the labels, so our depth-thinning is a small
addition rather than a match. What figure 11 does need and still lacks is
per-column widths — `ColumnSpecification.width` exists but no syntax sets it,
and content sizing is part of the deferred measurement work below.

Text measurement (the `measureText` hook, content/uniform column sizing) is
still deferred — columns stay a fixed `axis_column_width`, and the label gutter
a fixed `row_label_width`. Two knock-on differences from the book's figures, both
Phase 1 decisions left alone: it centres each axis label in its column where the
book left-aligns it just past the opening boundary, and it draws a closing
boundary after the last column where the book leaves the last one open.

Next is **Phase 5**: `@swirly/theme-sodium`, the `measureText` hook wired into
web and Node, and promoting the grid fixtures into `examples/` (and so into
`examples.md` and the web editor's example list).
