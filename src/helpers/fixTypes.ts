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

export function fixCoverImage(orig: CoverImageOriginal): CoverImageFixed {
  if (!orig.childImageSharp || !orig.childImageSharp.fluid) {
    throw new Error('Image is missing')
  }

  return {
    childImageSharp: {
      fluid: {
        base64: orig.childImageSharp.fluid.base64 || '',
        aspectRatio: orig.childImageSharp.fluid.aspectRatio || 1,
        sizes: orig.childImageSharp.fluid.sizes || '',
        src: orig.childImageSharp.fluid.src as string,
        srcSet: orig.childImageSharp.fluid.srcSet || ''
      }
    }
  }
}
