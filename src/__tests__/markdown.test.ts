import { describe, it, expect } from 'vitest'
import { processContent } from '../lib/markdown'

describe('processContent', () => {
  describe('1. Standard Markdown Conversion', () => {
    it('should convert headers correctly', async () => {
      const markdown = '# Header 1\n## Header 2'
      const html = await processContent(markdown)
      expect(html).toBe('<h1>Header 1</h1>\n<h2>Header 2</h2>\n')
    })

    it('should convert bold and italics correctly', async () => {
      const markdown = '**bold text** and *italic text*'
      const html = await processContent(markdown)
      expect(html).toBe(
        '<p><strong>bold text</strong> and <em>italic text</em></p>\n',
      )
    })

    it('should convert unordered lists correctly', async () => {
      const markdown = '- Item 1\n- Item 2'
      const html = await processContent(markdown)
      expect(html).toBe('<ul>\n<li>Item 1</li>\n<li>Item 2</li>\n</ul>\n')
    })

    it('should convert ordered lists correctly', async () => {
      const markdown = '1. First item\n2. Second item'
      const html = await processContent(markdown)
      expect(html).toBe(
        '<ol>\n<li>First item</li>\n<li>Second item</li>\n</ol>\n',
      )
    })

    it('should convert links correctly', async () => {
      const markdown = '[Google](https://google.com)'
      const html = await processContent(markdown)
      expect(html).toBe('<p><a href="https://google.com">Google</a></p>\n')
    })
  })

  describe('2. Callout Component Transformation', () => {
    const calloutTypes = ['info', 'warning', 'error'] as const

    calloutTypes.forEach((type) => {
      describe(`Callout type="${type}"`, () => {
        it('should transform with content', async () => {
          const mdx = `<Callout type="${type}">Some ${type} text</Callout>`
          const html = await processContent(mdx)
          expect(html).toBe(
            `<div class="callout callout-${type}">Some ${type} text</div>\n`,
          )
        })

        it('should transform self-closing callouts', async () => {
          const mdx = `<Callout type="${type}"/>`
          const html = await processContent(mdx)
          expect(html).toBe(`<div class="callout callout-${type}"></div>\n`)
        })

        it('should transform self-closing callouts with space', async () => {
          const mdx = `<Callout type="${type}" />`
          const html = await processContent(mdx)
          expect(html).toBe(`<div class="callout callout-${type}"></div>\n`)
        })

        it('should transform with extra attributes and content', async () => {
          const mdx = `<Callout type="${type}" otherProp="value" another="test">Custom ${type} text</Callout>`
          const html = await processContent(mdx)
          expect(html).toBe(
            `<div class="callout callout-${type}">Custom ${type} text</div>\n`,
          )
        })

        it('should transform self-closing with extra attributes', async () => {
          const mdx = `<Callout type="${type}" otherProp="value" />`
          const html = await processContent(mdx)
          expect(html).toBe(`<div class="callout callout-${type}"></div>\n`)
        })

        it('should transform callouts with multiline content', async () => {
          const mdx = `<Callout type="${type}">\nLine 1\nLine 2\n</Callout>`
          const expectedHtml = `<div class="callout callout-${type}">\nLine 1\nLine 2\n</div>\n`
          const html = await processContent(mdx)
          expect(html).toBe(expectedHtml)
        })
      })
    })
  })

  describe('3. No Custom Components', () => {
    it('should process standard Markdown without Callouts correctly', async () => {
      const markdown = 'Just some plain text.\n\nAnd a paragraph.'
      const html = await processContent(markdown)
      expect(html).toBe(
        '<p>Just some plain text.</p>\n<p>And a paragraph.</p>\n',
      )
    })
  })

  describe('4. Empty String Input', () => {
    it('should return an empty string or newline for empty input', async () => {
      const markdown = ''
      const html = await processContent(markdown)
      expect(html).toBe('') // remark returns empty string for empty input
    })

    it('should return a newline for whitespace input', async () => {
      const markdown = '   ' // Just spaces
      const html = await processContent(markdown)
      // remark with current config returns empty string for whitespace-only input
      expect(html).toBe('')
    })
  })

  describe('5. Mixed Content', () => {
    it('should correctly process content with both standard Markdown and Callouts', async () => {
      const mdx = `
# Title
Some introductory text.

<Callout type="info">This is an info callout.</Callout>

More text here.

<Callout type="warning"/>

## Subtitle
- List item 1
- List item 2
`
      const html = await processContent(mdx)
      const expectedHtml = `<h1>Title</h1>
<p>Some introductory text.</p>
<div class="callout callout-info">This is an info callout.</div>
<p>More text here.</p>
<div class="callout callout-warning"></div>
<h2>Subtitle</h2>
<ul>
<li>List item 1</li>
<li>List item 2</li>
</ul>
`
      // Normalize whitespace for comparison if needed, but remark usually standardizes it.
      // For this test, we'll compare with expected normalized output.
      expect(html.replace(/\n+/g, '\n').trim()).toBe(
        expectedHtml.replace(/\n+/g, '\n').trim(),
      )
    })
  })

  describe('6. Case Sensitivity of Callout Tags', () => {
    it('should NOT transform lowercase <callout> tags (as per current regex)', async () => {
      const mdx =
        '<callout type="info">This should not be transformed.</callout>'
      const html = await processContent(mdx)
      // It will be treated as a paragraph with literal tags by remark
      expect(html).toBe(
        '<p><callout type="info">This should not be transformed.</callout></p>\n',
      )
    })

    it('should NOT transform mixed case <CallOut> tags (as per current regex)', async () => {
      const mdx =
        '<CallOut type="warning">This should also not be transformed.</CallOut>'
      const html = await processContent(mdx)
      expect(html).toBe(
        '<p><CallOut type="warning">This should also not be transformed.</CallOut></p>\n',
      )
    })
  })

  describe('7. Complex nested content within Callouts', () => {
    it('should preserve Markdown within Callouts before remark processing', async () => {
      const mdx = `
<Callout type="error">
  ### Error Title
  - Point 1
  - Point 2
  [A Link](https://example.com)
</Callout>
`
      // The regex puts the raw inner content into the div.
      // Since the content is now inside HTML tags, remark doesn't process it as markdown
      const html = await processContent(mdx)
      const expectedContent = `<div class="callout callout-error">
  ### Error Title
  - Point 1
  - Point 2
  [A Link](https://example.com)
</div>
`
      expect(html).toBe(expectedContent)
    })
  })
})
