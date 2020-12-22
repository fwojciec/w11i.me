import * as React from 'react'
import { useTheme } from '../hooks/useTheme'
import useLayoutEffect from '../hooks/useIsomorphicLayoutEffect'
import Head from './Head'
import Navbar from './Navbar'
import Footer from './Footer'

interface Props {
  title?: string
  description?: string
}

const Layout: React.FC<Props> = ({ children, title, description }) => {
  const [theme, onThemeToggle] = useTheme('dark')

  useLayoutEffect(() => {
    if (theme === 'light') {
      document.querySelector('body').classList.add('dark-theme')
    } else {
      document.querySelector('body').classList.remove('dark-theme')
    }
  }, [theme])

  return (
    <>
      <Head
        title={title ? title + ' | w11i.me' : 'w11i.me'}
        description={
          description
            ? description
            : 'A personal blog featuring writing on my two hobbies: coding and books.'
        }
      />
      <main className="container">
        <Navbar onThemeToggle={onThemeToggle} />
        <div className="content">{children}</div>
        <Footer />
      </main>
    </>
  )
}

export default Layout
