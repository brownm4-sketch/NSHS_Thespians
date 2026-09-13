import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { OFFICER_POSITIONS, PRIMARY_INTERESTS, SHIRT_SIZES } from '../types/database'

const emptyForm = {
  last_name: '',
  first_name: '',
  email: '',
  phone: '',
  graduation_year: '',
  shirt_size: '',
  primary_interest: '',
  theatre_classes: '',
  honor_groups: '',
}

export function Apply() {
  const [form, setForm] = useState(emptyForm)
  const [interestedInOfficer, setInterestedInOfficer] = useState<'yes' | 'no' | ''>('')
  const [officerPositions, setOfficerPositions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function togglePosition(position: string) {
    setOfficerPositions((prev) =>
      prev.includes(position) ? prev.filter((p) => p !== position) : [...prev, position],
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const gradYear = Number(form.graduation_year)
    if (
      !form.last_name.trim() ||
      !form.first_name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !gradYear ||
      !form.shirt_size ||
      !form.primary_interest ||
      !form.theatre_classes.trim() ||
      !form.honor_groups.trim() ||
      !interestedInOfficer
    ) {
      setError('Please fill in all fields.')
      return
    }

    setSubmitting(true)
    const { error } = await supabase.from('membership_applications').insert({
      ...form,
      graduation_year: gradYear,
      interested_in_officer: interestedInOfficer === 'yes',
      officer_positions: interestedInOfficer === 'yes' ? officerPositions : [],
    })
    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-blue-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-blue-800">Application Submitted!</h1>
        <p className="mt-3 text-blue-600">
          Thanks for applying to the Thespian Society. An officer will follow up with you soon.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-center text-3xl font-bold text-blue-800">Membership Application</h1>
      <p className="mb-6 text-center text-blue-500">Fill out the form below to apply for Thespian Society membership.</p>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-blue-100 bg-white p-8 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Last Name">
            <input className="input" value={form.last_name} onChange={(e) => update('last_name', e.target.value)} />
          </Field>
          <Field label="First Name">
            <input className="input" value={form.first_name} onChange={(e) => update('first_name', e.target.value)} />
          </Field>
          <Field label="Email (not your school email)">
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </Field>
          <Field label="Phone Number">
            <input
              type="tel"
              className="input"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
          </Field>
          <Field label="Graduation Year">
            <input
              type="number"
              className="input"
              placeholder="2027"
              value={form.graduation_year}
              onChange={(e) => update('graduation_year', e.target.value)}
            />
          </Field>
          <Field label="Shirt Size">
            <select className="input" value={form.shirt_size} onChange={(e) => update('shirt_size', e.target.value)}>
              <option value="" disabled>
                Select a size
              </option>
              {SHIRT_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Primary Interest">
          <select
            className="input"
            value={form.primary_interest}
            onChange={(e) => update('primary_interest', e.target.value)}
          >
            <option value="" disabled>
              Select an interest
            </option>
            {PRIMARY_INTERESTS.map((interest) => (
              <option key={interest} value={interest}>
                {interest}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Theatre classes completed or in progress (middle school and high school)">
          <textarea
            className="input"
            rows={3}
            value={form.theatre_classes}
            onChange={(e) => update('theatre_classes', e.target.value)}
          />
        </Field>

        <Field label="Thespian troupes, drama clubs, or theatre-related extracurriculars (middle school and high school)">
          <textarea
            className="input"
            rows={3}
            value={form.honor_groups}
            onChange={(e) => update('honor_groups', e.target.value)}
          />
        </Field>

        <fieldset>
          <legend className="mb-1 block text-sm font-medium text-blue-700">
            Are you interested in becoming an officer?
          </legend>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-blue-700">
              <input
                type="radio"
                name="interested"
                checked={interestedInOfficer === 'yes'}
                onChange={() => setInterestedInOfficer('yes')}
              />
              Yes
            </label>
            <label className="flex items-center gap-2 text-sm text-blue-700">
              <input
                type="radio"
                name="interested"
                checked={interestedInOfficer === 'no'}
                onChange={() => {
                  setInterestedInOfficer('no')
                  setOfficerPositions([])
                }}
              />
              No
            </label>
          </div>
        </fieldset>

        {interestedInOfficer === 'yes' && (
          <fieldset>
            <legend className="mb-1 block text-sm font-medium text-blue-700">
              Which position(s)? (choose all that apply)
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {OFFICER_POSITIONS.map((position) => (
                <label key={position} className="flex items-center gap-2 text-sm text-blue-700">
                  <input
                    type="checkbox"
                    checked={officerPositions.includes(position)}
                    onChange={() => togglePosition(position)}
                  />
                  {position}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-orange-500 px-4 py-2 font-semibold text-blue-900 transition-colors hover:bg-orange-400 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit Application'}
        </button>
      </form>
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
