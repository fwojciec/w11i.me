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
          {date} {author && <>— Written by {author}</>}
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
            <Navigation previousPost={previousPost} nextPost={nextPost} />
          </>
        )}
      </div>
    </div>
  )
}

export default Post
