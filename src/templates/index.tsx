import * as React from 'react'
import { graphql } from 'gatsby'
import SEO from '../components/seo'
import Layout from '../components/layout'
import Post from '../components/post'
import Navigation from '../components/navigation'
import { GetPostsQuery } from '../generated/graphql'
import { fixCoverImage } from '../helpers/fixTypes'

interface Props {
  data: GetPostsQuery
  pageContext: {
    nextPagePath: string
    previousPagePath: string
  }
}

const Index: React.FC<Props> = ({ data, pageContext: { nextPagePath, previousPagePath } }) => {
  if (!data.allMarkdownRemark || !data.allMarkdownRemark.edges) {
    throw new Error('MarkdownRemark data is missing')
  }

  return (
    <>
      <SEO />
      <Layout>
        {data.allMarkdownRemark.edges.map(({ node }) => {
          const { id, excerpt, frontmatter } = node
          return (
            <Post
              key={id}
              title={frontmatter.title}
              date={frontmatter.date}
              path={frontmatter.path}
              author={frontmatter.author || undefined}
              coverImage={fixCoverImage(frontmatter.coverImage)}
              tags={frontmatter.tags || undefined}
              excerpt={excerpt || frontmatter.excerpt || undefined}
            />
          )
        })}

        <Navigation
          previousPath={previousPagePath}
          previousLabel="Newer posts"
          nextPath={nextPagePath}
          nextLabel="Older posts"
        />
      </Layout>
    </>
  )
}

export const postsQuery = graphql`
  query GetPosts($limit: Int!, $skip: Int!) {
    allMarkdownRemark(
      filter: { fileAbsolutePath: { regex: "//posts//" } }
      sort: { fields: [frontmatter___date], order: DESC }
      limit: $limit
      skip: $skip
    ) {
      edges {
        node {
          id
          excerpt
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
        }
      }
    }
  }
`

export default Index
