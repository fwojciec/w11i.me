import * as React from 'react'
import NextHead from 'next/head'

interface Props {
  title: string
  description: string
  url: string
}

const Head: React.FC<Props> = ({ title, description, url }) => {
  return (
    <NextHead>
      <title>{title}</title>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      <meta name="description" content={description} />
      <link rel="icon" href="/icons/icon-48x48.png" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content="/images/thumb_fb.png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content="/images/thumb_tw.png" />
      <meta name="twitter:card" content="summary_large_image" />
    </NextHead>
  )
}

export default Head
