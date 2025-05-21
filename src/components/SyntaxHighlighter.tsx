'use client'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import {
  atomOneDark,
  atomOneLight,
} from 'react-syntax-highlighter/dist/cjs/styles/hljs'
import javascript from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript'
import typescript from 'react-syntax-highlighter/dist/cjs/languages/hljs/typescript'
import python from 'react-syntax-highlighter/dist/cjs/languages/hljs/python'
import go from 'react-syntax-highlighter/dist/cjs/languages/hljs/go'
import bash from 'react-syntax-highlighter/dist/cjs/languages/hljs/bash'
import json from 'react-syntax-highlighter/dist/cjs/languages/hljs/json'
import css from 'react-syntax-highlighter/dist/cjs/languages/hljs/css'
import sql from 'react-syntax-highlighter/dist/cjs/languages/hljs/sql'
import markdown from 'react-syntax-highlighter/dist/cjs/languages/hljs/markdown'
import xml from 'react-syntax-highlighter/dist/cjs/languages/hljs/xml'
import yaml from 'react-syntax-highlighter/dist/cjs/languages/hljs/yaml'
import dockerfile from 'react-syntax-highlighter/dist/cjs/languages/hljs/dockerfile'

// Register languages
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('go', go)
SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('sql', sql)
SyntaxHighlighter.registerLanguage('markdown', markdown)
SyntaxHighlighter.registerLanguage('xml', xml)
SyntaxHighlighter.registerLanguage('yaml', yaml)
SyntaxHighlighter.registerLanguage('dockerfile', dockerfile)

interface CodeBlockProps {
  children: string
  language?: string
  theme?: 'light' | 'dark'
}

function shouldHighlight(language?: string, code?: string): boolean {
  // Don't highlight if no language specified and content looks like plain text/terminal output
  if (
    !language ||
    language === 'text' ||
    language === 'plain' ||
    language === 'graphql'
  ) {
    return false
  }

  // Don't highlight shell output (starts with > or $, contains version numbers, etc.)
  if (!language && code) {
    const lines = code.trim().split('\n')
    const firstLine = lines[0]?.trim()

    // Looks like shell command output
    if (firstLine?.startsWith('>') || firstLine?.startsWith('$')) {
      return false
    }

    // Looks like version output or simple text
    if (/^v?\d+\.\d+(\.\d+)?/.test(firstLine)) {
      return false
    }
  }

  return true
}

export default function CodeBlock({
  children,
  language,
  theme = 'dark',
}: CodeBlockProps) {
  const shouldUseHighlighting = shouldHighlight(language, children)

  if (!shouldUseHighlighting) {
    // Return a simple pre/code block without syntax highlighting
    return (
      <pre
        className="syntax-highlighter-fallback"
        style={{
          backgroundColor: theme === 'light' ? '#fafafa' : '#282c34',
          color: theme === 'light' ? '#2c3e50' : '#abb2bf',
          padding: '1rem',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          overflow: 'auto',
          margin: '1rem 0',
        }}
      >
        <code style={{ color: 'inherit' }}>{children}</code>
      </pre>
    )
  }

  return (
    <SyntaxHighlighter
      language={language || 'javascript'}
      style={theme === 'light' ? atomOneLight : atomOneDark}
      customStyle={{
        margin: '1rem 0',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
      }}
      showLineNumbers={false}
      wrapLines={true}
      wrapLongLines={true}
    >
      {children}
    </SyntaxHighlighter>
  )
}
