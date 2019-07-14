import React from 'react'
import { graphql } from 'gatsby'
import SEO from '../components/seo'
import Layout from '../components/layout'
import Post from '../components/post'
import { GetPageQuery } from '../generated/graphql'
import { fixCoverImage } from '../helpers/fixTypes'

interface FrontMatter {
  frontmatter: {
    path: string
    title: string
  }
}

interface Props {
  data: GetPageQuery
  pageContext: {
    next: FrontMatter
    previous: FrontMatter
  }
}

const BlogPostTemplate: React.FC<Props> = ({ data, pageContext }) => {
  if (!data.markdownRemark) {
    throw new Error('MarkdownRemark data is missing')
  }
  const { frontmatter, excerpt, id, html } = data.markdownRemark
  return (
    <Layout>
      <SEO title={frontmatter.title} description={excerpt || frontmatter.excerpt || undefined} />
      <Post
        key={id}
        title={frontmatter.title}
        date={frontmatter.date}
        path={frontmatter.path}
        author={frontmatter.author || undefined}
        coverImage={fixCoverImage(frontmatter.coverImage)}
        html={html || undefined}
        tags={frontmatter.tags || undefined}
        previousPost={pageContext.previous}
        nextPost={pageContext.next}
      />
    </Layout>
  )
}

export default BlogPostTemplate

export const pageQuery = graphql`
  query GetPage($path: String) {
    markdownRemark(frontmatter: { path: { eq: $path } }) {
      frontmatter {
        title
        date(formatString: "DD MMMM YYYY")
        path
        author
        excerpt
        tags
        coverImage {
          childImageSharp {
            fluid(maxWidth: 800) {
              ...GatsbyImageSharpFluid
            }
          }
        }
      }
      id
      html
      excerpt
    }
  }
`
