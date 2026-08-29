# @swirly/tests

Golden-file tests for Swirly.

Every specification in two directories is parsed and rendered to SVG under both
the light and dark themes, then compared byte-for-byte against a committed
rendering in `golden/`:

- `examples/` at the repository root — the user-facing gallery rendered into
  `examples.md`.
- `fixtures/` in this package — syntax that is still being built out and has no
  place in the gallery yet.

Swirly's only real output is pixels, so these snapshots exist to make layout
refactors safe: any change to geometry, styling or serialization shows up as a
failing test rather than as a diagram that quietly looks wrong.

Alongside the snapshots, `src/parsing.ts` asserts on parser behaviour that has
no rendering of its own, such as the errors raised for malformed input.

The renderings come straight from `@swirly/renderer-node`, deliberately without
the SVGO pass the CLI applies. That keeps the assertion sensitive to renderer
changes and insensitive to SVGO version bumps.

## Running

```bash
yarn run test:golden          # from the repository root
```

## Updating

When a rendering change is intentional, regenerate the snapshots and review the
resulting diff as part of the change:

```bash
yarn run test:golden:update   # from the repository root
```

A failing run also writes the rendering it produced next to the golden file as
`<name>.<theme>.svg.actual`, which is useful for inspecting the difference in a
viewer. Those files are gitignored and are cleaned up on the next update.
