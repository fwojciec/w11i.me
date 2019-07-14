import * as React from 'react'
import { Link } from 'gatsby'
import { Helmet } from 'react-helmet'
import Menu from './menu'
import style from '../styles/header.module.css'

interface Props {
  siteLogo: { src: string; alt: string }
  logoText: string
  defaultTheme: string
  mainMenu: { title: string; path: string }[]
  mainMenuItems: number
  menuMoreText: string
}

const Header: React.FC<Props> = ({
  siteLogo,
  logoText,
  mainMenu,
  mainMenuItems,
  menuMoreText,
  defaultTheme
}) => {
  const storedTheme = typeof window !== 'undefined' && window.localStorage.getItem('theme')
  const [userTheme, changeTheme] = React.useState(storedTheme)
  const [isMobileMenuVisible, toggleMobileMenu] = React.useState(false)
  const [isSubMenuVisible, toggleSubMenu] = React.useState(false)
  const onChangeTheme = () => {
    const otherTheme = (userTheme || defaultTheme) === 'light' ? 'dark' : 'light'
    changeTheme(otherTheme)
    typeof window !== 'undefined' && window.localStorage.setItem('theme', otherTheme)
  }
  const onToggleMobileMenu = () => toggleMobileMenu(!isMobileMenuVisible)
  const onToggleSubMenu = () => toggleSubMenu(!isSubMenuVisible)

  return (
    <>
      <Helmet>
        <body className={(userTheme || defaultTheme) === 'light' ? 'light-theme' : 'dark-theme'} />
      </Helmet>
      <header className={style.header}>
        <div className={style.inner}>
          <Link to="/">
            <div className={style.logo}>
              {siteLogo.src ? (
                <img src={siteLogo.src} alt={siteLogo.alt} />
              ) : (
                <>
                  <span className={style.mark}>&gt;</span>
                  <span className={style.text}>{logoText}</span>
                  <span className={style.cursor} />
                </>
              )}
            </div>
          </Link>
          <span className={style.right}>
            <Menu
              mainMenu={mainMenu}
              mainMenuItems={mainMenuItems}
              isMobileMenuVisible={isMobileMenuVisible}
              isSubMenuVisible={isSubMenuVisible}
              menuMoreText={menuMoreText}
              onToggleMobileMenu={onToggleMobileMenu}
              onToggleSubMenu={onToggleSubMenu}
              onChangeTheme={onChangeTheme}
            />
          </span>
        </div>
      </header>
    </>
  )
}

export default Header
