declare module 'remark-prism'

type Theme = 'dark' | 'light'

interface FrontMatter {
  title: string
  date: string
  author: string
  twitterProfile?: string
  excerpt: string
  coverImage?: string
  coverImageCreditText?: string
  coverImageCreditUrl?: string
  tags: string[]
}

interface Post {
  slug: string
  meta: FrontMatter
  content: string
}
