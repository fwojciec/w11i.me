import * as React from 'react'
import { Link } from 'gatsby'
import Icon from './icon'
import style from '../styles/menu.module.css'

interface MenuProps {
  mainMenu: MainMenuItem[]
  onChangeTheme: () => void
}

const toggleIcon = `M22 41C32.4934 41 41 32.4934 41 22C41 11.5066 32.4934 3 22
3C11.5066 3 3 11.5066 3 22C3 32.4934 11.5066 41 22 41ZM7 22C7
13.7157 13.7157 7 22 7V37C13.7157 37 7 30.2843 7 22Z`

const Menu: React.FC<MenuProps> = ({ mainMenu, onChangeTheme }) => {
  return (
    <>
      <div className={style.desktopMenuContainer}>
        <ul className={style.menu}>
          {mainMenu.map((menuItem, index) => (
            <li key={index}>
              <Link to={menuItem.path}>{menuItem.title}</Link>
            </li>
          ))}
        </ul>
      </div>
      <button
        className={style.themeToggle}
        onClick={onChangeTheme}
        type="button"
        aria-label="Theme toggle"
      >
        <Icon style={{ cursor: 'pointer' }} size={24} d={toggleIcon} />
      </button>
    </>
  )
}

export default Menu
