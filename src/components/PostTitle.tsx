import * as React from 'react'
import styles from '../styles/PostTitle.module.css'

interface PostTitleProps {
  children?: React.ReactNode
}

const PostTitle: React.FC<PostTitleProps> = ({ children }) => {
  return <h1 className={styles.root}>{children}</h1>
}

export default PostTitle
