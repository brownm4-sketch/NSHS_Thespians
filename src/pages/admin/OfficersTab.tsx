import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import type { Officer } from '../../types/database'

const emptyForm = { title: '', name: '', description: '', contact_link: '', sort_order: 0 }

export function OfficersTab() {
  const [officers, setOfficers] = useState<Officer[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('officers').select('*').order('sort_order', { ascending: true })
    setOfficers(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.name.trim()) return

    if (editingId) {
      await supabase.from('officers').update(form).eq('id', editingId)
    } else {
      await supabase.from('officers').insert(form)
    }
    setForm(emptyForm)
    setEditingId(null)
    load()
  }

  function startEdit(officer: Officer) {
    setEditingId(officer.id)
    setForm({
      title: officer.title,
      name: officer.name,
      description: officer.description,
      contact_link: officer.contact_link,
      sort_order: officer.sort_order,
    })
  }

  async function remove(id: string) {
    await supabase.from('officers').delete().eq('id', id)
    if (editingId === id) {
      setEditingId(null)
      setForm(emptyForm)
    }
    load()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-blue-100 bg-white p-6 shadow-sm sm:grid-cols-2">
        <h2 className="sm:col-span-2 text-lg font-bold text-blue-800">
          {editingId ? 'Edit Officer' : 'Add Officer'}
        </h2>
        <input
          className="input"
          placeholder="Title (e.g. President)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          className="input"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <textarea
          className="input sm:col-span-2"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          className="input"
          placeholder="Contact link (mailto: or URL)"
          value={form.contact_link}
          onChange={(e) => setForm({ ...form, contact_link: e.target.value })}
        />
        <input
          className="input"
          type="number"
          placeholder="Sort order"
          value={form.sort_order}
          onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
        />
        <div className="sm:col-span-2 flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-orange-500 px-4 py-2 font-semibold text-blue-900 hover:bg-orange-400"
          >
            {editingId ? 'Save Changes' : 'Add Officer'}
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

      {loading && <p className="text-blue-500">Loading officers…</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {officers.map((officer) => (
          <div key={officer.id} className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-orange-600 uppercase">{officer.title}</p>
            <h3 className="text-lg font-bold text-blue-800">{officer.name}</h3>
            <p className="mt-1 text-sm text-blue-600">{officer.description}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => startEdit(officer)}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => remove(officer.id)}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
