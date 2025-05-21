import { getAllPostsMeta, getPostBySlug } from '../../lib/posts'
import processContent from '../../lib/markdown'
import Layout from '../../components/Layout'
import Post from '../../components/Post'
import PostTitle from '../../components/PostTitle'
import PostMeta from '../../components/PostMeta'
import CoverImage from '../../components/CoverImage'
import MarkdownContent from '../../components/MarkdownContent'
import { Metadata } from 'next'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = await getAllPostsMeta()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  return {
    title: post.meta.title,
    description: post.meta.excerpt,
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  const content = await processContent(post.content)

  return (
    <Layout
      title={post.meta.title}
      description={post.meta.excerpt}
      path={`/${slug}`}
    >
      <Post>
        <PostTitle>{post.meta.title}</PostTitle>
        <PostMeta
          date={new Date(post.meta.date)}
          author={post.meta.author}
          twitterProfile={post.meta.twitterProfile}
          tags={post.meta.tags}
        />
        <CoverImage
          image={post.meta.coverImage}
          alt={`${post.meta.title} Cover Image`}
          credit={post.meta.coverImageCreditText}
          creditURL={post.meta.coverImageCreditUrl}
        />
        <MarkdownContent content={content} />
      </Post>
    </Layout>
  )
}
