import * as React from 'react'
import { formatDate } from '../lib/date'
import styles from '../styles/PostDateAndTitle.module.css'

interface Props {
  date: Date
  author: string
  twitterProfile?: string
  readingTime: number
}

const PostDateAndAuthor: React.FC<Props> = ({
  date,
  author,
  twitterProfile,
  readingTime,
}) => {
  return (
    <div className={styles.root}>
      <span>{formatDate(date)}</span>
      <div className={styles.writtenBy}>
        <span className={styles.hyphen}>—</span>
        <span>by&nbsp;</span>
        {twitterProfile ? (
          <a className={styles.author} href={twitterProfile}>
            <span>{author}</span>
          </a>
        ) : (
          <span className={styles.author}>{author}</span>
        )}
        <span className={styles.hyphen}>—</span>
        <span>{readingTime} min read</span>
      </div>
    </div>
  )
}

export default PostDateAndAuthor
