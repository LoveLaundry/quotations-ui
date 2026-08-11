import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type FontSize = 'sm' | 'md' | 'lg'
export type Contrast = 'normal' | 'dark' | 'darkest'

interface ThemeSettings {
  fontSize: FontSize
  contrast: Contrast
  setFontSize: (s: FontSize) => void
  setContrast: (c: Contrast) => void
}

const ThemeContext = createContext<ThemeSettings>({
  fontSize: 'md',
  contrast: 'dark',
  setFontSize: () => {},
  setContrast: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

const FONT_SIZE_MAP: Record<FontSize, string> = {
  sm: '13px',
  md: '14px',
  lg: '15px',
}

const CONTRAST_MAP: Record<Contrast, { secondary: string; tertiary: string; muted: string }> = {
  normal:  { secondary: '#374151', tertiary: '#4B5563', muted: '#6B7280' },
  dark:    { secondary: '#1D2939', tertiary: '#344054', muted: '#475467' },
  darkest: { secondary: '#101828', tertiary: '#1D2939', muted: '#344054' },
}

function applyTheme(fontSize: FontSize, contrast: Contrast) {
  const root = document.documentElement
  root.style.setProperty('--body-font-size', FONT_SIZE_MAP[fontSize])
  const c = CONTRAST_MAP[contrast]
  root.style.setProperty('--text-secondary', c.secondary)
  root.style.setProperty('--text-tertiary', c.tertiary)
  root.style.setProperty('--text-muted', c.muted)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem('theme-font-size') as FontSize) || 'md'
  })
  const [contrast, setContrastState] = useState<Contrast>(() => {
    return (localStorage.getItem('theme-contrast') as Contrast) || 'dark'
  })

  useEffect(() => { applyTheme(fontSize, contrast) }, [fontSize, contrast])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { applyTheme(fontSize, contrast) }, [])

  const setFontSize = (s: FontSize) => {
    setFontSizeState(s)
    localStorage.setItem('theme-font-size', s)
  }

  const setContrast = (c: Contrast) => {
    setContrastState(c)
    localStorage.setItem('theme-contrast', c)
  }

  return (
    <ThemeContext.Provider value={{ fontSize, contrast, setFontSize, setContrast }}>
      {children}
    </ThemeContext.Provider>
  )
}
