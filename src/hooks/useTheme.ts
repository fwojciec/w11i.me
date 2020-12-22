import { useState } from 'react'

export function useTheme(defaultTheme: Theme): [Theme, () => void] {
  const otherTheme = defaultTheme === 'dark' ? 'light' : 'dark'

  let storedTheme = defaultTheme
  if (typeof window !== 'undefined') {
    storedTheme =
      window.localStorage.getItem('theme') === defaultTheme
        ? defaultTheme
        : otherTheme
  }
  const [theme, changeTheme] = useState<Theme>(storedTheme)

  function onThemeToggle() {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    changeTheme(newTheme)
    typeof window !== 'undefined' &&
      window.localStorage.setItem('theme', newTheme)
  }

  return [theme, onThemeToggle]
}
