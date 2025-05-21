import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'
import {
  validateFrontmatter,
  type ValidatedFrontMatter,
} from './content-validation'

const postsDirectory = join(process.cwd(), 'posts')

// Simple in-memory cache for build time
let allPostsData: Array<{
  slug: string
  meta: ValidatedFrontMatter
  content: string
}> | null = null

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

      // Validate frontmatter with Zod
      const validatedMeta = validateFrontmatter(data, `${realSlug}.mdx`)

      posts.push({
        slug: realSlug,
        meta: validatedMeta,
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
