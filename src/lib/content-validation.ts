import { z } from 'zod'

// Zod schema for blog post frontmatter
export const frontmatterSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().refine(
    (date) => {
      // Validate YYYY-MM-DD format and that it's a valid date
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(date)) return false
      const parsedDate = new Date(date)
      return !isNaN(parsedDate.getTime())
    },
    { message: 'Date must be in YYYY-MM-DD format and be a valid date' },
  ),
  author: z.string().min(1, 'Author is required'),
  excerpt: z.string().min(1, 'Excerpt is required'),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),

  // Optional fields
  twitterProfile: z.string().url('Must be a valid URL').optional(),
  coverImage: z.string().optional(),
  coverImageCreditText: z.string().optional(),
  coverImageCreditUrl: z.string().url('Must be a valid URL').optional(),

  // Future MDX enhancement fields
  hasInteractiveComponents: z.boolean().optional(),
  customComponents: z.array(z.string()).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  readingTime: z.number().positive().optional(), // minutes
})

export type ValidatedFrontMatter = z.infer<typeof frontmatterSchema>

// Validation function with detailed error reporting
export function validateFrontmatter(
  data: unknown,
  filename?: string,
): ValidatedFrontMatter {
  try {
    return frontmatterSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n')

      throw new Error(
        `Invalid frontmatter${filename ? ` in ${filename}` : ''}:\n${errorMessages}`,
      )
    }
    throw error
  }
}

// Type guard function
export function isValidFrontMatter(
  data: unknown,
): data is ValidatedFrontMatter {
  return frontmatterSchema.safeParse(data).success
}
