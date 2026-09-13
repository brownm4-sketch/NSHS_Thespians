import { useState } from 'react'
import { MembersTab } from './MembersTab'
import { PointEntriesTab } from './PointEntriesTab'
import { PointCatalogTab } from './PointCatalogTab'
import { RankLadderTab } from './RankLadderTab'

const TABS = [
  { id: 'members', label: 'Members' },
  { id: 'entries', label: 'Point Approval' },
  { id: 'catalog', label: 'Point Catalog' },
  { id: 'ranks', label: 'Rank Ladder' },
] as const

type TabId = (typeof TABS)[number]['id']

export function AdminPanel() {
  const [tab, setTab] = useState<TabId>('members')

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-blue-800">Admin Panel</h1>
      <div className="mb-6 flex flex-wrap gap-2 border-b border-blue-100">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-t-md px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id ? 'border-b-2 border-orange-500 text-orange-600' : 'text-blue-500 hover:text-blue-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'members' && <MembersTab />}
      {tab === 'entries' && <PointEntriesTab />}
      {tab === 'catalog' && <PointCatalogTab />}
      {tab === 'ranks' && <RankLadderTab />}
    </div>
  )
}
