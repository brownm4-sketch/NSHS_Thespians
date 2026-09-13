import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Officer } from '../types/database'

export function Officers() {
  const [officers, setOfficers] = useState<Officer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('officers')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setOfficers(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-blue-800">Troupe Officers</h1>
      {loading && <p className="text-blue-500">Loading officers…</p>}
      {!loading && officers.length === 0 && <p className="text-blue-500">Officer information will be posted here soon.</p>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {officers.map((officer) => (
          <div key={officer.id} className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold tracking-wide text-orange-600 uppercase">{officer.title}</p>
            <h2 className="mt-1 text-xl font-bold text-blue-800">{officer.name}</h2>
            <p className="mt-3 text-sm text-blue-600">{officer.description}</p>
            {officer.contact_link && (
              <a
                href={officer.contact_link}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-orange-600"
              >
                Contact &rarr;
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
