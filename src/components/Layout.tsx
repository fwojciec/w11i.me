'use client'
import * as React from 'react'
import { useTheme } from 'next-themes'
import Head from './Head'
import Navbar from './Navbar'
import Footer from './Footer'

interface Props {
  title?: string
  description?: string
  path?: string
  children?: React.ReactNode
}

const Layout: React.FC<Props> = ({ children, title, description, path }) => {
  const { setTheme, theme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <>
      <Head
        title={title ? title + ' | w11i.me' : 'w11i.me'}
        description={
          description
            ? description
            : 'A blog about software development (mostly). Tutorials, and reflections on the process of building software. Go, Python and TypeScript/JavaScript.'
        }
        url={`https://w11i.me${path ? path : ''}`}
      />
      <main className="container">
        <Navbar onThemeToggle={toggleTheme} />
        <div className="content">{children}</div>
        <Footer />
      </main>
    </>
  )
}

export default Layout
