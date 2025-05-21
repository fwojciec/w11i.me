import * as React from 'react'
import Layout from '../components/Layout'

export default function NotFound() {
  return (
    <Layout title="404: Not found" description="Page not found.">
      <h1>404: Not Found</h1>
      <p>You just hit a route that doesn&#39;t exist... the sadness.</p>
    </Layout>
  )
}
