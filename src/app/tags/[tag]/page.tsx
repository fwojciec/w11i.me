import Link from 'next/link'
import CoverImage from '../../../components/CoverImage'
import Layout from '../../../components/Layout'
import Post from '../../../components/Post'
import PostMeta from '../../../components/PostMeta'
import PostTitle from '../../../components/PostTitle'
import ReadMore from '../../../components/ReadMore'
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

  return {
    title: `Tag #${tag}`,
    description: `Blog posts tagged with #${tag}`,
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
        <Post key={slug}>
          <PostTitle>
            <Link href={`/${slug}`} className="post-title-link">
              {meta.title}
            </Link>
          </PostTitle>
          <PostMeta
            date={new Date(meta.date)}
            author={meta.author}
            twitterProfile={meta.twitterProfile}
            tags={meta.tags}
          />
          <CoverImage image={meta.coverImage} />
          <p>{meta.excerpt}</p>
          <ReadMore slug={slug} />
        </Post>
      ))}
    </Layout>
  )
}
