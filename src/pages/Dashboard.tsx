import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { StatusBadge } from '../components/StatusBadge'
import { CATEGORY_LABELS, LEVELS, computeRank } from '../types/database'
import type { EntryCategory, PointEntry, PointRole, RankThreshold } from '../types/database'

const SHOW_CATEGORIES: EntryCategory[] = ['one_act', 'full_length']
const HOURS_CATEGORIES: EntryCategory[] = ['festival_event', 'advocacy', 'other']

export function Dashboard() {
  const { profile } = useAuth()
  const [entries, setEntries] = useState<PointEntry[]>([])
  const [roles, setRoles] = useState<PointRole[]>([])
  const [ranks, setRanks] = useState<RankThreshold[]>([])
  const [loading, setLoading] = useState(true)

  const [category, setCategory] = useState<EntryCategory>('one_act')
  const [roleId, setRoleId] = useState('')
  const [productionTitle, setProductionTitle] = useState('')
  const [activityDate, setActivityDate] = useState('')
  const [level, setLevel] = useState('')
  const [hours, setHours] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function loadEntries(userId: string) {
    const { data } = await supabase
      .from('point_entries')
      .select('*')
      .eq('user_id', userId)
      .order('activity_date', { ascending: false })
    setEntries(data ?? [])
  }

  async function loadCatalog() {
    const [{ data: roleData }, { data: rankData }] = await Promise.all([
      supabase.from('point_roles').select('*').eq('active', true).order('sort_order', { ascending: true }),
      supabase.from('rank_thresholds').select('*').order('min_points', { ascending: true }),
    ])
    setRoles(roleData ?? [])
    setRanks(rankData ?? [])
  }

  useEffect(() => {
    if (!profile) return
    setLoading(true)
    Promise.all([loadEntries(profile.id), loadCatalog()]).then(() => setLoading(false))
  }, [profile])

  const roleOptions = useMemo(() => {
    if (category === 'officer') return roles.filter((r) => r.scope === 'officer')
    if (SHOW_CATEGORIES.includes(category)) return roles.filter((r) => r.scope === 'show')
    return []
  }, [category, roles])

  const roleMap = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles])

  function computeBasePoints(): number {
    if (category === 'one_act' || category === 'full_length') {
      const role = roleMap.get(roleId)
      if (!role) return 0
      return (category === 'one_act' ? role.points_one_act : role.points_full_length) ?? 0
    }
    if (category === 'officer') {
      return roleMap.get(roleId)?.points_flat ?? 0
    }
    const h = Number(hours)
    return h > 0 ? Math.round(h * 0.1 * 10) / 10 : 0
  }

  function resetForm() {
    setRoleId('')
    setProductionTitle('')
    setActivityDate('')
    setLevel('')
    setHours('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    setError(null)

    if (!activityDate) {
      setError('Please choose a date.')
      return
    }
    if ((category === 'one_act' || category === 'full_length' || category === 'officer') && !roleId) {
      setError('Please choose a role.')
      return
    }
    if (HOURS_CATEGORIES.includes(category) && (!level || !Number(hours))) {
      setError('Please choose a level and enter hours.')
      return
    }

    const basePoints = computeBasePoints()
    if (basePoints <= 0) {
      setError('This entry works out to 0 points — check your selections.')
      return
    }

    setSubmitting(true)
    const { error } = await supabase.from('point_entries').insert({
      user_id: profile.id,
      category,
      role_id: roleId || null,
      production_title: productionTitle.trim(),
      activity_date: activityDate,
      level,
      hours: HOURS_CATEGORIES.includes(category) ? Number(hours) : null,
      base_points: basePoints,
      status: 'pending',
    })
    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    resetForm()
    loadEntries(profile.id)
  }

  async function handleDelete(id: string) {
    if (!profile) return
    await supabase.from('point_entries').delete().eq('id', id)
    loadEntries(profile.id)
  }

  if (!profile) return <div className="py-20 text-center text-blue-500">Loading your profile…</div>

  const approvedPoints = entries
    .filter((e) => e.status === 'approved')
    .reduce((sum, e) => sum + Number(e.total_points), 0)
  const pendingPoints = entries.filter((e) => e.status === 'pending').reduce((sum, e) => sum + Number(e.total_points), 0)

  const currentRank = computeRank(approvedPoints, ranks)
  const sortedRanks = [...ranks].sort((a, b) => a.min_points - b.min_points)
  const nextRank = sortedRanks.find((r) => r.min_points > approvedPoints)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-blue-800">Welcome, {profile.full_name || profile.email}</h1>
        <p className="text-blue-500">Here's your Thespian Society rank and point log.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-blue-100 bg-white p-5 text-center shadow-sm">
          <p className="mb-2 text-xs font-semibold tracking-wide text-blue-500 uppercase">Member Status</p>
          <StatusBadge value={profile.role} />
        </div>
        <div className="rounded-xl border border-blue-100 bg-white p-5 text-center shadow-sm">
          <p className="mb-2 text-xs font-semibold tracking-wide text-blue-500 uppercase">Current Rank</p>
          <p className="text-lg font-bold text-orange-600">{currentRank?.name ?? 'Not Yet Honored'}</p>
        </div>
      </section>

      <section className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold text-blue-800">Total Points</h2>
          <p className="text-blue-600">
            <span className="text-2xl font-bold text-orange-600">{approvedPoints}</span> approved
            {pendingPoints > 0 && <span className="ml-2 text-sm text-amber-600">({pendingPoints} pending review)</span>}
          </p>
        </div>
        {nextRank && (
          <p className="mt-2 text-sm text-blue-500">
            {(nextRank.min_points - approvedPoints).toFixed(1)} more point(s) to reach{' '}
            <span className="font-semibold">{nextRank.name}</span>.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-blue-800">Log New Points</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-blue-700">Category</span>
              <select
                className="input"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as EntryCategory)
                  setRoleId('')
                  setLevel('')
                  setHours('')
                }}
              >
                {(Object.keys(CATEGORY_LABELS) as EntryCategory[]).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-blue-700">Date</span>
              <input
                type="date"
                className="input"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
              />
            </label>
          </div>

          {(category === 'one_act' || category === 'full_length' || category === 'officer') && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-blue-700">Role</span>
              <select className="input" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
                <option value="">Select a role</option>
                {roleOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                    {category !== 'officer' &&
                      ` (${(category === 'one_act' ? r.points_one_act : r.points_full_length) ?? 0} pts)`}
                    {category === 'officer' && ` (${r.points_flat ?? 0} pts)`}
                  </option>
                ))}
              </select>
            </label>
          )}

          {HOURS_CATEGORIES.includes(category) && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-blue-700">Level</span>
                <select className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="">Select a level</option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-blue-700">Hours</span>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  className="input"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="Points = hours × 0.1"
                />
              </label>
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-blue-700">
              {SHOW_CATEGORIES.includes(category) ? 'Production Title' : 'Description'}
            </span>
            <input
              className="input"
              value={productionTitle}
              onChange={(e) => setProductionTitle(e.target.value)}
              placeholder={SHOW_CATEGORIES.includes(category) ? 'Sister Act' : 'What did you do?'}
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-orange-500 px-4 py-2 font-semibold text-blue-900 transition-colors hover:bg-orange-400 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Add Entry'}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </section>

      <section className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-blue-800">Point Log</h2>
        {loading && <p className="text-blue-500">Loading entries…</p>}
        {!loading && entries.length === 0 && <p className="text-blue-500">No points logged yet.</p>}
        {entries.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-blue-100 text-blue-500">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Details</th>
                  <th className="py-2 pr-4">Points</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-blue-50">
                    <td className="py-2 pr-4 whitespace-nowrap">{entry.activity_date}</td>
                    <td className="py-2 pr-4">{CATEGORY_LABELS[entry.category]}</td>
                    <td className="py-2 pr-4">
                      {entry.role_id && roleMap.get(entry.role_id)?.label}
                      {entry.level && ` — ${entry.level}`}
                      {entry.hours != null && ` (${entry.hours} hrs)`}
                      {entry.production_title && (
                        <span className="block text-xs text-blue-500">{entry.production_title}</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">{entry.total_points}</td>
                    <td className="py-2 pr-4">
                      <StatusBadge value={entry.status} />
                    </td>
                    <td className="py-2 pr-4">
                      {entry.status === 'pending' && (
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-xs font-semibold text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
