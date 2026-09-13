import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import type { RankThreshold } from '../../types/database'

const emptyForm = { name: '', min_points: '' }

export function RankLadderTab() {
  const [ranks, setRanks] = useState<RankThreshold[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('rank_thresholds').select('*').order('min_points', { ascending: true })
    setRanks(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.min_points) return

    const payload = { name: form.name.trim(), min_points: Number(form.min_points) }

    if (editingId) {
      await supabase.from('rank_thresholds').update(payload).eq('id', editingId)
    } else {
      await supabase.from('rank_thresholds').insert(payload)
    }
    setForm(emptyForm)
    setEditingId(null)
    load()
  }

  function startEdit(rank: RankThreshold) {
    setEditingId(rank.id)
    setForm({ name: rank.name, min_points: rank.min_points.toString() })
  }

  async function remove(id: string) {
    await supabase.from('rank_thresholds').delete().eq('id', id)
    if (editingId === id) {
      setEditingId(null)
      setForm(emptyForm)
    }
    load()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-blue-100 bg-white p-6 shadow-sm sm:grid-cols-3">
        <h2 className="sm:col-span-3 text-lg font-bold text-blue-800">{editingId ? 'Edit Rank' : 'Add Rank'}</h2>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-blue-700">Rank Name</span>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Thespian (2-Star)"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-blue-700">Minimum Points</span>
          <input
            type="number"
            step="0.5"
            className="input"
            value={form.min_points}
            onChange={(e) => setForm({ ...form, min_points: e.target.value })}
          />
        </label>
        <div className="sm:col-span-3 flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-orange-500 px-4 py-2 font-semibold text-blue-900 hover:bg-orange-400"
          >
            {editingId ? 'Save Changes' : 'Add Rank'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null)
                setForm(emptyForm)
              }}
              className="rounded-md bg-blue-100 px-4 py-2 font-semibold text-blue-700 hover:bg-blue-200"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading && <p className="text-blue-500">Loading rank ladder…</p>}
      <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-blue-100 bg-blue-50 text-blue-600">
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Minimum Points</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {ranks.map((rank) => (
              <tr key={rank.id} className="border-b border-blue-50">
                <td className="px-4 py-2 font-medium text-blue-800">{rank.name}</td>
                <td className="px-4 py-2">{rank.min_points}</td>
                <td className="px-4 py-2 space-x-2">
                  <button onClick={() => startEdit(rank)} className="text-xs font-semibold text-blue-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => remove(rank.id)} className="text-xs font-semibold text-red-600 hover:underline">
                    Delete
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
