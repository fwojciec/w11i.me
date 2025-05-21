import '../styles/main.css'
import { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'

export const metadata: Metadata = {
  metadataBase: new URL('https://w11i.me'),
  title: {
    default: 'w11i.me',
    template: '%s | w11i.me',
  },
  description:
    'Personal blog about software development, TypeScript, Python, Go, and web technologies by Filip Wojciechowski',
  keywords: [
    'software development',
    'typescript',
    'python',
    'go',
    'javascript',
    'web development',
    'programming',
  ],
  authors: [{ name: 'Filip Wojciechowski', url: 'https://w11i.me' }],
  creator: 'Filip Wojciechowski',
  publisher: 'Filip Wojciechowski',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://w11i.me',
    siteName: 'w11i.me',
    title: 'w11i.me - Filip Wojciechowski',
    description:
      'Personal blog about software development, TypeScript, Python, Go, and web technologies',
    images: [
      {
        url: '/images/thumb_fb.png',
        width: 1200,
        height: 630,
        alt: 'w11i.me - Filip Wojciechowski Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'w11i.me - Filip Wojciechowski',
    description:
      'Personal blog about software development, TypeScript, Python, Go, and web technologies',
    creator: '@filipcodes',
    images: ['/images/thumb_tw.png'],
  },
  alternates: {
    canonical: 'https://w11i.me',
    types: {
      'application/rss+xml': [{ url: '/rss.xml', title: 'w11i.me RSS Feed' }],
    },
  },
  category: 'Technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <meta name="theme-color" content="#292a2d" />
        <meta name="color-scheme" content="dark light" />
      </head>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="dark">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
