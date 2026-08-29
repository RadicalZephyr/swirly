# Grid mode: transaction-aligned marble & timeline diagrams

An extension plan for rendering the Sodium FRP figures in `sodium-diagrams/`
(`e0fig01`–`e0fig20`) with Swirly.

The twenty figures are not marble diagrams with extra furniture. They are a
different diagram species that happens to contain a marble diagram: rows sharing
one discrete, labelled transaction axis, mixing event streams with held-value
cells. Swirly can render them — but only after time stops being a per-row
continuous offset and becomes a diagram-level object.

Drafted against Swirly at `103f0a0`, monorepo version 0.21.0.

---

## 1. What the figures actually are

Every figure is a table keyed by transaction. Columns are labelled intervals,
not instants; rows are typed; and one dashed grid runs behind all of them.

```
        ╎  0  ╎  1  ╎  2  ╎  3  ╎  4  ╎  5     <- (1) labelled columns, (2) `t` header row
        ╎     ╎     ╎     ╎     ╎     ╎
 s1 ────╎─────╎─'b'─╎─────╎─'c'─╎─────╎────>   <- (3) value as bare text; line runs through it
        ╎     ╎     ╎     ╎     ╎     ╎
 c  ──┌─╎─────╎─────┬─────╎─────┬─────╎─┐──>   <- (4) cell box, (5) divider at each change,
      │ ╎ 'a' ╎     │ 'b' ╎     │ 'c' ╎ │         (6) box closes, line continues
      └─╎─────╎─────┴─────╎─────┴─────╎─┘
        ╎     ╎     ╎     ╎     ╎     ╎
 a1     ╎     ╎ 'a' ╎     ╎     ╎     ╎        <- (7) annotation row: no line at all
        ╎     ╎     ╎     ╎     ╎     ╎
        ^ (8) narrow italic label gutter, sized to contents
```

Dashed boundaries span every row and bleed past the first and last.

### Feature inventory

| Required feature | Figures | Swirly today |
| --- | --- | --- |
| Labelled transaction columns with a `t` header row | all | — implicit numeric frames, no header row |
| Dashed grid lines spanning the whole diagram, bleeding past the rows | all | Partial: `barrier` decoration, clipped to one stream's bbox |
| Nested transaction labels `[0]`, `[0,0]`, with two line weights | 11 | — |
| Value as bare text on the line — no marble, no knockout | 02–05, 08–11, 20 | — always an `ellipse` plus a centred label |
| Multi-token values: `return 'a'`, `['a','b']`, `(0+)` | 07, 11, 15 | Only via `x := …`; marble names are single characters |
| Cell row: a box holding a value across an interval | 03, 06, 08–10, 12–20 | — `range` is a flat bar with no text or segments |
| Box subdivided by solid dividers at change instants | 08–10, 13–20 | — |
| Box opens before column 0 (initial value), closes early or late | 08, 20 | — |
| Cell holding a stream or cell *reference* — `switch` | 06, 16–19 | Nested streams exist, but render as a marble line, not a name |
| Annotation row: label and values, no line | 20 | — |
| Streams that never complete — arrowhead only | all | Supported, but `\|` / `#` remain in the grammar |
| Italic row labels in a gutter sized to content | all | Fixed `stream_title_width: 100`, upright, left-aligned |
| Column widths varying within one diagram | 11, 15 | — uniform `frame_width` |

---

## 2. Where the current model breaks

Six load-bearing assumptions. G1–G3 are modelling gaps; G4–G6 are mechanical
obstacles that would block the fix even once the model is right.

### G1 — Time is continuous and per-row, not a shared discrete axis

Each `StreamSpecification` carries its own `frame` offset and `duration`;
`x = frame × frame_width` is computed independently in every renderer. No object
represents "column 3", so nothing can align rows to shared boundaries, label
those boundaries, or size them to their contents.

### G2 — Events are marbles, not typeset slot values

`packages/swirly-renderer/src/message/scalar.ts` unconditionally emits an
`<ellipse>` sized by `event_radius` with a centred label inside it. The value's
own width is never a layout input — which is exactly what column sizing needs it
to be.

### G3 — There is no held-value primitive

The nearest thing, the `range` decoration, is a filled bar with a height and no
text, no segments, no dividers, no lead-in or tail. `renderOperator` draws a
bordered rect with a title, but it is a full-width band, not a box with timed
endpoints. A cell is genuinely new geometry.

### G4 — Nothing can span the diagram vertically

