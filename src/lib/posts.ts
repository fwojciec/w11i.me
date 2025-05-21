import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

const postsDirectory = join(process.cwd(), 'posts')

function isFrontMatter(arg: { [key: string]: any }): arg is FrontMatter {
  return (
    typeof arg.title === 'string' &&
    typeof arg.date === 'string' &&
    typeof arg.author === 'string' &&
    (typeof arg.twitterProfile == 'string' ||
      typeof arg.twitterProfile === 'undefined') &&
    typeof arg.excerpt === 'string' &&
    (typeof arg.coverImage == 'string' ||
      typeof arg.coverImage === 'undefined') &&
    (typeof arg.coverImageCreditText === 'string' ||
      typeof arg.coverImageCreditText === 'undefined') &&
    (typeof arg.coverImageCreditUrl === 'string' ||
      typeof arg.coverImageCreditUrl === 'undefined') &&
    Array.isArray(arg.tags)
  )
}

export async function getPostBySlug(slug: string) {
  const realSlug = slug.replace(/\.mdx$/, '')
  const fullPath = join(postsDirectory, `${realSlug}.mdx`)
  const fileContents = await fs.promises.readFile(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  if (!isFrontMatter(data)) {
    throw Error(`invalid front matter: ${slug}`)
  }

  return {
    slug: realSlug,
    meta: data,
    content,
  }
}

export async function getAllPosts() {
  const files = await fs.promises.readdir(postsDirectory)
  const slugs = files
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''))

  return Promise.all(slugs.map((slug) => getPostBySlug(slug)))
}
