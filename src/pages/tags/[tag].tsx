import { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import Link from 'next/link'
import CoverImage from '../../components/CoverImage'
import Layout from '../../components/Layout'
import Post from '../../components/Post'
import PostMeta from '../../components/PostMeta'
import PostTitle from '../../components/PostTitle'
import ReadMore from '../../components/ReadMore'
import { tsFromStr } from '../../lib/date'
import { getAllPosts } from '../../lib/posts'

interface Props {
  tag: string
  posts: {
    slug: string
    meta: FrontMatter
  }[]
}

export const getStaticProps: GetStaticProps<Props, { tag: string }> = async ({
  params: { tag },
}) => {
  const posts = await getAllPosts()
  return {
    props: {
      tag,
      posts: posts
        .filter((post) => post.meta.tags.includes(tag))
        .map(({ slug, meta }) => ({ slug, meta }))
        .sort((a, b) => (tsFromStr(a.meta.date) - tsFromStr(b.meta.date)) * -1),
    },
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getAllPosts()
  const allTags = new Set<string>()
  posts.forEach((post) => {
    post.meta.tags.forEach((tag) => {
      allTags.add(tag)
    })
  })
  const paths = Array.from(allTags).map((tag) => ({ params: { tag } }))
  return {
    paths,
    fallback: false,
  }
}

const TagIndexPage: NextPage<Props> = ({ tag, posts }) => {
  return (
    <Layout
      title={`Tag #${tag}`}
      description={`Blog posts tagged with #${tag}`}
      path={`/tags/${tag}`}
    >
      <div className="infoBanner">
        Posts tagged with: <span>{`#${tag}`}</span>
      </div>
      {posts.map(({ slug, meta }) => (
        <Post key={slug}>
          <PostTitle>
            <Link href={`/${slug}`}>
              <a>{meta.title}</a>
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

export default TagIndexPage
