import * as React from 'react'
import styles from '../styles/Post.module.scss'

const Post: React.FC = ({ children }) => {
  return <div className={styles.root}>{children}</div>
}

export default Post