`renderBarrierDecoration` derives its height from its own stream's bbox. The one
mechanism for diagram-wide geometry is
`UpdatableRendererResult.update({ width, height, dx })`, and today only
`renderOperator` uses it, for width alone. There is no layer concept: in
`index.ts`, every rendered item advances the `y` cursor, so a background grid
would push the rows down.

### G5 — There is no text measurement, and cannot easily be

The Node path parses into `@xmldom/xmldom` — an XML DOM with no layout engine,
so `getComputedTextLength` and `getBBox` do not exist. Swirly sidesteps this
everywhere today: fixed radii, a fixed title width, and `foreignObject` plus
flexbox for rich operator titles, deferring measurement to whatever finally
renders the SVG. Content-sized columns have no such escape.

### G6 — Content dispatch is a negation, not a discriminant

In `packages/swirly-renderer/src/index.ts`:
`isStream = (item) => !isOperator(item)`. Any third content kind is silently
misclassified as a stream and rendered as garbage rather than rejected. This has
to be fixed before anything else lands.

```diff
- const isStream = (item) => !isOperator(item)
+ const renderers = { S: renderStream, O: renderOperator, T: renderAxisHeader, R: renderGridRow }
+ const render = renderers[item.kind] ?? unknownKind(item)
```

---

## 3. The model to build

One structural decision carries most of the plan: make the time axis the single
source of every x-coordinate, and re-express the existing frame model as a
special case of it.

> **The unifying move.** Rather than bolting a second time model beside
> `frame_width`, introduce `ResolvedTimeAxis` as the only thing that converts
> time to pixels, and define classic frame mode as *a uniform, unlabelled axis
> whose column width is `frame_width`*. `scaleTime`, `barrier`, `range` and
> `higher_order_angle` all keep working against it, existing diagrams render
> byte-identically, and the codebase never carries two competing notions of when
> something happens.

### D1 — A time axis, specified and resolved

```ts
// packages/swirly-types/src/axis.ts
export type ColumnSpecification = {
  label: string
  depth?: number     // nesting level -> grid-line weight (fig 11)
  width?: number     // explicit px override
}

export type TimeAxisSpecification = {
  kind: 'T'
  title: string | null          // 't'
  columns: ColumnSpecification[]
  styles?: TimeAxisStyles
}

// packages/swirly-renderer/src/axis/resolve.ts
export type ResolvedTimeAxis = {
  columns: { label: string, depth: number, x: number, width: number }[]
  boundaries: { x: number, depth: number }[]
  gutterWidth: number
  contentWidth: number
  indexOf: (label: string) => number
  start: (i: number) => number
  center: (i: number) => number
  end: (i: number) => number
}
```

`ResolvedTimeAxis` lives on `RendererContext` and answers every geometry
question the row renderers have.

### D2 — Grid rows: one shape, three behaviours

Streams, cells and annotations differ in how they draw, not in how they are
addressed. All three are a label plus one slot per column. Cell segmentation is
*derived* — fold the slots into runs, where a non-empty slot opens a run and an
empty one extends it.

```ts
// packages/swirly-types/src/grid-row.ts
export type SlotValue =
  | { kind: 'empty' }
  | { kind: 'text', value: string }
  | { kind: 'ref',  value: string }   // 's1', 'c2' — a row name

type BaseGridRow = {
  kind: 'R'
  title: string | null
  slots: SlotValue[]
}

export type GridStreamRowSpecification = BaseGridRow & {
  rowKind: 'stream'
  styles?: GridStreamRowStyles
}

export type GridCellRowSpecification = BaseGridRow & {
  rowKind: 'cell'
  from?: string | null   // column label where the box opens; default: before column 0
  to?: string | null     // column label where it closes;   default: after the last column
  styles?: GridCellRowStyles
}

export type GridAnnotationRowSpecification = BaseGridRow & {
  rowKind: 'annotation'
  styles?: GridAnnotationRowStyles
}
```

### D3 — Row renderers

Four new modules under `packages/swirly-renderer/src/`, plus a shared gutter
label. Each is small; the geometry all comes from the axis.

- `axis/header.ts` — the `t` row: gutter label plus one centred `<text>` per
  column.
- `axis/grid.ts` — the dashed boundaries. Returns an `UpdatableRendererResult`
  whose `update({ height })` sets `y1 = -bleed` and `y2 = height + bleed`.
  Stroke weight and colour are selected per boundary `depth`.
- `row/stream.ts` — `renderArrow` across `axis.contentWidth`, then one `<text>`
  per non-empty slot at `axis.center(i)`, appended *after* the arrow so the line
  reads as passing behind it. `grid_event_shape: circle` restores marbles for
  authors who want them.
