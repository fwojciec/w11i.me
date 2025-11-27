import * as React from 'react'
import { getAllPostsMeta } from '../lib/posts'
import { tsFromStr } from '../lib/date'
import Layout from '../components/Layout'
import PostCard from '../components/PostCard'

export default async function HomePage() {
  const posts = await getAllPostsMeta()
  const sortedPosts = posts.sort(
    (a, b) => (tsFromStr(a.meta.date) - tsFromStr(b.meta.date)) * -1,
  )

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'w11i.me - Filip Wojciechowski',
    description:
      'Personal blog about software development, TypeScript, Python, Go, and web technologies',
    url: 'https://w11i.me',
    author: {
      '@type': 'Person',
      name: 'Filip Wojciechowski',
      url: 'https://w11i.me',
      sameAs: ['https://twitter.com/filipcodes'],
    },
    blogPost: sortedPosts.slice(0, 10).map(({ slug, meta }) => ({
      '@type': 'BlogPosting',
      headline: meta.title,
      description: meta.excerpt,
      datePublished: meta.date,
      author: {
        '@type': 'Person',
        name: meta.author,
      },
      url: `https://w11i.me/${slug}`,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Layout>
        {sortedPosts.map(({ slug, meta }) => (
          <PostCard
            key={slug}
            slug={slug}
            title={meta.title}
            date={new Date(meta.date)}
            author={meta.author}
            twitterProfile={meta.twitterProfile}
            tags={meta.tags}
            readingTime={meta.readingTime}
            excerpt={meta.excerpt}
            coverImage={meta.coverImage}
          />
        ))}
      </Layout>
    </>
  )
}
