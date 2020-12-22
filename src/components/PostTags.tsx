import * as React from 'react'
import Link from 'next/link'
import styles from '../styles/PostTags.module.scss'

interface Props {
  tags: string[]
}

const PostTags: React.FC<Props> = ({ tags }) => {
  return (
    <div className={styles.root}>
      {tags.map((tag) => (
        <Link key={tag} href={`/tags/${tag}`}>
          <a>
            <span className={styles.tag}>{`#${tag}`}</span>
          </a>
        </Link>
      ))}
    </div>
  )
}

export default PostTags
