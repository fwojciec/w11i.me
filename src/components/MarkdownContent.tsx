'use client'
import { useEffect, useState } from 'react'
import CodeBlock from './SyntaxHighlighter'

interface MarkdownContentProps {
  content: string
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  const [processedContent, setProcessedContent] =
    useState<React.ReactNode>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Process the HTML content and replace code blocks with syntax highlighted versions
    const processContent = () => {
      // Split content by code blocks
      const parts = content.split(/(<pre><code[^>]*>[\s\S]*?<\/code><\/pre>)/g)

      const elements = parts.map((part, index) => {
        // Check if this part is a code block
        const codeMatch = part.match(
          /<pre><code(?:\s+class="language-([^"]*)")?>([\s\S]*?)<\/code><\/pre>/,
        )

        if (codeMatch) {
          const language = codeMatch[1] || undefined // Don't default to 'javascript'
          const code = codeMatch[2]
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")

          return (
            <CodeBlock key={index} language={language}>
              {code}
            </CodeBlock>
          )
        }

        // Return regular HTML content
        return <div key={index} dangerouslySetInnerHTML={{ __html: part }} />
      })

      setProcessedContent(elements)
    }

    processContent()
  }, [content, mounted])

  if (!mounted) {
    // Return unstyled content during SSR to avoid hydration mismatch
    return <div dangerouslySetInnerHTML={{ __html: content }} />
  }

  return <div>{processedContent}</div>
}
