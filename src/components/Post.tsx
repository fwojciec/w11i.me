import * as React from 'react'
import styles from '../styles/Post.module.css'

interface PostProps {
  children?: React.ReactNode
}

const Post: React.FC<PostProps> = ({ children }) => {
  return <div className={styles.root}>{children}</div>
}

export default Post
