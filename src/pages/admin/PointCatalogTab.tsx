import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import type { PointRole, RoleScope } from '../../types/database'

const emptyForm = {
  scope: 'show' as RoleScope,
  label: '',
  points_one_act: '',
  points_full_length: '',
  points_flat: '',
  sort_order: 0,
}

export function PointCatalogTab() {
  const [roles, setRoles] = useState<PointRole[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('point_roles').select('*').order('scope').order('sort_order')
    setRoles(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.label.trim()) return

    const payload = {
      scope: form.scope,
      label: form.label.trim(),
      points_one_act: form.scope === 'show' && form.points_one_act ? Number(form.points_one_act) : null,
      points_full_length: form.scope === 'show' && form.points_full_length ? Number(form.points_full_length) : null,
      points_flat: form.scope === 'officer' && form.points_flat ? Number(form.points_flat) : null,
      sort_order: Number(form.sort_order),
    }

    if (editingId) {
      await supabase.from('point_roles').update(payload).eq('id', editingId)
    } else {
      await supabase.from('point_roles').insert(payload)
    }
    setForm(emptyForm)
    setEditingId(null)
    load()
  }

  function startEdit(role: PointRole) {
    setEditingId(role.id)
    setForm({
      scope: role.scope,
      label: role.label,
      points_one_act: role.points_one_act?.toString() ?? '',
      points_full_length: role.points_full_length?.toString() ?? '',
      points_flat: role.points_flat?.toString() ?? '',
      sort_order: role.sort_order,
    })
  }

  async function toggleActive(role: PointRole) {
    await supabase.from('point_roles').update({ active: !role.active }).eq('id', role.id)
    load()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-blue-100 bg-white p-6 shadow-sm sm:grid-cols-2">
        <h2 className="sm:col-span-2 text-lg font-bold text-blue-800">{editingId ? 'Edit Role' : 'Add Role'}</h2>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-blue-700">Scope</span>
          <select
            className="input"
            value={form.scope}
            onChange={(e) => setForm({ ...form, scope: e.target.value as RoleScope })}
          >
            <option value="show">Show (One Act / Full Length)</option>
            <option value="officer">Officer</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-blue-700">Label</span>
          <input
            className="input"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Acting-Major"
          />
        </label>
        {form.scope === 'show' ? (
          <>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-blue-700">One Act Points</span>
              <input
                type="number"
                step="0.5"
                className="input"
                value={form.points_one_act}
                onChange={(e) => setForm({ ...form, points_one_act: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-blue-700">Full Length Points</span>
              <input
                type="number"
                step="0.5"
                className="input"
                value={form.points_full_length}
                onChange={(e) => setForm({ ...form, points_full_length: e.target.value })}
              />
            </label>
          </>
        ) : (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-blue-700">Points</span>
            <input
              type="number"
              step="0.5"
              className="input"
              value={form.points_flat}
              onChange={(e) => setForm({ ...form, points_flat: e.target.value })}
            />
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-blue-700">Sort Order</span>
          <input
            type="number"
            className="input"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
          />
        </label>
        <div className="sm:col-span-2 flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-orange-500 px-4 py-2 font-semibold text-blue-900 hover:bg-orange-400"
          >
            {editingId ? 'Save Changes' : 'Add Role'}
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

      {loading && <p className="text-blue-500">Loading catalog…</p>}
      <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-blue-100 bg-blue-50 text-blue-600">
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3">1A Pts</th>
              <th className="px-4 py-3">FL Pts</th>
              <th className="px-4 py-3">Flat Pts</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id} className={`border-b border-blue-50 ${!role.active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-2 capitalize">{role.scope}</td>
                <td className="px-4 py-2 font-medium text-blue-800">{role.label}</td>
                <td className="px-4 py-2">{role.points_one_act ?? '—'}</td>
                <td className="px-4 py-2">{role.points_full_length ?? '—'}</td>
                <td className="px-4 py-2">{role.points_flat ?? '—'}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => toggleActive(role)}
                    className={`text-xs font-semibold hover:underline ${role.active ? 'text-emerald-700' : 'text-blue-400'}`}
                  >
                    {role.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-2">
                  <button onClick={() => startEdit(role)} className="text-xs font-semibold text-blue-600 hover:underline">
                    Edit
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
