import * as React from 'react'
import Link from 'next/link'
import styles from '../styles/PostTags.module.css'

interface Props {
  tags: string[]
}

const PostTags: React.FC<Props> = ({ tags }) => {
  return (
    <div className={styles.root}>
      {tags.map((tag) => (
        <Link key={tag} href={`/tags/${tag}`} className={styles.link}>
          <span className={styles.tag}>{`#${tag}`}</span>
        </Link>
      ))}
    </div>
  )
}

export default PostTags
