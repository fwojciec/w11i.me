import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as postsLib from '../lib/posts' // Import namespace for spying
import { type CustomFileReader } from '../lib/posts'
import { validateFrontmatter as originalValidateFrontmatter } from '../lib/content-validation' // Import original for types
import matter from 'gray-matter' // Import to mock

// Mock dependencies
vi.mock('gray-matter')
vi.mock('../lib/content-validation', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('../lib/content-validation')
  >()
  return {
    ...actual,
    validateFrontmatter: vi.fn(),
  }
})

// Keep existing integration tests - they are valuable
describe('Posts (Integration Tests)', () => {
  describe('getAllPosts', () => {
    it('should load all posts successfully', async () => {
      const posts = await postsLib.getAllPosts()

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
      const posts = await postsLib.getAllPosts()

      posts.forEach((post) => {
        const date = new Date(post.meta.date)
        expect(date.getTime()).not.toBeNaN()

        // Verify date format is YYYY-MM-DD
        expect(post.meta.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })

    it('should have posts with valid URLs when present', async () => {
      const posts = await postsLib.getAllPosts()

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
      const postsMeta = await postsLib.getAllPostsMeta()

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
        postsLib.getAllPosts(),
        postsLib.getAllPostsMeta(),
      ])

      expect(posts.length).toBe(postsMeta.length)
    })
  })

  describe('getPostBySlug', () => {
    it('should return specific post by slug', async () => {
      const posts = await postsLib.getAllPosts()
      const firstPost = posts[0] // Assuming there's at least one post

      const post = await postsLib.getPostBySlug(firstPost.slug)

      expect(post.slug).toBe(firstPost.slug)
      expect(post.meta.title).toBe(firstPost.meta.title)
      expect(post.content).toBe(firstPost.content)
    })

    it('should throw error for non-existent slug', async () => {
      await expect(
        postsLib.getPostBySlug('non-existent-slug'),
      ).rejects.toThrow('Post not found: non-existent-slug')
    })
  })

  describe('Content expectations', () => {
    it('should have known blog posts', async () => {
      const posts = await postsLib.getAllPosts()
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
      const posts = await postsLib.getAllPosts()

      posts.forEach((post) => {
        expect(post.content.length).toBeGreaterThan(100) // At least some content
        expect(post.meta.excerpt.length).toBeGreaterThan(10) // Meaningful excerpt
        expect(post.meta.title.length).toBeGreaterThan(5) // Meaningful title
      })
    })

    it('should have consistent author', async () => {
      const posts = await postsLib.getAllPosts()

      // All posts should be by Filip (for this blog)
      posts.forEach((post) => {
        expect(post.meta.author).toBe('Filip Wojciechowski')
      })
    })
  })
})

// New Unit Tests
describe('Unit Tests for posts.ts', () => {
  // Explicitly type the mocked validateFrontmatter
  const mockedValidateFrontmatter = postsLib.validateFrontmatter as vi.MockedFunction<
    typeof originalValidateFrontmatter
  >
  const mockedMatter = matter as vi.MockedFunction<typeof matter>

  let consoleErrorSpy: vi.SpyInstance

  beforeEach(() => {
    vi.resetAllMocks() // Reset mocks for each test
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}) // Suppress console.error
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('loadAllPostsData', () => {
    const mockCustomPostsDir = '/test-posts'
    let mockFileReader: CustomFileReader

    beforeEach(() => {
      mockFileReader = {
        readdir: vi.fn(),
        readFile: vi.fn(),
      }
    })

    it('Scenario 1: Empty Directory - should return an empty array', async () => {
      vi.mocked(mockFileReader.readdir).mockResolvedValue([])
      const posts = await postsLib.loadAllPostsData(
        mockCustomPostsDir,
        mockFileReader,
      )
      expect(posts).toEqual([])
      expect(mockFileReader.readdir).toHaveBeenCalledWith(mockCustomPostsDir)
    })

    it('Scenario 2: Valid MDX Files - should return correctly structured post objects', async () => {
      const mockFiles = ['post1.mdx', 'post2.mdx']
      const mockFrontmatter1 = {
        title: 'Test Post 1',
        date: '2023-01-01',
        author: 'Test Author',
        excerpt: 'Test excerpt 1',
        tags: ['tag1', 'test'],
      }
      const mockFrontmatter2 = {
        title: 'Test Post 2',
        date: '2023-01-02',
        author: 'Test Author',
        excerpt: 'Test excerpt 2',
        tags: ['tag2', 'test'],
      }

      vi.mocked(mockFileReader.readdir).mockResolvedValue(mockFiles)
      vi.mocked(mockFileReader.readFile)
        .mockResolvedValueOnce('---markdown content 1---')
        .mockResolvedValueOnce('---markdown content 2---')

      mockedMatter
        .mockReturnValueOnce({
          data: mockFrontmatter1,
          content: 'Content for post 1',
        } as any)
        .mockReturnValueOnce({
          data: mockFrontmatter2,
          content: 'Content for post 2',
        } as any)

      mockedValidateFrontmatter
        .mockReturnValueOnce(mockFrontmatter1 as any)
        .mockReturnValueOnce(mockFrontmatter2 as any)

      const posts = await postsLib.loadAllPostsData(
        mockCustomPostsDir,
        mockFileReader,
      )

      expect(posts).toHaveLength(2)
      expect(posts[0]).toEqual({
        slug: 'post1',
        meta: mockFrontmatter1,
        content: 'Content for post 1',
      })
      expect(posts[1]).toEqual({
        slug: 'post2',
        meta: mockFrontmatter2,
        content: 'Content for post 2',
      })

      expect(mockFileReader.readdir).toHaveBeenCalledWith(mockCustomPostsDir)
      expect(mockFileReader.readFile).toHaveBeenCalledWith(
        `${mockCustomPostsDir}/post1.mdx`,
        'utf8',
      )
      expect(mockFileReader.readFile).toHaveBeenCalledWith(
        `${mockCustomPostsDir}/post2.mdx`,
        'utf8',
      )
      expect(mockedMatter).toHaveBeenCalledTimes(2)
      expect(mockedValidateFrontmatter).toHaveBeenCalledTimes(2)
      expect(mockedValidateFrontmatter).toHaveBeenCalledWith(
        mockFrontmatter1,
        'post1.mdx',
      )
      expect(mockedValidateFrontmatter).toHaveBeenCalledWith(
        mockFrontmatter2,
        'post2.mdx',
      )
    })

    it('Scenario 3: Error Handling (readFile error) - should call console.error and process other files', async () => {
      const mockFiles = ['post1.mdx', 'post2.mdx']
      const mockFrontmatter2 = {
        title: 'Test Post 2',
        date: '2023-01-02',
        author: 'Test Author',
        excerpt: 'Test excerpt 2',
        tags: ['tag2', 'test'],
      }

      vi.mocked(mockFileReader.readdir).mockResolvedValue(mockFiles)
      vi.mocked(mockFileReader.readFile)
        .mockRejectedValueOnce(new Error('Failed to read file'))
        .mockResolvedValueOnce('---markdown content 2---')

      mockedMatter.mockReturnValueOnce({
        data: mockFrontmatter2,
        content: 'Content for post 2',
      } as any)
      mockedValidateFrontmatter.mockReturnValueOnce(mockFrontmatter2 as any)

      const posts = await postsLib.loadAllPostsData(
        mockCustomPostsDir,
        mockFileReader,
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to process post: post1',
        expect.any(Error),
      )
      expect(posts).toHaveLength(1)
      expect(posts[0].slug).toBe('post2')
      expect(mockedValidateFrontmatter).toHaveBeenCalledWith(
        mockFrontmatter2,
        'post2.mdx',
      )
    })
    
    it('Scenario 3b: Error Handling (readFile error) - should return empty if it was the only file', async () => {
      vi.mocked(mockFileReader.readdir).mockResolvedValue(['post1.mdx']);
      vi.mocked(mockFileReader.readFile).mockRejectedValueOnce(new Error('Failed to read file'));

      const posts = await postsLib.loadAllPostsData(mockCustomPostsDir, mockFileReader);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to process post: post1',
        expect.any(Error)
      );
      expect(posts).toEqual([]);
    });


    it('Scenario 4: Error Handling (gray-matter error) - should call console.error', async () => {
      vi.mocked(mockFileReader.readdir).mockResolvedValue(['post1.mdx'])
      vi.mocked(mockFileReader.readFile).mockResolvedValue(
        '---invalid frontmatter---',
      )
      mockedMatter.mockImplementation(() => {
        throw new Error('Gray-matter parsing error')
      })

      const posts = await postsLib.loadAllPostsData(
        mockCustomPostsDir,
        mockFileReader,
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to process post: post1',
        expect.any(Error),
      )
      expect(posts).toEqual([])
      expect(mockedValidateFrontmatter).not.toHaveBeenCalled()
    })

    it('Scenario 5: Error Handling (validateFrontmatter error) - should call console.error', async () => {
      const mockFile = 'post1.mdx'
      const rawFrontmatter = { title: 'Needs validation' }
      vi.mocked(mockFileReader.readdir).mockResolvedValue([mockFile])
      vi.mocked(mockFileReader.readFile).mockResolvedValue('---content---')
      mockedMatter.mockReturnValue({
        data: rawFrontmatter,
        content: 'Some content',
      } as any)
      mockedValidateFrontmatter.mockImplementation(() => {
        throw new Error('Validation failed')
      })

      const posts = await postsLib.loadAllPostsData(
        mockCustomPostsDir,
        mockFileReader,
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to process post: post1',
        expect.any(Error),
      )
      expect(posts).toEqual([])
      expect(mockedValidateFrontmatter).toHaveBeenCalledWith(
        rawFrontmatter,
        `${mockFile}`,
      )
    })
  })

  describe('Higher-level functions (getPostBySlug, getAllPosts, getAllPostsMeta)', () => {
    let loadAllPostsDataSpy: vi.SpyInstance
    const mockPostsData = [
      {
        slug: 'post1',
        meta: {
          title: 'Post 1',
          date: '2023-01-01',
          author: 'Author',
          excerpt: 'Excerpt 1',
          tags: ['test'],
        },
        content: 'Content 1',
      },
      {
        slug: 'post2',
        meta: {
          title: 'Post 2',
          date: '2023-01-02',
          author: 'Author',
          excerpt: 'Excerpt 2',
          tags: ['test'],
        },
        content: 'Content 2',
      },
    ]

    beforeEach(() => {
      // Spy on the actual loadAllPostsData within the imported module
      loadAllPostsDataSpy = vi
        .spyOn(postsLib, 'loadAllPostsData')
        .mockResolvedValue(JSON.parse(JSON.stringify(mockPostsData))) // Deep copy to avoid test interference
    })

    afterEach(() => {
      loadAllPostsDataSpy.mockRestore()
    })

    describe('getPostBySlug', () => {
      it('should return the correct post for a valid slug', async () => {
        const post = await postsLib.getPostBySlug('post1')
        expect(post).toEqual(mockPostsData[0])
        expect(loadAllPostsDataSpy).toHaveBeenCalledTimes(1)
      })

      it('should throw an error for a non-existent slug', async () => {
        await expect(
          postsLib.getPostBySlug('non-existent-slug'),
        ).rejects.toThrow('Post not found: non-existent-slug')
        expect(loadAllPostsDataSpy).toHaveBeenCalledTimes(1)
      })
    })

    describe('getAllPosts', () => {
      it('should return all posts from loadAllPostsData', async () => {
        const posts = await postsLib.getAllPosts()
        expect(posts).toEqual(mockPostsData)
        expect(loadAllPostsDataSpy).toHaveBeenCalledTimes(1)
      })
    })

    describe('getAllPostsMeta', () => {
      it('should return only slug and meta for all posts', async () => {
        const postsMeta = await postsLib.getAllPostsMeta()
        expect(postsMeta).toEqual(
          mockPostsData.map(({ slug, meta }) => ({ slug, meta })),
        )
        expect(postsMeta[0]).not.toHaveProperty('content')
        expect(postsMeta[1]).not.toHaveProperty('content')
        expect(loadAllPostsDataSpy).toHaveBeenCalledTimes(1)
      })
    })
  })
})

[end of src/__tests__/posts.test.ts]
