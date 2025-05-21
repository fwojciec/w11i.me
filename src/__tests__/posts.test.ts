import { describe, it, expect } from 'vitest'
import { getAllPosts, getAllPostsMeta, getPostBySlug } from '../lib/posts'

describe('Posts', () => {
  describe('getAllPosts', () => {
    it('should load all posts successfully', async () => {
      const posts = await getAllPosts()

      expect(posts).toBeInstanceOf(Array)
      expect(posts.length).toBeGreaterThan(0)

      // Verify each post has required structure
      posts.forEach((post) => {
        expect(post).toHaveProperty('slug')
        expect(post).toHaveProperty('meta')
        expect(post).toHaveProperty('content')

        expect(typeof post.slug).toBe('string')
        expect(typeof post.content).toBe('string')
        expect(post.slug.length).toBeGreaterThan(0)

        // Verify meta has required fields (validated by Zod)
        expect(post.meta).toHaveProperty('title')
        expect(post.meta).toHaveProperty('date')
        expect(post.meta).toHaveProperty('author')
        expect(post.meta).toHaveProperty('excerpt')
        expect(post.meta).toHaveProperty('tags')

        expect(typeof post.meta.title).toBe('string')
        expect(typeof post.meta.date).toBe('string')
        expect(typeof post.meta.author).toBe('string')
        expect(typeof post.meta.excerpt).toBe('string')
        expect(Array.isArray(post.meta.tags)).toBe(true)
        expect(post.meta.tags.length).toBeGreaterThan(0)
      })
    })

    it('should have posts with valid dates', async () => {
      const posts = await getAllPosts()

      posts.forEach((post) => {
        const date = new Date(post.meta.date)
        expect(date.getTime()).not.toBeNaN()

        // Verify date format is YYYY-MM-DD
        expect(post.meta.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })

    it('should have posts with valid URLs when present', async () => {
      const posts = await getAllPosts()

      posts.forEach((post) => {
        if (post.meta.twitterProfile) {
          expect(() => new URL(post.meta.twitterProfile)).not.toThrow()
        }

        if (post.meta.coverImageCreditUrl) {
          expect(() => new URL(post.meta.coverImageCreditUrl)).not.toThrow()
        }
      })
    })
  })

  describe('getAllPostsMeta', () => {
    it('should return posts metadata only', async () => {
      const postsMeta = await getAllPostsMeta()

      expect(postsMeta).toBeInstanceOf(Array)
      expect(postsMeta.length).toBeGreaterThan(0)

      postsMeta.forEach((postMeta) => {
        expect(postMeta).toHaveProperty('slug')
        expect(postMeta).toHaveProperty('meta')
        expect(postMeta).not.toHaveProperty('content')
      })
    })

    it('should return same number of posts as getAllPosts', async () => {
      const [posts, postsMeta] = await Promise.all([
        getAllPosts(),
        getAllPostsMeta(),
      ])

      expect(posts.length).toBe(postsMeta.length)
    })
  })

  describe('getPostBySlug', () => {
    it('should return specific post by slug', async () => {
      const posts = await getAllPosts()
      const firstPost = posts[0]

      const post = await getPostBySlug(firstPost.slug)

      expect(post.slug).toBe(firstPost.slug)
      expect(post.meta.title).toBe(firstPost.meta.title)
      expect(post.content).toBe(firstPost.content)
    })

    it('should throw error for non-existent slug', async () => {
      await expect(getPostBySlug('non-existent-slug')).rejects.toThrow(
        'Post not found: non-existent-slug',
      )
    })
  })

  describe('Content expectations', () => {
    it('should have known blog posts', async () => {
      const posts = await getAllPosts()
      const slugs = posts.map((p) => p.slug)

      // Verify some expected posts exist
      const expectedSlugs = [
        'simple-i18n-in-next-js',
        'composition_using_protocols_in_python',
        'random-ticker-in-go',
      ]

      expectedSlugs.forEach((expectedSlug) => {
        expect(slugs).toContain(expectedSlug)
      })
    })

    it('should have posts with reasonable content length', async () => {
      const posts = await getAllPosts()

      posts.forEach((post) => {
        expect(post.content.length).toBeGreaterThan(100) // At least some content
        expect(post.meta.excerpt.length).toBeGreaterThan(10) // Meaningful excerpt
        expect(post.meta.title.length).toBeGreaterThan(5) // Meaningful title
      })
    })

    it('should have consistent author', async () => {
      const posts = await getAllPosts()

      // All posts should be by Filip (for this blog)
      posts.forEach((post) => {
        expect(post.meta.author).toBe('Filip Wojciechowski')
      })
    })
  })
})
