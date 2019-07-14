import * as React from 'react'

interface Props {
  copyrights: string
}

const Footer: React.FC<Props> = ({ copyrights }) => (
  <footer>
    {copyrights ? (
      <div
        dangerouslySetInnerHTML={{
          __html: copyrights
        }}
      />
    ) : (
      <div>
        <span className="footerCopyrights">
          © 2019 Built with <a href="https://www.gatsbyjs.org">Gatsby</a>
        </span>
        <span className="footerCopyrights">
          Starter created by <a href="https://radoslawkoziel.pl">panr</a>
        </span>
      </div>
    )}
  </footer>
)

export default Footer
