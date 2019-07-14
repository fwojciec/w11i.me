import { ImageSharpFluid, Maybe } from '../generated/graphql'
import { FluidObject } from 'gatsby-image'

interface CoverImageOriginal {
  childImageSharp: Maybe<{
    fluid: Maybe<Pick<ImageSharpFluid, 'base64' | 'aspectRatio' | 'src' | 'srcSet' | 'sizes'>>
  }>
}

interface CoverImageFixed {
  childImageSharp: {
    fluid?: FluidObject | FluidObject[] | undefined
  }
}

export function fixCoverImage(orig: Maybe<CoverImageOriginal>): CoverImageFixed {
  if (!orig || !orig.childImageSharp || !orig.childImageSharp.fluid) {
    return {
      childImageSharp: { fluid: undefined }
    }
  }

  return {
    childImageSharp: {
      fluid: {
        base64: orig.childImageSharp.fluid.base64 || '',
        aspectRatio: orig.childImageSharp.fluid.aspectRatio || 1,
        sizes: orig.childImageSharp.fluid.sizes || '',
        src: orig.childImageSharp.fluid.src || '',
        srcSet: orig.childImageSharp.fluid.srcSet || ''
      }
    }
  }
}
