import fs from 'node:fs/promises'
import path from 'node:path'

import { parseMarbleDiagramSpecification } from '@swirly/parser'
import { DiagramContentItem, DiagramSpecification } from '@swirly/types'
import YAML from 'js-yaml'

import { YAML_EXTENSIONS } from './constants.js'

// YAML specifications predate the `kind` on every content item: a stream was
// whatever an operator (`kind: O`) was not, and hand-written files left it
// off. The renderer now dispatches on `kind` and rejects an item without one,
// so the historical default is supplied here rather than by loosening the
// renderer's contract.
const withContentKinds = (spec: DiagramSpecification): DiagramSpecification => ({
  ...spec,
  content: (spec.content ?? []).map((item) =>
    (item as { kind?: unknown }).kind == null
      ? ({ ...item, kind: 'S' } as DiagramContentItem)
      : item
  )
})

export const readDiagramSpec = async (
  inFilePath: string
): Promise<DiagramSpecification> => {
  const inFileContents: string = await fs.readFile(inFilePath, 'utf8')

  if (YAML_EXTENSIONS.includes(path.extname(inFilePath))) {
    return withContentKinds(YAML.load(inFileContents) as DiagramSpecification)
  }

  return parseMarbleDiagramSpecification(inFileContents)
}
