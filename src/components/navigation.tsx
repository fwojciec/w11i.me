import * as React from 'react'
import { Link } from 'gatsby'
import style from '../styles/navigation.module.css'

interface Props {
  previous?: PostLink
  next?: PostLink
}

const Navigation: React.FC<Props> = ({ previous, next }) => {
  return previous || next ? (
    <div className={style.navigation}>
      {previous && (
        <span className={style.button}>
          <Link to={previous.path}>
            <span className={style.iconPrev}>←</span>
            <span className={style.buttonText}>{previous.title}</span>
          </Link>
        </span>
      )}
      {next && (
        <span className={style.button}>
          <Link to={next.path}>
            <span className={style.buttonText}>{next.title}</span>
            <span className={style.iconNext}>→</span>
          </Link>
        </span>
      )}
    </div>
  ) : null
}

export default Navigation
