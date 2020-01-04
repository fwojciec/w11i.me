interface MainMenuItem {
  title: string
  path: string
}

interface SiteMetaData {
  logoText: string
  defaultTheme: string
  copyrights: string
  mainMenu: MainMenuItem[]
}

interface PostLink {
  path: string
  title: string
}

interface CoverImageCredit {
  text: string
  url: string
}
