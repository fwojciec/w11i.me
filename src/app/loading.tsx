import Layout from '../components/Layout'

export default function Loading() {
  return (
    <Layout>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          fontSize: '1.1rem',
          color: 'var(--color-text-secondary)',
        }}
      >
        Loading...
      </div>
    </Layout>
  )
}
