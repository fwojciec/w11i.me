import Layout from '../../components/Layout'
import Post from '../../components/Post'

export default function Loading() {
  return (
    <Layout>
      <Post>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            animation: 'pulse 2s infinite',
          }}
        >
          {/* Title skeleton */}
          <div
            style={{
              height: '3rem',
              backgroundColor: 'var(--color-background-secondary)',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
            }}
          />

          {/* Meta skeleton */}
          <div
            style={{
              height: '1.5rem',
              backgroundColor: 'var(--color-background-secondary)',
              borderRadius: '0.25rem',
              width: '60%',
            }}
          />

          {/* Cover image skeleton */}
          <div
            style={{
              height: '300px',
              backgroundColor: 'var(--color-background-secondary)',
              borderRadius: '0.5rem',
              margin: '2rem 0',
            }}
          />

          {/* Content skeleton */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              style={{
                height: '1rem',
                backgroundColor: 'var(--color-background-secondary)',
                borderRadius: '0.25rem',
                width: i === 2 ? '80%' : '100%',
              }}
            />
          ))}
        </div>
      </Post>
    </Layout>
  )
}
