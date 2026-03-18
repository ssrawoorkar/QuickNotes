import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Fetches /auth/me on mount.
 * Redirects to /login on 401.
 * @returns {{ user: object|null, loading: boolean }}
 */
export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    fetch('/auth/me', { credentials: 'include' })
      .then(res => {
        if (res.status === 401) {
          if (!cancelled) navigate('/login')
          return null
        }
        return res.json()
      })
      .then(data => {
        if (!cancelled && data) setUser(data)
      })
      .catch(() => {
        if (!cancelled) navigate('/login')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [navigate])

  return { user, loading }
}
