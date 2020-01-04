require('dotenv').config()
const postCssPresetEnv = require('postcss-preset-env')
const postCSSNested = require('postcss-nested')
const postCSSUrl = require('postcss-url')
const postCSSImports = require('postcss-import')
const cssnano = require('cssnano')
const postCSSMixins = require('postcss-mixins')

const siteAddress = new URL('https://w11i.me')

module.exports = {
  siteMetadata: {
    siteUrl: siteAddress.href,
    title: "Filip Wojciechowski's Blog",
    description: 'A personal blog featuring writing on my two hobbies: coding and books.',
    copyrights: `Text copyright @ ${new Date().getFullYear()}, Filip Wojciechowski`,
    author: 'Filip Wojciechowski',
    logoText: 'w11i',
    defaultTheme: 'dark',
    postsPerPage: 10,
    mainMenu: [{ title: 'About', path: '/about' }],
    image: '/images/blog_image2.jpg'
  },
  plugins: [
    'gatsby-plugin-typescript',
    'babel-preset-gatsby',
    'gatsby-plugin-sitemap',
    'gatsby-plugin-react-helmet',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'images',
        path: `${__dirname}/src/images`
      }
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'posts',
        path: `${__dirname}/src/posts`
      }
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'pages',
        path: `${__dirname}/src/pages`
      }
    },
    {
      resolve: 'gatsby-plugin-postcss',
      options: {
        postCssPlugins: [
          postCSSUrl(),
          postCSSImports(),
          postCSSMixins(),
          postCSSNested(),
          postCssPresetEnv({
            importFrom: 'src/styles/variables.css',
            stage: 1,
            preserve: false
          }),
          cssnano({
            preset: 'default'
          })
        ]
      }
    },
    'gatsby-transformer-sharp',
    'gatsby-plugin-sharp',
    {
      resolve: 'gatsby-transformer-remark',
      options: {
        plugins: [
          `gatsby-remark-smartypants`,
          {
            resolve: 'gatsby-remark-embed-video',
            options: {
              related: false,
              noIframeBorder: true
            }
          },
          {
            resolve: 'gatsby-remark-images',
            options: {
              maxWidth: 860,
              quality: 80,
              showCaptions: true,
              linkImagesToOriginal: false
            }
          },
          {
            resolve: 'gatsby-remark-prismjs',
            options: {
              classPrefix: 'language-',
              inlineCodeMarker: null,
              aliases: {},
              showLineNumbers: false,
              noInlineHighlight: false
            }
          }
        ]
      }
    },
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: "w11i's blog",
        short_name: 'w11i',
        start_url: '/',
        background_color: '#292a2d',
        theme_color: '#292a2d',
        display: 'minimal-ui',
        icon: 'src/images/w11i-icon.png'
      }
    },
    {
      resolve: 'gatsby-plugin-canonical-urls',
      options: {
        siteUrl: siteAddress.href.slice(0, -1)
      }
    }
  ]
}
