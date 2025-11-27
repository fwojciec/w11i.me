import Layout from '../../../components/Layout'
import PostCard from '../../../components/PostCard'
import { tsFromStr } from '../../../lib/date'
import { getAllPostsMeta } from '../../../lib/posts'
import { Metadata } from 'next'

type Props = {
  params: Promise<{ tag: string }>
}

export async function generateStaticParams() {
  const posts = await getAllPostsMeta()
  const allTags = new Set<string>()
  posts.forEach((post) => {
    post.meta.tags.forEach((tag) => {
      allTags.add(tag)
    })
  })
  return Array.from(allTags).map((tag) => ({ tag }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params
  const tagUrl = `https://w11i.me/tags/${encodeURIComponent(tag)}`
  const capitalizedTag = tag.charAt(0).toUpperCase() + tag.slice(1)

  return {
    title: `${capitalizedTag} Articles`,
    description: `Explore articles about ${tag} on w11i.me. Software development tutorials, insights, and best practices.`,
    keywords: [tag, 'software development', 'programming', 'tutorials'],
    openGraph: {
      type: 'website',
      url: tagUrl,
      title: `${capitalizedTag} Articles - w11i.me`,
      description: `Explore articles about ${tag} on w11i.me. Software development tutorials, insights, and best practices.`,
      images: [
        {
          url: 'https://w11i.me/images/thumb_fb.png',
          width: 1200,
          height: 630,
          alt: `${capitalizedTag} Articles - w11i.me`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${capitalizedTag} Articles - w11i.me`,
      description: `Explore articles about ${tag}. Software development tutorials and insights.`,
      creator: '@filipcodes',
      images: ['https://w11i.me/images/thumb_tw.png'],
    },
    alternates: {
      canonical: tagUrl,
    },
  }
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params
  const posts = await getAllPostsMeta()
  const filteredPosts = posts
    .filter((post) => post.meta.tags.includes(tag))
    .sort((a, b) => (tsFromStr(a.meta.date) - tsFromStr(b.meta.date)) * -1)

  return (
    <Layout
      title={`Tag #${tag}`}
      description={`Blog posts tagged with #${tag}`}
      path={`/tags/${tag}`}
    >
      <div className="infoBanner">
        Posts tagged with: <span>{`#${tag}`}</span>
      </div>
      {filteredPosts.map(({ slug, meta }) => (
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
  )
}
