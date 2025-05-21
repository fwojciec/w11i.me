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

  const postUrl = `https://w11i.me/${slug}`
  const imageUrl = post.meta.coverImage
    ? `https://w11i.me/images/${post.meta.coverImage}`
    : 'https://w11i.me/images/thumb_fb.png'

  return {
    title: post.meta.title,
    description: post.meta.excerpt,
    keywords: post.meta.tags,
    authors: [{ name: post.meta.author, url: 'https://w11i.me' }],
    openGraph: {
      type: 'article',
      url: postUrl,
      title: post.meta.title,
      description: post.meta.excerpt,
      publishedTime: post.meta.date,
      authors: [post.meta.author],
      tags: post.meta.tags,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.meta.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta.title,
      description: post.meta.excerpt,
      creator: '@filipcodes',
      images: [imageUrl],
    },
    alternates: {
      canonical: postUrl,
    },
    category: 'Technology',
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  const content = await processContent(post.content)

  const postUrl = `https://w11i.me/${slug}`
  const imageUrl = post.meta.coverImage
    ? `https://w11i.me/images/${post.meta.coverImage}`
    : 'https://w11i.me/images/thumb_fb.png'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.meta.title,
    description: post.meta.excerpt,
    image: imageUrl,
    datePublished: post.meta.date,
    dateModified: post.meta.date,
    author: {
      '@type': 'Person',
      name: post.meta.author,
      url: 'https://w11i.me',
    },
    publisher: {
      '@type': 'Person',
      name: 'Filip Wojciechowski',
      url: 'https://w11i.me',
    },
    url: postUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    keywords: post.meta.tags.join(', '),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
    </>
  )
}
