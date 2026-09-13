import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [fullName, setFullName] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setSubmitting(false)
      if (error) return setError(error.message)
      navigate('/dashboard')
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, graduation_year: graduationYear } },
      })
      setSubmitting(false)
      if (error) return setError(error.message)
      setInfo('Account created! Check your email to confirm, then sign in.')
      setMode('signin')
      setFullName('')
      setGraduationYear('')
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-center text-3xl font-bold text-blue-800">
        {mode === 'signin' ? 'Student Login' : 'Create Account'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-blue-100 bg-white p-8 shadow-sm">
        {mode === 'signup' && (
          <>
            <Field label="Full Name">
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input"
                placeholder="Jane Doe"
              />
            </Field>
            <Field label="Graduation Year">
              <input
                required
                type="number"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                className="input"
                placeholder="2027"
              />
            </Field>
          </>
        )}
        <Field label="Email">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@school.edu"
          />
        </Field>
        <Field label="Password">
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-emerald-600">{info}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-blue-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
        >
          {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-blue-600">
        {mode === 'signin' ? (
          <>
            Need an account?{' '}
            <button className="font-semibold text-orange-600 hover:underline" onClick={() => setMode('signup')}>
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button className="font-semibold text-orange-600 hover:underline" onClick={() => setMode('signin')}>
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-blue-700">{label}</span>
      {children}
    </label>
  )
}
