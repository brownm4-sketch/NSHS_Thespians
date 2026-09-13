import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { MembersTab } from './MembersTab'
import { PointEntriesTab } from './PointEntriesTab'
import { PointCatalogTab } from './PointCatalogTab'
import { RankLadderTab } from './RankLadderTab'
import { OfficersTab } from './OfficersTab'
import { ApplicationsTab } from './ApplicationsTab'

const ALL_TABS = [
  { id: 'members', label: 'Members', adminOnly: true },
  { id: 'entries', label: 'Point Approval', adminOnly: true },
  { id: 'catalog', label: 'Point Catalog', adminOnly: true },
  { id: 'ranks', label: 'Rank Ladder', adminOnly: true },
  { id: 'officers', label: 'Officers', adminOnly: false },
  { id: 'applications', label: 'Applications', adminOnly: true },
] as const

type TabId = (typeof ALL_TABS)[number]['id']

export function AdminPanel() {
  const { isAdmin } = useAuth()
  const [tab, setTab] = useState<TabId>('members')

  const tabs = ALL_TABS.filter((t) => isAdmin || !t.adminOnly)
  const activeTab = tabs.some((t) => t.id === tab) ? tab : tabs[0].id

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-blue-800">Admin Panel</h1>
      <div className="mb-6 flex flex-wrap gap-2 border-b border-blue-100">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-t-md px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === t.id
                ? 'border-b-2 border-orange-500 text-orange-600'
                : 'text-blue-500 hover:text-blue-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'members' && <MembersTab />}
      {activeTab === 'entries' && <PointEntriesTab />}
      {activeTab === 'catalog' && <PointCatalogTab />}
      {activeTab === 'ranks' && <RankLadderTab />}
      {activeTab === 'officers' && <OfficersTab />}
      {activeTab === 'applications' && <ApplicationsTab />}
    </div>
  )
}
