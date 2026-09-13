const STYLES: Record<string, string> = {
  admin: 'bg-orange-100 text-orange-800',
  officer: 'bg-blue-100 text-blue-800',
  member: 'bg-emerald-100 text-emerald-800',
  pending_member: 'bg-amber-100 text-amber-800',
  non_member: 'bg-slate-200 text-slate-700',

  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
}

const LABELS: Record<string, string> = {
  pending_member: 'Pending Member',
  non_member: 'Non-member',
}

export function StatusBadge({ value }: { value: string }) {
  const style = STYLES[value] ?? 'bg-slate-200 text-slate-700'
  const label = LABELS[value] ?? value.charAt(0).toUpperCase() + value.slice(1)
  return <span className={`badge ${style}`}>{label}</span>
}
