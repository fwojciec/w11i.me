import * as React from 'react'
import Image from 'next/image'
import styles from '../styles/CoverImage.module.scss'

interface Props {
  image?: string
  alt?: string
  credit?: string
  creditURL?: string
}

const CoverImage: React.FC<Props> = ({ image, alt, credit, creditURL }) => {
  return image ? (
    <div className={styles.root}>
      <div className={styles.image}>
        <Image
          src={`/images/${image}`}
          alt={alt || ''}
          width={860}
          height={537.5}
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
      {credit && creditURL && (
        <a className={styles.credit} href={creditURL}>
          {credit}
        </a>
      )}
    </div>
  ) : null
}

export default CoverImage
