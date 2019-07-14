import * as React from 'react'
import { useStaticQuery, graphql } from 'gatsby'
import Img from 'gatsby-image'
import { ImgQueryQuery } from '../generated/graphql'
import { fixCoverImage } from '../helpers/fixTypes'

/*
 * This component is built using `gatsby-image` to automatically serve optimized
 * images with lazy loading and reduced file sizes. The image is loaded using a
 * `StaticQuery`, which allows us to load the image from directly within this
 * component, rather than having to pass the image data down from pages.
 *
 * For more information, see the docs:
 * - `gatsby-image`: https://gatsby.app/gatsby-image
 * - `StaticQuery`: https://gatsby.app/staticquery
 */

interface Props {
  data: ImgQueryQuery
}

const Image: React.FC = () => {
  const data = useStaticQuery<ImgQueryQuery>(graphql`
    query ImgQuery {
      placeholderImage: file(relativePath: { eq: "images" }) {
        childImageSharp {
          fluid(maxWidth: 800) {
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
