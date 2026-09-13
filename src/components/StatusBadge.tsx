const STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
}

export function StatusBadge({ value }: { value: string }) {
  const style = STYLES[value] ?? 'bg-slate-200 text-slate-700'
  const label = value.charAt(0).toUpperCase() + value.slice(1)
  return <span className={`badge ${style}`}>{label}</span>
}
