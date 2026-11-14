import { useCallback, useEffect, useState } from 'react'

export type ThemeId = 'deck' | 'paper'

const KEY = 'chm-theme'

/** 'deck' needs no attribute: it is what the stylesheet declares on :root. */
function apply(theme: ThemeId) {
  const root = document.documentElement
  if (theme === 'paper') root.setAttribute('data-theme', 'paper')
  else root.removeAttribute('data-theme')
}

function stored(): ThemeId {
  try {
    return localStorage.getItem(KEY) === 'paper' ? 'paper' : 'deck'
  } catch {
    // Private mode, blocked storage: the default theme is still correct.
    return 'deck'
  }
}

/**
 * Flight deck (dark instrument console) or paper (the original flight-manual look).
 * Both themes are the same token names, so switching needs no component to know about it.
 */
export function useTheme(): { theme: ThemeId; setTheme: (t: ThemeId) => void; toggle: () => void } {
  const [theme, setThemeState] = useState<ThemeId>(stored)

  useEffect(() => {
    apply(theme)
  }, [theme])

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // Not being able to remember the choice is not a reason to refuse it.
    }
  }, [])

  return { theme, setTheme, toggle: () => setTheme(theme === 'deck' ? 'paper' : 'deck') }
}
