import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

const postsDirectory = join(process.cwd(), 'posts')

// Simple in-memory cache for build time
let allPostsData: Array<{
  slug: string
  meta: FrontMatter
  content: string
}> | null = null

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

// Load all posts once and cache them
async function loadAllPostsData() {
  if (allPostsData !== null) {
    return allPostsData
  }

  const files = await fs.promises.readdir(postsDirectory)
  const slugs = files
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''))

  const posts = []
  for (const slug of slugs) {
    try {
      const realSlug = slug.replace(/\.mdx$/, '')
      const fullPath = join(postsDirectory, `${realSlug}.mdx`)
      const fileContents = await fs.promises.readFile(fullPath, 'utf8')
      const { data, content } = matter(fileContents)

      if (!isFrontMatter(data)) {
        console.error(`Invalid front matter: ${slug}`)
        continue
      }

      posts.push({
        slug: realSlug,
        meta: data,
        content,
      })
    } catch (error) {
      console.error(`Failed to process post: ${slug}`, error)
      // Continue processing other posts
    }
  }

  allPostsData = posts
  return posts
}

export async function getPostBySlug(slug: string) {
  const allPosts = await loadAllPostsData()
  const post = allPosts.find((p) => p.slug === slug)

  if (!post) {
    throw new Error(`Post not found: ${slug}`)
  }

  return post
}

export async function getAllPosts() {
  return await loadAllPostsData()
}

export async function getAllPostsMeta() {
  const allPosts = await loadAllPostsData()
  return allPosts.map(({ slug, meta }) => ({ slug, meta }))
}
