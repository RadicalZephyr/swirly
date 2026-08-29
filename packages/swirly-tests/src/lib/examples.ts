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
export const EXAMPLES_DIR = path.join(REPO_ROOT, 'examples')
export const GOLDEN_DIR = path.join(PACKAGE_ROOT, 'golden')

export type ThemeName = 'light' | 'dark'

export const THEMES: Record<ThemeName, DiagramStyles> = {
  light: lightStyles,
  dark: darkStyles
}

export const THEME_NAMES = Object.keys(THEMES) as ThemeName[]

export const listExamples = async (): Promise<string[]> => {
  const entries = await fs.readdir(EXAMPLES_DIR)
  return entries
    .filter((entry) => entry.endsWith('.txt'))
    .map((entry) => path.basename(entry, '.txt'))
    .sort()
}

export const goldenPath = (name: string, theme: ThemeName): string =>
  path.join(GOLDEN_DIR, `${name}.${theme}.svg`)

export const renderExample = async (
  name: string,
  theme: ThemeName
): Promise<string> => {
  const specPath = path.join(EXAMPLES_DIR, `${name}.txt`)
  const source = await fs.readFile(specPath, 'utf8')
  const spec = parseMarbleDiagramSpecification(source)
  const { xml } = renderMarbleDiagram(spec, { styles: THEMES[theme] })
  return xml
}
