import * as React from 'react'
import { GetStaticProps, NextPage } from 'next'
import Link from 'next/link'
import { getAllPosts } from '../lib/posts'
import { tsFromStr } from '../lib/date'
import Layout from '../components/Layout'
import PostMeta from '../components/PostMeta'
import Post from '../components/Post'
import PostTitle from '../components/PostTitle'
import CoverImage from '../components/CoverImage'
import ReadMore from '../components/ReadMore'

interface Props {
  posts: {
    slug: string
    meta: FrontMatter
  }[]
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const posts = await getAllPosts()
  return {
    props: {
      posts: posts
        .map(({ slug, meta }) => ({ slug, meta }))
        .sort((a, b) => (tsFromStr(a.meta.date) - tsFromStr(b.meta.date)) * -1),
    },
  }
}

const IndexPage: NextPage<Props> = ({ posts }) => {
  return (
    <Layout>
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

export default IndexPage