- `row/cell.ts` — lead-in line, `<rect>`, a divider per run boundary, one
  left-aligned `<text>` per run, then a tail arrow from the box's right edge to
  the axis end. Figure 20's early close is the same code path with `to` set.
- `row/annotation.ts` — labels and centred texts, no arrow.
- `row/label.ts` — gutter label, right-aligned at
  `gutterWidth - row_label_gap`, italic by default.

### D4 — Two passes and a background layer in `index.ts`

The current render is a single pass down a `y` cursor. Grid mode needs a measure
pass before it and a layer beneath it. Steps 2–4 and 6 are new; step 5 is
untouched.

1. **Merge styles** — theme, options, spec. Unchanged.
2. **Classify** content by `kind`; extract the `TimeAxisSpecification`, or
   synthesize a uniform one. *(new)*
3. **Measure and resolve** — estimate every slot and header width, settle column
   widths and the label gutter, build `ResolvedTimeAxis`. *(new)*
4. **Background layer** — render the grid into a `<g>` inserted before the row
   children, outside the `y` cursor. *(new)*
5. **Flow layer** — rows, streams and operators down the `y` cursor, unioning
   bboxes. Unchanged.
6. **Post-pass** — `update({ width, height, dx })`, now consumed by the grid for
   its height as well as by operators for their width. *(extended)*

`streamTitleEnabled` generalises to "the gutter is non-empty", computed across
all row kinds rather than streams alone.

### D5 — Text measurement: a hook, with an honest default

G5 is the one gap with no clean answer, so give it three. Add an optional hook to
`RendererOptions`:

```ts
measureText?: (text: string, font: {
  family: string, size: number, weight: string | number, style: string
}) => number
```

- **Web** — a 2d canvas `measureText`. Exact.
- **Node** — `util/text-metrics.ts`, average advance ratios per character class
  scaled by font size, calibrated against Arial. Roughly ±8%, which column
  padding absorbs.
- **Author** — `axis_column_sizing` of `uniform` (default), `content`, or
  `fixed`, plus a per-column `width` override.

Default to `uniform`: the widest measured content sets one width for every
column. It matches most of the figures and is the most forgiving of estimator
error — a bad estimate makes every column equally too wide, not one column
visibly wrong.

### D6 — Style keys and a Sodium theme

New keys on `DiagramStyles`, defaults in `@swirly/theme-default-base`, colours in
the light and dark themes. Then a fourth theme package matching the book's line
art: black on white, no fills, italic labels, `grid_event_shape: none`.

```
axis_column_width, column_min_width, column_padding, column_sizing,
     header_height, label_color, label_font_{family,size,style,weight}

grid_line_color, line_stroke_width, line_dash_width, line_bleed,
     line_depth_stroke_width_step, line_depth_color,
     row_height, row_spacing, event_shape, event_value_*

cell_height, fill_color, stroke_color, stroke_width, divider_stroke_width,
     lead_inset, tail_gap, value_padding, value_align, value_*

row_label_width, gap, align, color, font_*
annotation_row_height
```

### D7 — Syntax

A sigil, a label, then pipe-delimited slots — one per column, so the source
lines up with the rendered figure. Config lines follow inside the block exactly
as they do today.

```
% figure 8
@  t  | 0   | 1   | 2   | 3   | 4   | 5

=  c  | 'a' |     | 'b' |     | 'c' |
to = 5

>  s1 |     | 'b' |     | 'c' |     |
```

`@` axis, `>` stream, `=` cell, `.` annotation. A blank slot means no event on a
stream and *hold the previous value* in a cell. Nested columns take a `>` prefix
per depth level; a slot naming another row resolves to a reference rather than a
literal.

```
% figure 11 — split transactions
@  t  | [0] | >[0,0] | >[0,1] | [1] | >[1,0]

% figure 6 — a cell holding streams
=  c  | s1  |     | s2  |     |

% figure 20 — annotation rows carry no line
.  a1 |     | 'a' |     |     |
.  a2 |     |     | 'b' |     |
```

`>` is also the operator sigil, so the two are separated by shape: a grid row is
a sigil, a label, and then a pipe. An operator title has no pipe before its
first word. `gridRowParser` therefore matches on the lookahead and is ordered
*before* `operatorParser`, which keeps its existing catch-all `startsWith('>')`.
Operators remain usable inside grid diagrams, which is what the risk table below
asks for.

New parsers slot into `packages/swirly-parser/src/parsers/index.ts` *before*
`streamParser`, which matches everything as a fallback:

