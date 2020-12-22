import * as React from 'react'
import styles from '../styles/Footer.module.scss'

const Footer: React.FC = () => {
  return (
    <footer className={styles.root}>
      <ul>
        <li>
          Text copyright &copy; {new Date().getFullYear()} by Filip
          Wojciechowski
        </li>
        <li>
          Design based on&nbsp;
          <a href="https://github.com/panr/gatsby-starter-hello-friend">
            Hello Friend
          </a>
          &nbsp;theme by <a href="https://radoslawkoziel.pl">panr</a>
        </li>
      </ul>
    </footer>
  )
}

export default Footer
