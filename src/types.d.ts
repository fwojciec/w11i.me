declare module 'remark-prism'

import type { ValidatedFrontMatter } from './lib/content-validation'

type Theme = 'dark' | 'light'

// Re-export the validated frontmatter type for backwards compatibility
type FrontMatter = ValidatedFrontMatter

interface Post {
  slug: string
  meta: ValidatedFrontMatter
  content: string
}
