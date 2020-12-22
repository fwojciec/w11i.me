import { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import { getAllPosts, getPostBySlug } from '../lib/posts'
import markdownToHtml from '../lib/markdown'
import Layout from '../components/Layout'
import Post from '../components/Post'
import PostTitle from '../components/PostTitle'
import PostMeta from '../components/PostMeta'
import CoverImage from '../components/CoverImage'

interface Props {
  content: string
  meta: FrontMatter
}

export const getStaticProps: GetStaticProps<Props, { slug: string }> = async ({
  params: { slug },
}) => {
  const post = await getPostBySlug(slug)
  const content = await markdownToHtml(post.content)
  return {
    props: {
      meta: post.meta,
      content,
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

const PostPage: NextPage<Props> = ({ content, meta }) => {
  return (
    <Layout title={meta.title} description={meta.excerpt}>
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