```diff
  export const parsers = [
    diagramStylesParser,
    messageStylesParser,
+   timeAxisParser,   // /^@\s/
+   gridRowParser,    // /^[>=.]\s+[^|]+\|/
    operatorParser,
    streamParser
  ]
```

`>` carries two meanings, but in disjoint contexts: at the start of a block it
marks a stream row, and inside an `@` block it prefixes a column label to
increase its nesting depth. Nothing parses both at once.

### D8 — Downstream surfaces

- **YAML** — `readDiagramSpec` casts parsed YAML straight to
  `DiagramSpecification`, so the new types are authorable in YAML for free.
  There is no validation today; a malformed spec crashes inside the renderer.
  Worth adding a guard alongside the new kinds.
- **Web editor** — consumes `renderMarbleDiagram`, so it needs only the
  `measureText` hook and new entries in `lib/examples.ts`.
- **CLI and rasterizers** — untouched; they operate on serialized SVG.

---

## 4. Phasing

Each phase reproduces a strict superset of the source figures, so progress is
checkable against the JPEGs at every step rather than only at the end.

### Phase 0 — Safety net

`yarn test` currently runs ESLint and nothing else — there are no tests in the
repository. This is a layout-wide refactor of a renderer whose only output is
pixels, so build the net first: golden-SVG snapshots over the existing
`examples/*.txt`. Then fix the G6 dispatch.

**Proves:** the seven existing examples still render byte-identically.

### Phase 1 — Axis and grid

`TimeAxisSpecification`, `resolveTimeAxis`, the header row, full-height dashed
boundaries, the background layer in `index.ts`, the `@` parser. Re-express frame
mode as a uniform unlabelled axis and confirm the Phase 0 goldens are unmoved.

The shared label gutter (`row/label.ts`) lands here rather than in Phase 2: the
header row needs a gutter label for `t`, so it has a consumer from the start.

**Reproduces:** figure 1's axis and grid. Its `s` line needs a stream row, which
arrives in Phase 2 — this phase's checkpoint is a diagram whose only content is
an axis.

### Phase 2 — Stream rows

`SlotValue`, `row/stream.ts`, text-on-line rendering, the `>` parser.
Measurement lands here too, since column widths now depend on content.

**Reproduces:** figures 1, 2, 4, 5, 7.

### Phase 3 — Cell rows

`row/cell.ts`, run folding, dividers, lead-in and tail, `from` / `to`, the `=`
parser. The largest single piece of new geometry.

**Reproduces:** figures 3, 8–10, 12–15.

### Phase 4 — References, annotations, depth

Reference slots for `switch` diagrams, annotation rows, nested column depths and
their differentiated line weights.

**Reproduces:** figures 6, 11, 16–20 — completing all twenty.

### Phase 5 — Theme, docs, polish

`@swirly/theme-sodium`; the `measureText` hook wired into web and Node; the new
examples added to `examples/`, to `examples.md` via the existing build script,
and to the web editor's example list.

**Ships:** grid mode as a documented, discoverable feature.

---

## 5. Risks and open decisions

| Issue | Assessment |
| --- | --- |
| **Text measurement fidelity** | The largest unknown. Mitigated by defaulting to `uniform` sizing, offering explicit widths, and injecting an exact measurer where a real layout engine exists. Decide before Phase 2. |
| **Sigil ambiguity: `>`** | *Resolved.* An earlier draft used `-` for stream rows, colliding with marble lines like `--a--b--\|`, which offered no marker to separate them. `>` collides instead with operator blocks, and that collision has a marker: a grid row carries a pipe after its label. `gridRowParser` matches `/^[>=.]\s+[^\|]+\|/` and is ordered before `operatorParser`. Reinforced by mode detection: a diagram containing an `@` block is in grid mode, so a bare marble row is rejected with a clear message instead of silently misparsing. |
| **Two time models** | Resolved by design, not deferred: D1 folds frame mode into the axis. Worth re-validating at the end of Phase 1, because if the unification does not hold, every later phase inherits a fork. |
| **Cells under `higher_order_angle`** | Skewed higher-order streams and axis-aligned boxes have no sensible composition. Reject with an error rather than rendering something wrong. Out of scope. |
| **Completion and error in grid mode** | Sodium streams never complete or error, so `\|` and `#` have no meaning in a slot. Reject rather than silently rendering a completion bar. |
| **Mixing operators into grid diagrams** | No figure does it, but nothing prevents it: operator bands already stretch to the full diagram width and would sit correctly between grid rows. Allow it; do not design around it. |
