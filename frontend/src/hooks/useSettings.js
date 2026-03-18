import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'qn_settings'

const DEFAULTS = {
  chunkDuration:      '45',
  summarizeInterval:  '45',
  rollingWindow:      '150',
  summarizeOnStop:    true,
  theme:              'dark',
}

/**
 * Load/save settings to localStorage.
 * @returns {{ settings: object, update: function, save: function }}
 */
export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return { ...DEFAULTS, ...JSON.parse(stored) }
      }
    } catch {
      // ignore parse errors
    }
    return { ...DEFAULTS }
  })

  const update = useCallback((patch) => {
    setSettings(prev => ({ ...prev, ...patch }))
  }, [])

  const save = useCallback((overrides) => {
    const next = overrides ? { ...settings, ...overrides } : settings
    setSettings(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore storage errors
    }
    return next
  }, [settings])

  return { settings, update, save }
}

/**
 * Reads theme from localStorage and stamps data-theme on <html>.
 * Call once at the app root so every page respects the saved theme.
 */
export function useTheme() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem('qn_settings')
      const theme = stored ? (JSON.parse(stored).theme || 'dark') : 'dark'
      document.documentElement.setAttribute('data-theme', theme)
    } catch {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])
}
