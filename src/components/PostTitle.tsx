import * as React from 'react'
import styles from '../styles/PostTitle.module.scss'

const PostTitle: React.FC = ({ children }) => {
  return <h1 className={styles.root}>{children}</h1>
}

export default PostTitle
