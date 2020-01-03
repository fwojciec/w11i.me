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
  keywords?: string[]
  title?: string
  pageUrl?: string
  image?: string
}

const SEO: React.FC<Props> = ({
  description,
  lang = 'en',
  keywords = defaultKeywords,
  title,
  pageUrl,
  image
}) => {
  const data: DefaultSeoQueryQuery = useStaticQuery(graphql`
    query DefaultSEOQuery {
      site {
        siteMetadata {
          title
          description
          siteUrl
          defaultImage: image
        }
      }
    }
  `)

  const siteTitle = data.site?.siteMetadata?.title || ''
  const metaTitle = title || siteTitle
  const metaDescription = description || data.site?.siteMetadata?.description || ''
  const siteUrl = data.site?.siteMetadata?.siteUrl || ''
  const metaUrl = pageUrl ? siteUrl + pageUrl : siteUrl
  const metaImg = image || data.site?.siteMetadata?.defaultImage || undefined

  return (
    <Helmet
      htmlAttributes={{ lang }}
      title={metaTitle}
      titleTemplate={title ? `${title} | ${siteTitle}` : siteTitle}
      meta={[
        {
          name: 'description',
          content: metaDescription
        },
        {
          property: 'og:title',
          content: metaTitle
        },
        {
          property: 'og:description',
          content: metaDescription
        },
        {
          property: 'og:type',
          content: 'website'
        },
        {
          property: 'og:url',
          content: metaUrl
        },
        {
          name: 'twitter:card',
          content: 'summary_large_image'
        },
        {
          name: 'twitter:creator',
          content: '@filipcodes'
        },
        {
          property: 'og:image',
          content: siteUrl + metaImg
        },
        {
          name: 'keywords',
          content: keywords.join(', ')
        }
      ]}
    />
  )
}

export default SEO
