import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../types/database'

export function MembersTab() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('full_name', { ascending: true })
    setProfiles(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function updateProfile(id: string, patch: Partial<Profile>) {
    setSavingId(id)
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    await supabase.from('profiles').update(patch).eq('id', id)
    setSavingId(null)
  }

  if (loading) return <p className="text-blue-500">Loading members…</p>

  return (
    <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-blue-100 bg-blue-50 text-blue-600">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Grad Year</th>
            <th className="px-4 py-3">Admin</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => (
            <tr key={p.id} className={`border-b border-blue-50 ${savingId === p.id ? 'opacity-60' : ''}`}>
              <td className="px-4 py-2 font-medium text-blue-800">{p.full_name || '—'}</td>
              <td className="px-4 py-2 text-blue-500">{p.email}</td>
              <td className="px-4 py-2">
                <input
                  type="number"
                  value={p.graduation_year ?? ''}
                  onChange={(e) =>
                    updateProfile(p.id, { graduation_year: e.target.value ? Number(e.target.value) : null })
                  }
                  className="input w-24 py-1"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="checkbox"
                  checked={p.is_admin}
                  onChange={(e) => updateProfile(p.id, { is_admin: e.target.checked })}
                  className="h-4 w-4"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
