import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import Papa from 'papaparse'
import { supabase } from '../../lib/supabase'
import type { MembershipApplication } from '../../types/database'

const HEADER_MAP: Record<string, string> = {
  lastname: 'last_name',
  firstname: 'first_name',
  email: 'email',
  phone: 'phone',
  phonenumber: 'phone',
  graduationyear: 'graduation_year',
  gradyear: 'graduation_year',
  shirtsize: 'shirt_size',
  primaryinterest: 'primary_interest',
  interest: 'primary_interest',
  theatreclasses: 'theatre_classes',
  theaterclasses: 'theatre_classes',
  honorgroups: 'honor_groups',
  extracurricularensembles: 'honor_groups',
  interestedinofficer: 'interested_in_officer',
  officerinterest: 'interested_in_officer',
  officerpositions: 'officer_positions',
  position: 'officer_positions',
  positions: 'officer_positions',
}

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '')
}

type ImportRow = Omit<MembershipApplication, 'id' | 'submitted_at'>

function parseRow(row: Record<string, string>): ImportRow | null {
  const mapped: Record<string, string> = {}
  for (const [key, value] of Object.entries(row)) {
    const field = HEADER_MAP[normalizeHeader(key)]
    if (field) mapped[field] = (value ?? '').trim()
  }
  if (!mapped.last_name || !mapped.first_name || !mapped.email) return null

  return {
    last_name: mapped.last_name,
    first_name: mapped.first_name,
    email: mapped.email,
    phone: mapped.phone ?? '',
    graduation_year: mapped.graduation_year ? Number(mapped.graduation_year) : null,
    shirt_size: mapped.shirt_size ?? '',
    primary_interest: mapped.primary_interest ?? '',
    theatre_classes: mapped.theatre_classes ?? '',
    honor_groups: mapped.honor_groups ?? '',
    interested_in_officer: /^(y|yes|true|1)$/i.test(mapped.interested_in_officer ?? ''),
    officer_positions: mapped.officer_positions
      ? mapped.officer_positions
          .split(/[;,]/)
          .map((p) => p.trim())
          .filter(Boolean)
      : [],
  }
}

export function ApplicationsTab() {
  const [applications, setApplications] = useState<MembershipApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importSummary, setImportSummary] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('membership_applications')
      .select('*')
      .order('submitted_at', { ascending: false })
    setApplications(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDelete(id: string) {
    await supabase.from('membership_applications').delete().eq('id', id)
    load()
  }

  function handleCsvChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportSummary(null)

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data.map(parseRow).filter((r): r is ImportRow => r !== null)
        const skipped = results.data.length - rows.length

        let succeeded = 0
        const failures: string[] = []
        for (const row of rows) {
          const { error } = await supabase.from('membership_applications').insert(row)
          if (error) {
            failures.push(`${row.first_name} ${row.last_name}: ${error.message}`)
          } else {
            succeeded += 1
          }
        }

        let summary = `Imported ${succeeded} of ${rows.length} rows.`
        if (skipped > 0) summary += ` Skipped ${skipped} row(s) missing a name or email.`
        if (failures.length > 0) summary += ` Failures: ${failures.join('; ')}`
        setImportSummary(summary)
        setImporting(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
        load()
      },
      error: (error) => {
        setImportSummary(`Failed to read CSV: ${error.message}`)
        setImporting(false)
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-bold text-blue-800">Bulk Import from CSV</h2>
        <p className="mb-3 text-sm text-blue-600">
          Upload a CSV with columns matching (in any order): Last Name, First Name, Email, Phone, Graduation Year,
          Shirt Size, Primary Interest, Theatre Classes, Honor Groups, Interested in Officer (Yes/No), Officer
          Positions (comma-separated). Only Last Name, First Name, and Email are required.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleCsvChange}
          disabled={importing}
          className="input py-1.5"
        />
        {importing && <p className="mt-2 text-sm text-blue-500">Importing…</p>}
        {importSummary && <p className="mt-2 text-sm text-blue-700">{importSummary}</p>}
      </div>

      {loading && <p className="text-blue-500">Loading applications…</p>}
      {!loading && applications.length === 0 && <p className="text-blue-500">No applications yet.</p>}

      {applications.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-blue-100 bg-blue-50 text-blue-600">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Grad Year</th>
                <th className="px-4 py-3">Shirt</th>
                <th className="px-4 py-3">Interest</th>
                <th className="px-4 py-3">Officer Interest</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b border-blue-50 align-top">
                  <td className="px-4 py-2 font-medium text-blue-800">
                    {app.first_name} {app.last_name}
                  </td>
                  <td className="px-4 py-2 text-blue-500">
                    <p>{app.email}</p>
                    <p>{app.phone}</p>
                  </td>
                  <td className="px-4 py-2">{app.graduation_year}</td>
                  <td className="px-4 py-2">{app.shirt_size}</td>
                  <td className="px-4 py-2">{app.primary_interest}</td>
                  <td className="px-4 py-2">
                    {app.interested_in_officer ? (
                      <span>{app.officer_positions.join(', ') || 'Yes'}</span>
                    ) : (
                      <span className="text-blue-400">No</span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {new Date(app.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
