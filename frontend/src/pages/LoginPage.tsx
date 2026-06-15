import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Mail, Lock, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store'
import { Button, Card, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, loginWithGoogle, loading, error } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  const displayError = localError || error

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <CardTitle>Sign in to TechShield AI</CardTitle>
          <CardDescription>Enterprise security and AI productivity platform</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
          {displayError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {displayError}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            leftIcon={<Mail className="h-4 w-4" />}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            leftIcon={<Lock className="h-4 w-4" />}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
          </Button>

          <Button type="button" variant="secondary" className="w-full" onClick={loginWithGoogle} disabled={loading}>
            Continue with Google
          </Button>

          <p className="text-center text-sm text-app-muted">
            No account?{' '}
            <Link to="/register" className="font-medium text-brand-600 hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </Card>
    </div>
  )
}
