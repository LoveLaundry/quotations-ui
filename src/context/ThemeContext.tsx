import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type FontSize = 'sm' | 'md' | 'lg'
export type ThemePreset = 'light' | 'contrast' | 'dark'

interface ThemeSettings {
  fontSize: FontSize
  theme: ThemePreset
  setFontSize: (s: FontSize) => void
  setTheme: (t: ThemePreset) => void
}

const ThemeContext = createContext<ThemeSettings>({
  fontSize: 'md',
  theme: 'light',
  setFontSize: () => {},
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

const FONT_SIZE_MAP: Record<FontSize, string> = {
  sm: '13px',
  md: '14px',
  lg: '15px',
}

const FONT_ZOOM_MAP: Record<FontSize, number> = {
  sm: 0.92,
  md: 1,
  lg: 1.08,
}

const THEME_ATTR = 'data-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem('theme-font-size') as FontSize) || 'md'
  })
  const [theme, setThemeState] = useState<ThemePreset>(() => {
    return (localStorage.getItem('theme-preset') as ThemePreset) || 'light'
  })

  useEffect(() => {
    document.documentElement.style.setProperty('--body-font-size', FONT_SIZE_MAP[fontSize])
    document.documentElement.style.setProperty('--body-font-zoom', String(FONT_ZOOM_MAP[fontSize]))
  }, [fontSize])

  useEffect(() => {
    document.documentElement.setAttribute(THEME_ATTR, theme)
    localStorage.setItem('theme-preset', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--body-font-size', FONT_SIZE_MAP[fontSize])
    document.documentElement.style.setProperty('--body-font-zoom', String(FONT_ZOOM_MAP[fontSize]))
    document.documentElement.setAttribute(THEME_ATTR, theme)
  }, [])

  const setFontSize = (s: FontSize) => {
    setFontSizeState(s)
    localStorage.setItem('theme-font-size', s)
  }

  const setTheme = (t: ThemePreset) => {
    setThemeState(t)
  }

  return (
    <ThemeContext.Provider value={{ fontSize, theme, setFontSize, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
