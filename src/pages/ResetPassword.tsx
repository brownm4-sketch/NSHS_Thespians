import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function ResetPassword() {
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // The recovery link puts the user into a temporary "password recovery" session.
    // Supabase's client parses the URL and fires this event once that's ready.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    // If the session was already established by the time this page mounted, allow it too.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-blue-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-blue-800">Password Updated!</h1>
        <p className="mt-3 text-blue-600">You can now sign in with your new password.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-6 rounded-md bg-orange-500 px-4 py-2 font-semibold text-blue-900 hover:bg-orange-400"
        >
          Go to Dashboard
        </button>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-blue-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-blue-800">Reset Password</h1>
        <p className="mt-3 text-blue-600">
          This page only works when opened from the password reset link in your email. If you got here another
          way, request a new link from the{' '}
          <button onClick={() => navigate('/login')} className="font-semibold text-orange-600 hover:underline">
            login page
          </button>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-center text-3xl font-bold text-blue-800">Set a New Password</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-blue-100 bg-white p-8 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-blue-700">New Password</span>
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-blue-700">Confirm New Password</span>
          <input
            required
            type="password"
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-orange-500 px-4 py-2 font-semibold text-blue-900 transition-colors hover:bg-orange-400 disabled:opacity-50"
        >
          {submitting ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}
