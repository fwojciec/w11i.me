import { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import { getAllPosts, getPostBySlug } from '../lib/posts'
import processContent from '../lib/markdown'
import Layout from '../components/Layout'
import Post from '../components/Post'
import PostTitle from '../components/PostTitle'
import PostMeta from '../components/PostMeta'
import CoverImage from '../components/CoverImage'

interface Props {
  content: string
  meta: FrontMatter
  slug: string
}

export const getStaticProps: GetStaticProps<Props, { slug: string }> = async ({
  params,
}) => {
  if (!params?.slug) {
    throw new Error('Slug parameter is required')
  }
  const { slug } = params
  const post = await getPostBySlug(slug)
  const content = await processContent(post.content)

  return {
    props: {
      meta: post.meta,
      content,
      slug,
    },
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getAllPosts()
  const paths = posts.map(({ slug }) => ({ params: { slug } }))
  return {
    paths,
    fallback: false,
  }
}

const PostPage: NextPage<Props> = ({ content, meta, slug }) => {
  return (
    <Layout title={meta.title} description={meta.excerpt} path={`/${slug}`}>
      <Post>
        <PostTitle>{meta.title}</PostTitle>
        <PostMeta
          date={new Date(meta.date)}
          author={meta.author}
          twitterProfile={meta.twitterProfile}
          tags={meta.tags}
        />
        <CoverImage
          image={meta.coverImage}
          alt={`${meta.title} Cover Image`}
          credit={meta.coverImageCreditText}
          creditURL={meta.coverImageCreditUrl}
        />
        <div dangerouslySetInnerHTML={{ __html: content }}></div>
      </Post>
    </Layout>
  )
}

export default PostPage
