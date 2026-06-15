import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setStoredSession } from '@/lib/auth'
import { useAuthStore } from '@/store'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const { initialize } = useAuthStore()
  const [error, setError] = useState('')

  useEffect(() => {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    if (access_token && refresh_token) {
      setStoredSession({ access_token, refresh_token })
      initialize().then(() => navigate('/')).catch(() => {
        setError('Failed to complete sign in')
      })
    } else {
      setError('Invalid authentication callback')
    }
  }, [initialize, navigate])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-app">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
    </div>
  )
}
