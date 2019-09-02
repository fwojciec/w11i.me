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
  const previousPath = previousPost && previousPost.frontmatter.path
  const previousLabel = previousPost && previousPost.frontmatter.title
  const nextPath = nextPost && nextPost.frontmatter.path
  const nextLabel = nextPost && nextPost.frontmatter.title
  console.log(excerpt)
  return (
    <div className={style.post}>
      <div className={style.postContent}>
        <h1 className={style.title}>{excerpt ? <Link to={path}>{title}</Link> : title}</h1>
        <div className={style.meta}>
          {date} {author && <>— Written by {author}</>}
          {tags ? (
            <div className={style.tags}>
              {tags.map(tag => (
                <Link to={`/tag/${toKebabCase(tag)}/`} key={toKebabCase(tag)}>
                  <span className={style.tag}>#{tag}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {coverImage && (
          <Img fluid={coverImage.childImageSharp.fluid} className={style.coverImage} />
        )}

        {excerpt ? (
          <>
            <p>{excerpt}</p>
            <Link to={path} className={style.readMore}>
              Read more →
            </Link>
          </>
        ) : (
          <>
            {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : null}
            {previousPath && previousLabel && nextPath && nextLabel && (
              <Navigation
                previousPath={previousPath}
                previousLabel={previousLabel}
                nextPath={nextPath}
                nextLabel={nextLabel}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Post
