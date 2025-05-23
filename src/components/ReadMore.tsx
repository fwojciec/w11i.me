import * as React from 'react'
import Link from 'next/link'
import styles from '../styles/ReadMore.module.css'

interface Props {
  slug: string
}

const ReadMore: React.FC<Props> = ({ slug }) => {
  return (
    <Link href={`/${slug}`} className={styles.root}>
      Read more &rarr;
    </Link>
  )
}

export default ReadMore
