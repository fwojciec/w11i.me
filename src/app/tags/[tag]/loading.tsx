import Layout from '../../../components/Layout'
import Post from '../../../components/Post'

export default function Loading() {
  return (
    <Layout>
      <div className="infoBanner">
        <div
          style={{
            height: '1.5rem',
            backgroundColor: 'var(--color-background-more)',
            borderRadius: '0.25rem',
            width: '200px',
          }}
        />
      </div>

      {/* Multiple post skeletons */}
      {[...Array(3)].map((_, index) => (
        <Post key={index}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {/* Title skeleton */}
            <div
              style={{
                height: '2.5rem',
                backgroundColor: 'var(--color-background-secondary)',
                borderRadius: '0.5rem',
              }}
            />

            {/* Meta skeleton */}
            <div
              style={{
                height: '1.5rem',
                backgroundColor: 'var(--color-background-secondary)',
                borderRadius: '0.25rem',
                width: '50%',
              }}
            />

            {/* Excerpt skeleton */}
            <div
              style={{
                height: '1rem',
                backgroundColor: 'var(--color-background-secondary)',
                borderRadius: '0.25rem',
                width: '90%',
              }}
            />
          </div>
        </Post>
      ))}
    </Layout>
  )
}
