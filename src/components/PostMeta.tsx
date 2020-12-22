import * as React from 'react'
import PostDateAndAuthor from './PostDateAndAuthor'
import PostTags from './PostTags'
import styles from '../styles/PostMeta.module.scss'

interface Props {
  date: Date
  author: string
  twitterProfile?: string
  tags: string[]
}

const PostMeta: React.FC<Props> = ({ date, author, twitterProfile, tags }) => {
  return (
    <div className={styles.root}>
      <PostDateAndAuthor
        date={date}
        author={author}
        twitterProfile={twitterProfile}
      />
      <PostTags tags={tags} />
    </div>
  )
}

export default PostMeta
