import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { StatusBadge } from '../../components/StatusBadge'
import { CATEGORY_LABELS } from '../../types/database'
import type { EntryStatus, PointEntry, PointRole } from '../../types/database'

type EntryWithMember = PointEntry & {
  profiles: { full_name: string; email: string } | null
}

export function PointEntriesTab() {
  const { profile } = useAuth()
  const [entries, setEntries] = useState<EntryWithMember[]>([])
  const [roles, setRoles] = useState<PointRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<EntryStatus | 'all'>('pending')

  async function load() {
    setLoading(true)
    setError(null)
    const [{ data, error }, { data: roleData }] = await Promise.all([
      supabase
        .from('point_entries')
        .select('*, profiles!point_entries_user_id_fkey(full_name, email)')
        .order('activity_date', { ascending: false }),
      supabase.from('point_roles').select('*'),
    ])
    if (error) setError(error.message)
    setEntries((data as unknown as EntryWithMember[]) ?? [])
    setRoles(roleData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const roleMap = new Map(roles.map((r) => [r.id, r]))

  async function review(id: string, status: EntryStatus) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)))
    await supabase
      .from('point_entries')
      .update({ status, reviewed_by: profile?.id, reviewed_at: new Date().toISOString() })
      .eq('id', id)
  }

  async function updateBonus(id: string, bonus: number) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, bonus_points: bonus } : e)))
    await supabase.from('point_entries').update({ bonus_points: bonus }).eq('id', id)
  }

  const visible = filter === 'all' ? entries : entries.filter((e) => e.status === filter)

  if (loading) return <p className="text-blue-500">Loading point submissions…</p>

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1 text-sm font-semibold capitalize ${
              filter === f ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">Failed to load: {error}</p>}
      {visible.length === 0 && !error && <p className="text-blue-500">No entries in this view.</p>}

      <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-blue-100 bg-blue-50 text-blue-600">
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Category / Role</th>
              <th className="px-4 py-3">Base</th>
              <th className="px-4 py-3">Bonus</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((entry) => (
              <tr key={entry.id} className="border-b border-blue-50">
                <td className="px-4 py-2">
                  <p className="font-medium text-blue-800">{entry.profiles?.full_name || '—'}</p>
                  <p className="text-xs text-blue-500">{entry.profiles?.email}</p>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">{entry.activity_date}</td>
                <td className="px-4 py-2">
                  <p>{CATEGORY_LABELS[entry.category]}</p>
                  <p className="text-xs text-blue-500">
                    {entry.role_id && roleMap.get(entry.role_id)?.label}
                    {entry.level && ` ${entry.level}`}
                    {entry.hours != null && ` (${entry.hours} hrs)`}
                  </p>
                  {entry.production_title && <p className="text-xs text-blue-400">{entry.production_title}</p>}
                </td>
                <td className="px-4 py-2">{entry.base_points}</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    step="0.5"
                    value={entry.bonus_points}
                    onChange={(e) => updateBonus(entry.id, Number(e.target.value))}
                    className="input w-16 py-1"
                  />
                </td>
                <td className="px-4 py-2 font-semibold">{entry.total_points}</td>
                <td className="px-4 py-2">
                  <StatusBadge value={entry.status} />
                </td>
                <td className="px-4 py-2 space-x-2">
                  <button
                    disabled={entry.status === 'approved'}
                    onClick={() => review(entry.id, 'approved')}
                    className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-200 disabled:opacity-40"
                  >
                    Approve
                  </button>
                  <button
                    disabled={entry.status === 'rejected'}
                    onClick={() => review(entry.id, 'rejected')}
                    className="rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 hover:bg-red-200 disabled:opacity-40"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
