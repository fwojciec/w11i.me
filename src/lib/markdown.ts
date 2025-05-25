import { remark } from 'remark'
import remarkHtml from 'remark-html'

// Process MDX content as enhanced markdown with component conversion
export async function processContent(content: string) {
  // Convert MDX components to HTML equivalents
  let processedContent = content

  // Convert Callout components to HTML divs with classes
  processedContent = processedContent.replace(
    /<Callout\s+type="(info|warning|error)"[^>]*>([\s\S]*?)<\/Callout>/g,
    '<div class="callout callout-$1">$2</div>',
  )

  // Convert self-closing Callout components
  processedContent = processedContent.replace(
    /<Callout\s+type="(info|warning|error)"[^>]*\/>/g,
    '<div class="callout callout-$1"></div>',
  )

  // Convert Mark/Highlight components to HTML mark elements
  processedContent = processedContent.replace(
    /<(Mark|Highlight)>([\s\S]*?)<\/(Mark|Highlight)>/g,
    '<mark class="mdx-highlight">$2</mark>',
  )

  // Process as regular markdown (syntax highlighting will be added client-side)
  const result = await remark()
    .use(remarkHtml as any, { sanitize: false })
    .process(processedContent)
  return result.toString()
}

// Keep the default export for backward compatibility
export default processContent
