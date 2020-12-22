import * as React from 'react'
import NextHead from 'next/head'

interface Props {
  title: string
  description: string
}

const Head: React.FC<Props> = ({ title, description }) => {
  return (
    <NextHead>
      <title>{title}</title>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      <meta name="description" content={description} />
      <link rel="icon" href="/icons/icon-48x48.png" />
    </NextHead>
  )
}

export default Head
