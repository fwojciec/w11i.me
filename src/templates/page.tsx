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
    next?: FrontMatter
    previous?: FrontMatter
  }
}

const BlogPostTemplate: React.FC<Props> = ({ data, pageContext }) => {
  if (!data.markdownRemark) {
    throw new Error('MarkdownRemark data is missing')
  }
  const { frontmatter, excerpt, id, html } = data.markdownRemark
  return (
    <Layout>
      <SEO
        title={frontmatter.title}
        description={frontmatter.excerpt || excerpt || undefined}
        image={data.markdownRemark.frontmatter.coverImage?.childImageSharp?.fluid?.src || undefined}
        pageUrl={data.markdownRemark.frontmatter.path}
      />
      <Post
        key={id}
        title={frontmatter.title}
        date={frontmatter.date}
        path={frontmatter.path}
        author={frontmatter.author || undefined}
        coverImage={frontmatter.coverImage ? fixCoverImage(frontmatter.coverImage) : undefined}
        html={html || undefined}
        tags={frontmatter.tags || undefined}
        previousPost={pageContext.previous?.frontmatter}
        nextPost={pageContext.next?.frontmatter}
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
            fluid(maxWidth: 860) {
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
