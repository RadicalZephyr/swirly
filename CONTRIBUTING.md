# Contributing to Swirly

This guide covers working on Swirly itself. If you only want to *use* Swirly,
the [README](README.md) and the [examples](examples.md) are what you want.

## Prerequisites

- **Node.js.** The version in [`.nvmrc`](.nvmrc) (16.19.1) is the baseline; CI
  builds and tests on 16.19.1 and 18.14.1. Newer releases work too — the repo
  builds and tests clean on Node 22 — but only 16 and 18 are covered by CI.
  With [nvm](https://github.com/nvm-sh/nvm): `nvm use`.
- **Yarn 1 (classic).** The repo is a Yarn 1 workspace and the lockfile is
  Yarn 1's. Yarn Berry and npm will not read it correctly.
- **Chromium**, pulled in automatically by Puppeteer during install. It is only
  needed to rasterize the example PNGs; see
  [Building without Chromium](#building-without-chromium) if you do not have it.

```bash
git clone https://github.com/timdp/swirly.git
cd swirly
nvm use          # optional
yarn             # installs and links every workspace
yarn build
yarn test
```

## Repository layout

Swirly is a monorepo of `@swirly/*` packages under `packages/`, orchestrated by
[Turborepo](https://turbo.build/). The pipeline is:

**spec text → `@swirly/parser` → `DiagramSpecification` → `@swirly/renderer` →
SVG DOM → serialized XML → rasterizer → PNG**

The packages you are most likely to touch:

| Package | What it does |
| --- | --- |
| `@swirly/parser` | Turns spec text into a `DiagramSpecification` |
| `@swirly/renderer` | Turns a specification into an SVG DOM; platform-agnostic |
| `@swirly/renderer-node` | Node wrapper: injects `@xmldom/xmldom`, serializes to XML |
| `@swirly/types` | Every shared type, including `DiagramStyles` |
| `@swirly/theme-default-{base,light,dark}`, `@swirly/theme-sodium` | Style defaults |
| `@swirly/web` | The [swirly.dev](https://swirly.dev) editor |
| `@swirly/tests` | Golden-file and unit tests |
| `swirly` | The CLI |

[CLAUDE.md](CLAUDE.md) documents the architecture in more depth — parser
dispatch order, the renderer's passes, and how grid mode works.

## Everyday commands

Run these from the repository root.

```bash
yarn build                # build every package (Turborepo, cached)
yarn test                 # what CI runs: lint + golden tests
yarn test:golden          # golden tests only
yarn test:golden:update   # rewrite the golden SVGs after an intentional change
yarn lint                 # eslint + polydepcheck
yarn format               # prettier-eslint --write across the repo
yarn clean                # remove every dist/ (and the built examples)
```

Turborepo caches aggressively — a no-op `yarn build` finishes in under a second
and prints `FULL TURBO`. To rebuild something anyway:

```bash
npx turbo run build --force
npx turbo run build --filter=@swirly/renderer --force
```

To build one package and its dependencies:

```bash
yarn workspace @swirly/web run build
```

## Running the web app locally

There is no dev server and no watch mode: the editor is a static bundle that you
build and then open.

```bash
yarn build
```

That leaves a self-contained site in `packages/swirly-web/dist/`. Open it
directly — no server required:

```bash
xdg-open packages/swirly-web/dist/index.html   # macOS: open
```

If your browser restricts `file://` pages (some do for local storage), serve the
directory over HTTP instead. Any static server works; neither of these needs
anything installed in the repo:

```bash
python3 -m http.server 8080 --directory packages/swirly-web/dist
# or
npx serve packages/swirly-web/dist
```

Two useful details:

- **`dist/debug.html`** loads the unminified bundle with inline source maps.
  `dist/index.html` loads the minified one. Both are built every time.
- **`#code=<url-encoded spec>`** in the URL loads a specification on page load.
  This is how the Examples menu opens a diagram, and it is a quick way to check
  a spec file in the editor:

  ```bash
  node -e 'const fs=require("fs");console.log("#code="+encodeURIComponent(fs.readFileSync(process.argv[1],"utf8")))' examples/gridHold.txt
  ```

### Rebuild after every change

**The editor bundles the *built* `@swirly/*` packages, not their sources.** If
you change the renderer or the parser, `yarn workspace @swirly/web run build`
alone will silently bundle the stale `dist/` of that package. Run `yarn build`
from the root instead — Turborepo rebuilds the changed package first, then the
bundle. `yarn workspace @swirly/web run build` is only a shortcut for when your
edit was confined to `packages/swirly-web/src/`.

The editor also remembers your last specification and theme in `localStorage`.
Clear the site's data if you want it to start from the default again.

## Running the CLI locally

The built CLI runs straight from `dist/`, no install needed:

```bash
node packages/swirly/dist/cli.js examples/gridCell.txt out.svg
node packages/swirly/dist/cli.js --theme sodium examples/gridCell.txt out.svg
node packages/swirly/dist/cli.js --help
```

Pass `-` as the output to write the SVG to stdout. PNG output needs Chromium,
since it goes through the rasterizer.

## Tests

`yarn test` runs the linter and then the test suites in `@swirly/tests`. Tests
execute from compiled `dist/`, so **a stale build means stale results**;
`yarn test:golden` handles the build for you, but if you run a test file
directly, `yarn build` first.

There are four suites, all entered through `dist/all.js`:

- **`golden.ts`** renders every spec in `examples/` and
  `packages/swirly-tests/fixtures/` in all three themes and compares the
  serialized SVG byte-for-byte against `packages/swirly-tests/golden/`.
- **`parsing.ts`** covers parser behaviour with no rendering of its own, such as
  the errors raised for malformed input.
- **`rendering.ts`** covers errors the renderer raises for specs the parser
  accepts — a row whose slot count disagrees with the axis, say.
- **`measurement.ts`** covers text measurement and column sizing, driven through
  a stub measurer so expected widths follow from the source.

Run a single golden test by name:

```bash
node --test-name-pattern="gridCell" packages/swirly-tests/dist/golden.js
```

### When a golden test fails

A failure writes `<golden>.actual` next to the golden file and prints both
paths, so you can diff them. If the change is intentional:

```bash
yarn test:golden:update   # rewrites every golden
git diff                  # then review what moved, and why
```

Review that diff properly. It is the only thing standing between a deliberate
layout change and an accidental one — the renderer's output is pixels, and the
goldens are the whole safety net.

## Making a change

### Adding a diagram example

Drop a `.txt` spec into `examples/`, then `yarn build`. That renders
`examples/<name>.{svg,png}`, regenerates `examples.md`, and — because the golden
suite walks the directory — creates golden tests for it on the next
`yarn test:golden:update`. Examples are the user-facing gallery, so give the
spec explanatory `%` comments; they are shown verbatim in `examples.md`.

To make an example appear in the web editor's Examples menu, add it to
`packages/swirly-web/src/lib/examples.ts` as well.

For syntax that needs regression coverage but does not belong in the gallery,
add the spec to `packages/swirly-tests/fixtures/` instead. Same golden
treatment, no gallery slot.

### Adding a style key

A style key lives in three places: the `DiagramStyles` type in
`packages/swirly-types/src/styles.ts`, a default in
`@swirly/theme-default-base`, and — if it is a colour — a value in each of
`-light`, `-dark` and `@swirly/theme-sodium`. Renderers read them through
`mergeStyles(styles, localStyles, 'prefix_')`, which strips the prefix; a key
named `grid_cell_height` is read as `s.height` under the prefix `grid_cell_`.

### Importing across packages

TypeScript project references are generated, not hand-written.
`scripts/build-tsconfig.js` populates each `tsconfig.json`'s `references` from
that package's `@swirly/*` dependencies, and it runs as part of the build. So
when you add an import from another workspace package:

1. Add it to that package's `package.json` — `dependencies` if the import
   survives compilation, `devDependencies` if you only import types.
2. Run `yarn` to link it, then `yarn build`.

`yarn lint` runs `polydepcheck`, which fails on an imported-but-undeclared
package and on a declared-but-unused one. Both are easy to trip over; the error
names the package and the workspace.

### Adding a package

Create `packages/swirly-<name>/` with a `package.json` (copy a small existing
one, such as a theme package, and edit the name, description and `repository.directory`),
a `tsconfig.json`, `src/index.ts`, a `README.md` and a `LICENSE`. Then `yarn` to
link the new workspace, and `yarn build`. The `tsconfig.json` `references` are
filled in for you. Workspaces are globbed as `packages/*`, so nothing needs
registering by hand.

### Building without Chromium

`yarn build` ends by rasterizing the example PNGs, which starts a local
rasterization server on port 13484 and drives Chromium through Puppeteer. If
Chromium is unavailable, that step fails and takes the build down with it. Build
everything else instead:

```bash
npx turbo run build --filter='!@swirly/examples'
```

The golden tests do not rasterize anything, so `yarn test:golden` is unaffected.

## Code style

Standard style, enforced by ESLint with the TypeScript plugin; `yarn format`
runs `prettier-eslint` over the repo. Imports are sorted by
`eslint-plugin-simple-import-sort` — let the tooling do it rather than ordering
them by hand.

Source is ESM: `"type": "module"`, and relative imports carry a **`.js`
extension even in `.ts` files** (`import { foo } from './foo.js'`). TypeScript
is in `strict` mode.

A Husky pre-commit hook runs `lint-staged`, then `yarn lint`, then `yarn build`.
It is thorough and therefore slow — expect to wait.

## Grid mode

Grid mode renders transaction-aligned diagrams — a discrete labelled time axis
shared by stream, cell and annotation rows — for the Sodium FRP figures in
`sodium-diagrams/`. It is a second diagram species layered onto the same
renderer, and it has a design document:
[`docs/grid-mode-plan.md`](docs/grid-mode-plan.md). Read it before changing the
renderer's layout or the parser's dispatch list; the "Grid mode" section of
[CLAUDE.md](CLAUDE.md) records what was actually built and where it diverges
from the plan.

All twenty figures are recreated as grid specifications in
[`docs/sodium-figures.md`](docs/sodium-figures.md), each shown beside the scan it
was transcribed from. That page is the acceptance test for grid mode: if a
figure there cannot be expressed, grid mode is missing something. Rebuild it
after a renderer change with:

```bash
node scripts/build-sodium-figures.js
```
