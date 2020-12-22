import * as React from 'react'
import { formatDate } from '../lib/date'
import styles from '../styles/PostDateAndTitle.module.scss'

interface Props {
  date: Date
  author: string
  twitterProfile?: string
}

const PostDateAndAuthor: React.FC<Props> = ({
  date,
  author,
  twitterProfile,
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
      </div>
    </div>
  )
}

export default PostDateAndAuthor
