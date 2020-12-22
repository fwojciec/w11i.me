import * as React from 'react'
import Image from 'next/image'
import Layout from '../components/Layout'
import styles from '../styles/Page.module.scss'

const AboutPage: React.FC = () => {
  return (
    <Layout
      title="About"
      description="Information about Filip Wojciechowski, the author of w11i.me blog."
    >
      <div className={styles.root}>
        <h1>About me</h1>
        <Image
          src="/images/about.jpg"
          width={860}
          height={540}
          layout="responsive"
        />
        <p>
          Hi there! My name is Filip Wojciechowski and I&apos;m the author of
          this blog. I&apos;m a software engineer based in Warsaw, Poland. This
          blog was originally created as a vehicle for learning when I was
          preparing to transition to a career as a software developer and I
          still post here from time to time.
        </p>
        <p>
          I write about software development, mostly. I&apos;m interested in the
          entire software stack, from backend to frontend, as well as in
          software design, code quality, testing, and various other practices
          related to building software. I work primarily in Python, Go, and
          TypeScript/JavaScript, while learning Haskell and Rust in my free
          time.
        </p>
        <p>
          This blog is written in React/Next.js and the source code is available
          on <a href="https://github.com/fwojciec/w11i.me">Github</a>, along
          with some of my other projects.
        </p>
        <p>
          If you would like to contact me please send me a message on{' '}
          <a href="https://www.linkedin.com/in/filipwojciechowski/">LinkedIn</a>{' '}
          or <a href="https://twitter.com/filipcodes">Twitter</a>.
        </p>
      </div>
    </Layout>
  )
}

export default AboutPage
