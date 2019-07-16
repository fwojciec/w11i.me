import { ImageSharpFluid, Maybe } from '../generated/graphql'
import { FluidObject } from 'gatsby-image'

interface CoverImageOriginal {
  childImageSharp: Maybe<{
    fluid: Maybe<Pick<ImageSharpFluid, 'base64' | 'aspectRatio' | 'src' | 'srcSet' | 'sizes'>>
  }>
}

interface CoverImageFixed {
  childImageSharp: {
    fluid: FluidObject | FluidObject[] | undefined
  }
}

export function fixCoverImage(orig: CoverImageOriginal): CoverImageFixed {
  if (!orig.childImageSharp || !orig.childImageSharp.fluid) {
    throw new Error('Image is missing')
  }

  if (
    typeof orig.childImageSharp.fluid.aspectRatio !== 'number' ||
    typeof orig.childImageSharp.fluid.sizes !== 'string' ||
    typeof orig.childImageSharp.fluid.src !== 'string' ||
    typeof orig.childImageSharp.fluid.srcSet !== 'string'
  ) {
    throw new Error('Fluid object returned from GraphQL is missing required properties')
  }

  return {
    childImageSharp: {
      fluid: {
        base64: orig.childImageSharp.fluid.base64 || undefined,
        aspectRatio: orig.childImageSharp.fluid.aspectRatio,
        sizes: orig.childImageSharp.fluid.sizes,
        src: orig.childImageSharp.fluid.src,
        srcSet: orig.childImageSharp.fluid.srcSet
      }
    }
  }
}
