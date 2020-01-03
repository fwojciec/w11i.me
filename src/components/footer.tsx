import * as React from 'react'

interface Props {
  copyrights: string
}

const Footer: React.FC<Props> = ({ copyrights }) => (
  <footer>
    <div dangerouslySetInnerHTML={{ __html: copyrights }} />
  </footer>
)

export default Footer
