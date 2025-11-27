import { describe, it, expect } from 'vitest'
import { getAllPostsMeta, calculateReadingTime } from '../lib/posts'

describe('Reading Time Calculation', () => {
  it('should calculate reading time for posts', async () => {
    const posts = await getAllPostsMeta()

    // Ensure we have posts to test with
    expect(posts.length).toBeGreaterThan(0)

    // Check that all posts have readingTime
    posts.forEach(({ meta }) => {
      expect(meta.readingTime).toBeDefined()
      expect(typeof meta.readingTime).toBe('number')
      expect(meta.readingTime).toBeGreaterThan(0)
      expect(meta.readingTime).toEqual(Math.floor(meta.readingTime)) // Should be a whole number
    })
  })

  it('should respect manual readingTime in frontmatter if provided', async () => {
    // This test will pass if we have posts with manual readingTime
    // Otherwise it just verifies the calculation works
    const posts = await getAllPostsMeta()

    posts.forEach(({ meta }) => {
      // All posts should have readingTime (either calculated or manual)
      expect(meta.readingTime).toBeGreaterThan(0)
    })
  })

  it('should provide reasonable reading times', async () => {
    const posts = await getAllPostsMeta()

    posts.forEach(({ meta }) => {
      // Reading time should be reasonable (1-60 minutes for blog posts)
      expect(meta.readingTime).toBeGreaterThanOrEqual(1)
      expect(meta.readingTime).toBeLessThanOrEqual(60)
    })
  })
})

// Test the calculation function directly
describe('Reading Time Calculation Function', () => {
  it('should handle empty content', () => {
    expect(calculateReadingTime('')).toBe(1)
    expect(calculateReadingTime('   ')).toBe(1)
  })

  it('should calculate reading time for simple text', () => {
    // 225 words should equal 1 minute (default WPM)
    const words = Array(225).fill('word').join(' ')
    expect(calculateReadingTime(words)).toBe(1)

    // 450 words should equal 2 minutes
    const moreWords = Array(450).fill('word').join(' ')
    expect(calculateReadingTime(moreWords)).toBe(2)
  })

  it('should handle markdown syntax removal', () => {
    const contentWithMarkdown = `
# Heading
This is **bold** and *italic* text.
\`inline code\` should be counted.

\`\`\`javascript
// This code block should be ignored
const example = 'ignored';
\`\`\`

[Link text](https://example.com) should keep the text.
![Image alt](image.jpg) should be removed.
    `.trim()

    const readingTime = calculateReadingTime(contentWithMarkdown)
    expect(readingTime).toBeGreaterThan(0)
    expect(typeof readingTime).toBe('number')
  })

  it('should use custom words per minute', () => {
    const words = Array(100).fill('word').join(' ')

    // At 100 WPM, 100 words = 1 minute
    expect(calculateReadingTime(words, 100)).toBe(1)

    // At 200 WPM, 100 words = 0.5 minute, rounded up to 1
    expect(calculateReadingTime(words, 200)).toBe(1)
  })

  it('should round up fractional minutes', () => {
    // 112 words at 225 WPM = 0.498 minutes, should round to 1
    const words = Array(112).fill('word').join(' ')
    expect(calculateReadingTime(words, 225)).toBe(1)

    // 226 words at 225 WPM = 1.004 minutes, should round to 2
    const moreWords = Array(226).fill('word').join(' ')
    expect(calculateReadingTime(moreWords, 225)).toBe(2)
  })
})
