import * as React from 'react'
import Image from 'next/image'
import Layout from '../components/Layout'
import styles from '../styles/Page.module.scss'

const AboutPage: React.FC = () => {
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
          layout="responsive"
        />
        <p>
          Hi there, My name is Filip. I&apos;m a software engineer from Poland,
          currently living in northern California. I started this blog as part
          of my transition to a career as a software developer. I post about
          technical topics I&apos;m passionate about: Go, Python,
          JavaScript/TypeScript, software design, code quality, testing, and
          various other software building practices. When not coding, I love
          playing with my 3 year old son and running in Trione-Annadel State
          Park.
        </p>
        <p>
          This blog is written in React/Next.js and the source code is available
          on <a href="https://github.com/fwojciec/w11i.me">Github</a>, along
          with some of my other projects. You can reach me on{' '}
          <a href="https://www.linkedin.com/in/filipwojciechowski/">LinkedIn</a>{' '}
          or <a href="https://twitter.com/filipcodes">Twitter</a>.
        </p>
      </div>
    </Layout>
  )
}

export default AboutPage
