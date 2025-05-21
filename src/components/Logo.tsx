import * as React from 'react'
import styles from '../styles/Logo.module.css'

interface Props {
  logoText: string
}

const Logo: React.FC<Props> = ({ logoText }) => {
  return (
    <div className={styles.root}>
      <span className={styles.mark}>&gt;</span>
      <span className={styles.text}>{logoText}</span>
      <span className={styles.cursor} />
    </div>
  )
}

export default Logo
