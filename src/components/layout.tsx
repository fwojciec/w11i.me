import * as React from 'react'
import { useStaticQuery, graphql } from 'gatsby'
import Header from './header'
import Footer from './footer'
import '../styles/layout.css'

interface DataProps {
  site: {
    siteMetadata: {
      logo: {
        src: string
        alt: string
      }
      logoText: string
      defaultTheme: string
      copyrights: string
      mainMenu: {
        title: string
        path: string
      }[]
      showMenuItems: number
      menuMoreText: string
    }
  }
}

const Layout: React.FC = ({ children }) => {
  const data = useStaticQuery<DataProps>(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          logo {
            src
            alt
          }
          logoText
          defaultTheme
          copyrights
          mainMenu {
            title
            path
          }
          showMenuItems
          menuMoreText
        }
      }
    }
  `)
  const {
    logo,
    logoText,
    defaultTheme,
    mainMenu,
    showMenuItems,
    menuMoreText,
    copyrights
  } = data.site.siteMetadata

  return (
    <div className="container">
      <Header
        siteLogo={logo}
        logoText={logoText}
        defaultTheme={defaultTheme}
        mainMenu={mainMenu}
        mainMenuItems={showMenuItems}
        menuMoreText={menuMoreText}
      />
      <div className="content">{children}</div>
      <Footer copyrights={copyrights} />
    </div>
  )
}

export default Layout
