import * as React from 'react'
import { graphql } from 'gatsby'
import SEO from '../components/seo'
import Layout from '../components/layout'
import Post from '../components/post'
import Navigation from '../components/navigation'
import { GetTagsQuery } from '../generated/graphql'
import { fixCoverImage } from '../helpers/fixTypes'
import '../styles/layout.css'

interface Props {
  data: GetTagsQuery
  pageContext: {
    nextPagePath: string
    previousPagePath: string
    tag: string
  }
}

const Tags: React.FC<Props> = ({ data, pageContext: { nextPagePath, previousPagePath, tag } }) => {
  if (!data.allMarkdownRemark || !data.allMarkdownRemark.edges) {
    return null
  }

  return (
    <>
      <SEO />
      <Layout>
        <div className="infoBanner">
          Posts with tag: <span>#{tag}</span>
        </div>

        {data.allMarkdownRemark.edges.map(({ node: { id, excerpt, frontmatter } }) => {
          return (
            <Post
              key={id}
              title={frontmatter.title}
              date={frontmatter.date}
              path={frontmatter.path}
              author={frontmatter.author || undefined}
              tags={frontmatter.tags || undefined}
              coverImage={fixCoverImage(frontmatter.coverImage)}
              excerpt={frontmatter.excerpt || excerpt || undefined}
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
  query GetTags($limit: Int!, $skip: Int!, $tag: String!) {
    allMarkdownRemark(
      filter: { frontmatter: { tags: { in: [$tag] } } }
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

export default Tags
