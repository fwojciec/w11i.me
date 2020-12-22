import * as React from 'react'
import Link from 'next/link'
import styles from '../styles/ReadMore.module.scss'

interface Props {
  slug: string
}

const ReadMore: React.FC<Props> = ({ slug }) => {
  return (
    <Link href={`/${slug}`}>
      <a className={styles.root}>Read more &rarr;</a>
    </Link>
  )
}

export default ReadMore
