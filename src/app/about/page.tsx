import * as React from 'react'
import Image from 'next/image'
import Layout from '../../components/Layout'
import styles from '../../styles/Page.module.css'
import { Metadata } from 'next'
import { LinkedInIcon, XIcon, BlueskyIcon } from '../../components/SocialIcons'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Information about Filip Wojciechowski, the author of w11i.me blog.',
}

export default function AboutPage() {
  return (
    <Layout
      title="About"
      description="Information about Filip Wojciechowski, the author of w11i.me blog."
      path="/about"
    >
      <div className={styles.root}>
        <h1>About me</h1>
        <Image
          src="/images/about.jpg"
          alt="Filip Wojciechowski"
          width={860}
          height={540}
          style={{ width: '100%', height: 'auto', marginBottom: '2rem' }}
        />
        <p>
          Hello! I&apos;m Filip. I took the scenic route to software
          engineering—from political theory PhD candidate to literary agent to
          staff engineer at <a href="https://www.acuitymd.com/">AcuityMD</a>.
          After making the leap to tech in my forties, I discovered my favorite
          career yet.
        </p>
        <p>
          Based in the Bay Area, I write about AI, evolving software practices,
          and how technology is reshaping the way we build. When I&apos;m not
          coding, you&apos;ll find me running trails, playing with my son, or
          wondering what plot twist life has planned next.
        </p>
        <p className={styles.socialLinks}>
          <a
            href="https://www.linkedin.com/in/filipwojciechowski/"
            className={styles.socialLink}
            aria-label="LinkedIn"
          >
            <LinkedInIcon className={styles.socialIcon} />
          </a>
          <a
            href="https://twitter.com/filipcodes"
            className={styles.socialLink}
            aria-label="X (Twitter)"
          >
            <XIcon className={styles.socialIcon} />
          </a>
          <a
            href="https://bsky.app/profile/fwojciec.bsky.social"
            className={styles.socialLink}
            aria-label="Bluesky"
          >
            <BlueskyIcon className={styles.socialIcon} />
          </a>
        </p>
      </div>
    </Layout>
  )
}
