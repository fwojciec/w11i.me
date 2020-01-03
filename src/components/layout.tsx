import * as React from 'react'
import { useStaticQuery, graphql } from 'gatsby'
import Header from './header'
import Footer from './footer'
import '../styles/layout.css'

const Layout: React.FC = ({ children }) => {
  const data = useStaticQuery<{ site: { siteMetadata: SiteMetaData } }>(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          logoText
          defaultTheme
          copyrights
          mainMenu {
            title
            path
          }
        }
      }
    }
  `)
  const { logoText, defaultTheme, mainMenu, copyrights } = data.site.siteMetadata

  return (
    <div className="container">
      <Header logoText={logoText} defaultTheme={defaultTheme} mainMenu={mainMenu} />
      <div className="content">{children}</div>
      <Footer copyrights={copyrights} />
    </div>
  )
}

export default Layout
