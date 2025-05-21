import * as React from 'react'
import Link from 'next/link'
import Logo from './Logo'
import styles from '../styles/Navbar.module.css'

interface Props {
  onThemeToggle: () => void
}

const Navbar: React.FC<Props> = ({ onThemeToggle }) => {
  return (
    <header className={styles.root}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logoLink}>
          <Logo logoText="w11i.me" />
        </Link>
        <div className={styles.right}>
          <ul className={styles.menu}>
            <li>
              <Link href="/about" className={styles.link}>
                About
              </Link>
            </li>
          </ul>
          <button
            type="button"
            aria-label="Theme toggle"
            onClick={onThemeToggle}
            className={styles.themeToggle}
          >
            <svg
              version="1.1"
              height={24}
              width={24}
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22 41C32.4934 41 41 32.4934 41 22C41 11.5066 32.4934 3 22
            3C11.5066 3 3 11.5066 3 22C3 32.4934 11.5066 41 22 41ZM7 22C7
            13.7157 13.7157 7 22 7V37C13.7157 37 7 30.2843 7 22Z"
                fill="currentColor"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
