import '../styles/main.css'
import { Metadata } from 'next'
import { ThemeProvider } from '../contexts/ThemeContext'

export const metadata: Metadata = {
  title: {
    default: 'w11i.me',
    template: '%s | w11i.me',
  },
  description: 'Filip Wojciechowski personal blog',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="dark-theme">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
