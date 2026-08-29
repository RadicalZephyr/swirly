import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseMarbleDiagramSpecification } from '@swirly/parser'
import { renderMarbleDiagram } from '@swirly/renderer-node'
import { darkStyles } from '@swirly/theme-default-dark'
import { lightStyles } from '@swirly/theme-default-light'
import { DiagramStyles } from '@swirly/types'

// This module is compiled to dist/lib, so the package root is two levels up.
const HERE = path.dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = path.resolve(HERE, '..', '..')

export const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..')
export const GOLDEN_DIR = path.join(PACKAGE_ROOT, 'golden')

export type SpecSource = {
  name: string
  dir: string
}

/**
 * `examples` is the user-facing gallery rendered into examples.md; `fixtures`
 * covers syntax that is still being built out and has no place in the gallery
 * yet. Both are held to the same golden renderings.
 */
export const SPEC_SOURCES: readonly SpecSource[] = [
  { name: 'examples', dir: path.join(REPO_ROOT, 'examples') },
  { name: 'fixtures', dir: path.join(PACKAGE_ROOT, 'fixtures') }
]

export type ThemeName = 'light' | 'dark'

export const THEMES: Record<ThemeName, DiagramStyles> = {
  light: lightStyles,
  dark: darkStyles
}

export const THEME_NAMES = Object.keys(THEMES) as ThemeName[]

export const listSpecs = async (source: SpecSource): Promise<string[]> => {
  const entries = await fs.readdir(source.dir)
  return entries
    .filter((entry) => entry.endsWith('.txt'))
    .map((entry) => path.basename(entry, '.txt'))
    .sort()
}

export const goldenDir = (source: SpecSource): string =>
  path.join(GOLDEN_DIR, source.name)

export const goldenPath = (
  source: SpecSource,
  name: string,
  theme: ThemeName
): string => path.join(goldenDir(source), `${name}.${theme}.svg`)

export const renderSpec = async (
  source: SpecSource,
  name: string,
  theme: ThemeName
): Promise<string> => {
  const specPath = path.join(source.dir, `${name}.txt`)
  const contents = await fs.readFile(specPath, 'utf8')
  const spec = parseMarbleDiagramSpecification(contents)
  const { xml } = renderMarbleDiagram(spec, { styles: THEMES[theme] })
  return xml
}
