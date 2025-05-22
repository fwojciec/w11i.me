import * as React from 'react'
import PostDateAndAuthor from './PostDateAndAuthor'
import PostTags from './PostTags'
import styles from '../styles/PostMeta.module.css'

interface Props {
  date: Date
  author: string
  twitterProfile?: string
  tags: string[]
  readingTime: number
}

const PostMeta: React.FC<Props> = ({
  date,
  author,
  twitterProfile,
  tags,
  readingTime,
}) => {
  return (
    <div className={styles.root}>
      <PostDateAndAuthor
        date={date}
        author={author}
        twitterProfile={twitterProfile}
        readingTime={readingTime}
      />
      <PostTags tags={tags} />
    </div>
  )
}

export default PostMeta
