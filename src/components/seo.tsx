import * as React from 'react'
import Helmet from 'react-helmet'
import { useStaticQuery, graphql } from 'gatsby'
import { DefaultSeoQueryQuery } from '../generated/graphql'

const defaultKeywords = [
  'gatsby',
  'react',
  'next.js',
  'typescript',
  'javascript',
  'golang',
  'go',
  'coding',
  'programming',
  'personal site'
]

interface Props {
  description?: string
  lang?: string
  meta?:
    | { name: string; content: string; property?: undefined }
    | { property: string; content: string; name?: undefined }[]
  keywords?: string[]
  title?: string
  image?: string
  pageUrl?: string
}

const SEO: React.FC<Props> = ({
  description,
  lang = 'en',
  meta = [],
  keywords = defaultKeywords,
  title,
  pageUrl,
  image
}) => {
  const data: DefaultSeoQueryQuery = useStaticQuery(graphql`
    query DefaultSEOQuery {
      file(relativePath: { eq: "blog_image2.jpg" }) {
        childImageSharp {
          fluid {
            src
          }
        }
      }
      site {
        siteMetadata {
          title
          description
          siteUrl
        }
      }
    }
  `)

  const siteDescription = data.site?.siteMetadata?.description || `Filip Wojciechowski's blog`
  const siteUrl = data.site?.siteMetadata?.siteUrl || 'https://w11i.me'
  const siteTitle = data.site?.siteMetadata?.title || `Filip Wojciechowski's Blog`

  const metaTitle = title || siteTitle
  const metaDescription = description || siteDescription
  const metaUrl = pageUrl ? siteUrl + pageUrl : siteUrl

  const blogImg = data.file?.childImageSharp?.fluid?.src || undefined

  const metaImg = image || blogImg

  return (
    <Helmet
      htmlAttributes={{ lang }}
      title={metaTitle}
      titleTemplate={title ? `${title} | ${siteTitle}` : siteTitle}
      meta={[
        {
          name: `description`,
          content: metaDescription
        },
        {
          property: `og:title`,
          content: metaTitle
        },
        {
          property: `og:description`,
          content: metaDescription
        },
        {
          property: `og:type`,
          content: `website`
        },
        {
          property: `og:url`,
          content: metaUrl
        },
        {
          name: `twitter:card`,
          content: `summary_large_image`
        },
        {
          name: `twitter:creator`,
          content: '@filipcodes'
        }
      ]
        .concat(
          metaImg
            ? {
                property: 'og:image',
                content: siteUrl + metaImg
              }
            : []
        )
        .concat(
          keywords.length > 0
            ? {
                name: `keywords`,
                content: keywords.join(`, `)
              }
            : []
        )
        .concat(meta)}
    />
  )
}

export default SEO
