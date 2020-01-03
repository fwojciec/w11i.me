import * as React from 'react'
import { Link } from 'gatsby'
import { Helmet } from 'react-helmet'
import Menu from './menu'
import style from '../styles/header.module.css'
import { useTheme } from '../hooks/useTheme'

interface Props {
  logoText: string
  defaultTheme: string
  mainMenu: MainMenuItem[]
}

const Header: React.FC<Props> = ({ logoText, mainMenu, defaultTheme }) => {
  const [theme, onChangeTheme] = useTheme(defaultTheme)
  return (
    <>
      <Helmet>
        <body className={`${theme}-theme`} />
      </Helmet>
      <header className={style.header}>
        <div className={style.inner}>
          <Link to="/">
            <div className={style.logo}>
              <span className={style.mark}>&gt;</span>
              <span className={style.text}>{logoText}</span>
              <span className={style.cursor} />
            </div>
          </Link>
          <span className={style.right}>
            <Menu mainMenu={mainMenu} onChangeTheme={onChangeTheme} />
          </span>
        </div>
      </header>
    </>
  )
}

export default Header
