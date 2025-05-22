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

interface CustomFileReader {
  readdir: (path: string) => Promise<string[]>
  readFile: (path: string, encoding: string) => Promise<string>
}

// Load all posts once and cache them
async function loadAllPostsData(
  customPostsDirectory?: string,
  customFileReader?: CustomFileReader,
) {
  // Reset cache if custom arguments are provided, allowing tests to get a fresh state
  if (customPostsDirectory || customFileReader) {
    allPostsData = null
  }

  if (allPostsData !== null) {
    return allPostsData
  }

  const currentPostsDirectory = customPostsDirectory || postsDirectory
  const reader = customFileReader || fs.promises

  const files = await reader.readdir(currentPostsDirectory)
  const slugs = files
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''))

  const posts = []
  for (const slug of slugs) {
    try {
      const realSlug = slug.replace(/\.mdx$/, '')
      const fullPath = join(currentPostsDirectory, `${realSlug}.mdx`)
      const fileContents = await reader.readFile(fullPath, 'utf8')
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
