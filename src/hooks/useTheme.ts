import { useState } from 'react'

export function useTheme(defaultTheme: string): [string, () => void] {
  let storedTheme: string | null = null
  if (typeof window !== 'undefined') {
    storedTheme = window.localStorage.getItem('theme')
  }
  const [theme, changeTheme] = useState(storedTheme || defaultTheme)
  const onChangeTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    changeTheme(newTheme)
    typeof window !== 'undefined' && window.localStorage.setItem('theme', newTheme)
  }
  return [theme, onChangeTheme]
}
