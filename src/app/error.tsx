'use client'

import { useEffect } from 'react'
import Layout from '../components/Layout'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <Layout title="Something went wrong" description="An error occurred.">
      <div
        style={{
          textAlign: 'center',
          padding: '2rem',
          maxWidth: '600px',
        }}
      >
        <h1>Something went wrong!</h1>
        <p
          style={{
            marginBottom: '2rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          We&apos;re sorry, but something unexpected happened.
        </p>
        <button
          onClick={reset}
          style={{
            backgroundColor: 'var(--color-background-secondary)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Try again
        </button>
      </div>
    </Layout>
  )
}
