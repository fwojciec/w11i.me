import * as React from 'react'
import { useStaticQuery, graphql } from 'gatsby'
import Img from 'gatsby-image'
import { GetImgQuery } from '../generated/graphql'
import { fixCoverImage } from '../helpers/fixTypes'

const Image: React.FC = () => {
  const data = useStaticQuery<GetImgQuery>(graphql`
    query GetImg {
      placeholderImage: file(relativePath: { eq: "images" }) {
        childImageSharp {
          fluid(maxWidth: 900) {
            ...GatsbyImageSharpFluid
          }
        }
      }
    }
  `)

  if (
    !data.placeholderImage ||
    !data.placeholderImage.childImageSharp ||
    !data.placeholderImage.childImageSharp.fluid
  ) {
    return null
  }

  return <Img fluid={fixCoverImage(data.placeholderImage).childImageSharp.fluid} />
}

export default Image
