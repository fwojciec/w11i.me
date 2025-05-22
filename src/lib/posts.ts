import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'
import {
  validateFrontmatter,
  type ValidatedFrontMatter,
} from './content-validation'

// Enhanced frontmatter with guaranteed readingTime
export type EnhancedFrontMatter = ValidatedFrontMatter & {
  readingTime: number
}

/**
 * Calculate estimated reading time for content
 * @param content - The markdown/MDX content
 * @param wordsPerMinute - Average reading speed (default: 225 WPM)
 * @returns Reading time in minutes, rounded up to nearest minute
 */
export function calculateReadingTime(
  content: string,
  wordsPerMinute = 225,
): number {
  // Remove MDX/markdown syntax and count words
  const cleanContent = content
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`[^`]*`/g, '')
    // Remove links but keep text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // Remove image syntax
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '')
    // Remove headings markers but keep text
    .replace(/^#{1,6}\s+/gm, '')
    // Remove emphasis markers but keep text
    .replace(/[*_]{1,2}([^*_]*)[*_]{1,2}/g, '$1')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove frontmatter if any leaked through
    .replace(/^---[\s\S]*?---/g, '')
    .trim()

  // Count words (split on whitespace and filter empty strings)
  const words = cleanContent
    .split(/\s+/)
    .filter((word) => word.length > 0).length

  // Calculate reading time and round up to nearest minute
  const readingTimeMinutes = Math.ceil(words / wordsPerMinute)

  // Return at least 1 minute for very short content
  return Math.max(1, readingTimeMinutes)
}

const postsDirectory = join(process.cwd(), 'posts')

// Simple in-memory cache for build time
let allPostsData: Array<{
  slug: string
  meta: EnhancedFrontMatter
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

      // Calculate reading time if not provided in frontmatter
      const readingTime =
        validatedMeta.readingTime ?? calculateReadingTime(content)

      posts.push({
        slug: realSlug,
        meta: { ...validatedMeta, readingTime },
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
