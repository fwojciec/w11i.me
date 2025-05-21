import { describe, it, expect } from 'vitest'
import {
  validateFrontmatter,
  isValidFrontMatter,
} from '../lib/content-validation'

describe('Content Validation', () => {
  describe('validateFrontmatter', () => {
    it('should validate correct frontmatter', () => {
      const validData = {
        title: 'Test Blog Post',
        date: '2024-01-15',
        author: 'Test Author',
        excerpt: 'This is a test excerpt for the blog post.',
        tags: ['test', 'blog'],
      }

      expect(() => validateFrontmatter(validData)).not.toThrow()

      const result = validateFrontmatter(validData)
      expect(result.title).toBe('Test Blog Post')
      expect(result.date).toBe('2024-01-15')
      expect(result.tags).toEqual(['test', 'blog'])
    })

    it('should validate frontmatter with optional fields', () => {
      const validData = {
        title: 'Advanced Blog Post',
        date: '2024-01-15',
        author: 'Test Author',
        excerpt: 'Advanced post with all optional fields.',
        tags: ['advanced', 'complete'],
        twitterProfile: 'https://twitter.com/testuser',
        coverImage: 'cover.jpg',
        coverImageCreditText: 'Photo by Test',
        coverImageCreditUrl: 'https://example.com/photo',
        hasInteractiveComponents: true,
        customComponents: ['CodePlayground', 'InteractiveChart'],
        difficulty: 'advanced' as const,
        readingTime: 10,
      }

      expect(() => validateFrontmatter(validData)).not.toThrow()

      const result = validateFrontmatter(validData)
      expect(result.hasInteractiveComponents).toBe(true)
      expect(result.difficulty).toBe('advanced')
      expect(result.readingTime).toBe(10)
    })

    it('should throw error for missing required fields', () => {
      const invalidData = {
        title: 'Test Post',
        // Missing: date, author, excerpt, tags
      }

      expect(() => validateFrontmatter(invalidData)).toThrow()

      try {
        validateFrontmatter(invalidData)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('date')
        expect((error as Error).message).toContain('author')
        expect((error as Error).message).toContain('excerpt')
        expect((error as Error).message).toContain('tags')
      }
    })

    it('should throw error for invalid date format', () => {
      const invalidData = {
        title: 'Test Post',
        date: '2024/01/15', // Wrong format
        author: 'Test Author',
        excerpt: 'Test excerpt',
        tags: ['test'],
      }

      expect(() => validateFrontmatter(invalidData)).toThrow()

      try {
        validateFrontmatter(invalidData)
      } catch (error) {
        expect((error as Error).message).toContain('YYYY-MM-DD')
      }
    })

    it('should throw error for invalid date', () => {
      const invalidData = {
        title: 'Test Post',
        date: '2024-13-45', // Invalid date
        author: 'Test Author',
        excerpt: 'Test excerpt',
        tags: ['test'],
      }

      expect(() => validateFrontmatter(invalidData)).toThrow()
    })

    it('should throw error for invalid URL fields', () => {
      const invalidData = {
        title: 'Test Post',
        date: '2024-01-15',
        author: 'Test Author',
        excerpt: 'Test excerpt',
        tags: ['test'],
        twitterProfile: 'not-a-url',
      }

      expect(() => validateFrontmatter(invalidData)).toThrow()

      try {
        validateFrontmatter(invalidData)
      } catch (error) {
        expect((error as Error).message).toContain('Must be a valid URL')
      }
    })

    it('should throw error for empty tags array', () => {
      const invalidData = {
        title: 'Test Post',
        date: '2024-01-15',
        author: 'Test Author',
        excerpt: 'Test excerpt',
        tags: [], // Empty array
      }

      expect(() => validateFrontmatter(invalidData)).toThrow()

      try {
        validateFrontmatter(invalidData)
      } catch (error) {
        expect((error as Error).message).toContain(
          'At least one tag is required',
        )
      }
    })

    it('should include filename in error message when provided', () => {
      const invalidData = { title: 'Test' }

      try {
        validateFrontmatter(invalidData, 'test-post.mdx')
      } catch (error) {
        expect((error as Error).message).toContain('test-post.mdx')
      }
    })

    it('should validate difficulty enum values', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced']

      validDifficulties.forEach((difficulty) => {
        const data = {
          title: 'Test Post',
          date: '2024-01-15',
          author: 'Test Author',
          excerpt: 'Test excerpt',
          tags: ['test'],
          difficulty,
        }

        expect(() => validateFrontmatter(data)).not.toThrow()
      })

      // Invalid difficulty
      const invalidData = {
        title: 'Test Post',
        date: '2024-01-15',
        author: 'Test Author',
        excerpt: 'Test excerpt',
        tags: ['test'],
        difficulty: 'expert', // Not in enum
      }

      expect(() => validateFrontmatter(invalidData)).toThrow()
    })
  })

  describe('isValidFrontMatter', () => {
    it('should return true for valid frontmatter', () => {
      const validData = {
        title: 'Test Post',
        date: '2024-01-15',
        author: 'Test Author',
        excerpt: 'Test excerpt',
        tags: ['test'],
      }

      expect(isValidFrontMatter(validData)).toBe(true)
    })

    it('should return false for invalid frontmatter', () => {
      const invalidData = {
        title: 'Test Post',
        // Missing required fields
      }

      expect(isValidFrontMatter(invalidData)).toBe(false)
    })
  })
})
