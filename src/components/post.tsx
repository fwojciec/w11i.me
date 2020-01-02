import * as React from 'react'
import { Link } from 'gatsby'
import Img, { FluidObject } from 'gatsby-image'
import Navigation from './navigation'
import { toKebabCase } from '../helpers'
import style from '../styles/post.module.css'

interface Props {
  title: string
  date: string
  path: string
  coverImage?: {
    childImageSharp: {
      fluid?: FluidObject | FluidObject[] | undefined
    }
  }
  author?: string
  excerpt?: string
  html?: string
  tags?: string[]
  previousPost?: { frontmatter: { path: string; title: string } }
  nextPost?: { frontmatter: { path: string; title: string } }
}

const Post: React.FC<Props> = ({
  title,
  date,
  path,
  coverImage,
  author,
  excerpt,
  tags,
  html,
  previousPost,
  nextPost
}) => {
  return (
    <div className={style.post}>
      <div className={style.postContent}>
        <h1 className={style.title}>{excerpt ? <Link to={path}>{title}</Link> : title}</h1>
        <div className={style.meta}>
          <div className={style.dateAndAuthor}>
            <span>{date}</span>
            <span>&nbsp;</span>
            {author && <div className={style.writtenBy}>— by {<Author author={author} />}</div>}
          </div>
          {tags && (
            <div className={style.tags}>
              {tags.map(tag => (
                <Link to={`/tag/${toKebabCase(tag)}/`} key={toKebabCase(tag)}>
                  <span className={style.tag}>#{tag}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {coverImage && (
          <Img fluid={coverImage.childImageSharp.fluid} className={style.coverImage} />
        )}

        {excerpt ? (
          <div>
            <p>{excerpt}</p>
            <Link to={path} className={style.readMore}>
              Read more →
            </Link>
          </div>
        ) : (
          <>
            {html && <div dangerouslySetInnerHTML={{ __html: html }} />}
            <Navigation previous={previousPost?.frontmatter} next={nextPost?.frontmatter} />
          </>
        )}
      </div>
    </div>
  )
}

const Author: React.FC<{ author: string }> = ({ author }) => {
  return (
    <a className={style.author} href="https://twitter.com/filipcodes">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
        <path
          d="M153.62 301.59c94.34 0 145.94-78.16 145.94-145.94 0-2.22 0-4.43-.15-6.63A104.36 104.36 0 00325 122.47a102.38 102.38 0 01-29.46 8.07 51.47 51.47 0 0022.55-28.37 102.79 102.79 0 01-32.57 12.45 51.34 51.34 0 00-87.41 46.78A145.62 145.62 0 0192.4 107.81a51.33 51.33 0 0015.88 68.47A50.91 50.91 0 0185 169.86v.65a51.31 51.31 0 0041.15 50.28 51.21 51.21 0 01-23.16.88 51.35 51.35 0 0047.92 35.62 102.92 102.92 0 01-63.7 22 104.41 104.41 0 01-12.21-.74 145.21 145.21 0 0078.62 23"
          fill="#1da1f2"
        />
      </svg>
      <span>{author}</span>
    </a>
  )
}

export default Post
