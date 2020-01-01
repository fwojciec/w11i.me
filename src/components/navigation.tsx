import * as React from 'react'
import { Link } from 'gatsby'
import style from '../styles/navigation.module.css'

// interface Props {
//   nextPath?: string
//   previousPath?: string
//   nextLabel?: string
//   previousLabel?: string
// }

interface Props {
  previousPost?: { frontmatter: { path: string; title: string } }
  nextPost?: { frontmatter: { path: string; title: string } }
}

const Navigation: React.FC<Props> = ({ previousPost, nextPost }) => {
  return previousPost || nextPost ? (
    <div className={style.navigation}>
      {previousPost && (
        <span className={style.button}>
          <Link to={previousPost.frontmatter.path}>
            <span className={style.iconPrev}>←</span>
            <span className={style.buttonText}>{previousPost.frontmatter.title}</span>
          </Link>
        </span>
      )}
      {nextPost && (
        <span className={style.button}>
          <Link to={nextPost.frontmatter.path}>
            <span className={style.buttonText}>{nextPost.frontmatter.title}</span>
            <span className={style.iconNext}>→</span>
          </Link>
        </span>
      )}
    </div>
  ) : null
}

export default Navigation
