import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import PostMeta from './PostMeta'
import styles from '../styles/PostCard.module.css'

interface Props {
  slug: string
  title: string
  date: Date
  author: string
  twitterProfile?: string
  tags: string[]
  readingTime: number
  excerpt: string
  coverImage?: string
}

const PostCard: React.FC<Props> = ({
  slug,
  title,
  date,
  author,
  twitterProfile,
  tags,
  readingTime,
  excerpt,
  coverImage,
}) => {
  const rootClassName = coverImage
    ? styles.root
    : `${styles.root} ${styles.noImage}`

  return (
    <article className={rootClassName}>
      {coverImage && (
        <Link href={`/${slug}`} className={styles.imageLink}>
          <div className={styles.imageWrapper}>
            <Image
              src={`/images/${coverImage}`}
              alt={`${title} Cover Image`}
              fill
              sizes="200px"
              style={{ objectFit: 'cover' }}
            />
          </div>
        </Link>
      )}
      <div className={styles.content}>
        <h2 className={styles.title}>
          <Link href={`/${slug}`}>{title}</Link>
        </h2>
        <PostMeta
          date={date}
          author={author}
          twitterProfile={twitterProfile}
          tags={tags}
          readingTime={readingTime}
        />
        <p className={styles.excerpt}>{excerpt}</p>
        <Link href={`/${slug}`} className={styles.readMore}>
          Read more &rarr;
        </Link>
      </div>
    </article>
  )
}

export default PostCard
