'use client'
import { useEffect, useState, lazy, Suspense } from 'react'
import { useTheme } from '../contexts/ThemeContext'

// Dynamically import CodeBlock to reduce initial bundle size
const CodeBlock = lazy(() => import('./SyntaxHighlighter'))

interface MarkdownContentProps {
  content: string
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  const { theme } = useTheme()
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
            <Suspense
              key={`${index}-${theme}`}
              fallback={
                <pre
                  style={{
                    backgroundColor: 'var(--color-background-secondary)',
                    color: 'var(--color-text)',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    overflow: 'auto',
                    margin: '1rem 0',
                  }}
                >
                  <code>{code}</code>
                </pre>
              }
            >
              <CodeBlock language={language} theme={theme}>
                {code}
              </CodeBlock>
            </Suspense>
          )
        }

        // Return regular HTML content
        return <div key={index} dangerouslySetInnerHTML={{ __html: part }} />
      })

      setProcessedContent(elements)
    }

    processContent()
  }, [content, mounted, theme])

  if (!mounted) {
    // Return unstyled content during SSR to avoid hydration mismatch
    return <div dangerouslySetInnerHTML={{ __html: content }} />
  }

  return <div>{processedContent}</div>
}
