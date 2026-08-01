import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from './AuthContext'

export function LoginPage() {
  const { session, loading } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-wood-dark">
        <p className="font-heading text-2xl text-gold-glow">Loading…</p>
      </div>
    )
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setSubmitting(true)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for a confirmation link!')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      }
    }

    setSubmitting(false)
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-wood-dark p-4">
      <div className="w-full max-w-sm rounded-xl border-2 border-wood-light bg-wood p-8 shadow-lg">
        <h1 className="mb-2 text-center font-heading text-4xl text-gold-glow">
          Cozaria
        </h1>
        <p className="mb-6 text-center font-body text-sm text-parchment">
          {mode === 'login' ? 'Welcome back, scholar!' : 'Join the library!'}
        </p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-wood-light bg-parchment-light px-4 py-2.5 font-body text-sm font-semibold text-wood-dark transition hover:bg-parchment"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-wood-light" />
          <span className="font-body text-xs text-parchment">or</span>
          <div className="h-px flex-1 bg-wood-light" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-wood-light bg-parchment-light px-4 py-2.5 font-body text-sm text-wood-dark placeholder:text-brick outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-wood-light bg-parchment-light px-4 py-2.5 font-body text-sm text-wood-dark placeholder:text-brick outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          />

          {error && (
            <p className="rounded bg-mahogany/20 px-3 py-2 font-body text-xs text-mahogany">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded bg-green/20 px-3 py-2 font-body text-xs text-green">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-gold px-4 py-2.5 font-heading text-sm font-bold text-wood-dark transition hover:bg-gold-glow disabled:opacity-50"
          >
            {submitting
              ? 'Please wait…'
              : mode === 'login'
                ? 'Log In'
                : 'Sign Up'}
          </button>
        </form>

        <p className="mt-4 text-center font-body text-xs text-parchment">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError(null)
              setMessage(null)
            }}
            className="font-semibold text-gold underline-offset-2 hover:underline"
          >
            {mode === 'login' ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  )
}
