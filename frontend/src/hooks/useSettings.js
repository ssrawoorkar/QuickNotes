import { useState, useCallback } from 'react'

const STORAGE_KEY = 'qn_settings'

const DEFAULTS = {
  chunkDuration:      '45',
  summarizeInterval:  '45',
  rollingWindow:      '150',
  summarizeOnStop:    true,
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
