export type EntryCategory = 'one_act' | 'full_length' | 'officer' | 'festival_event' | 'advocacy' | 'other'
export type EntryStatus = 'pending' | 'approved' | 'rejected'
export type RoleScope = 'show' | 'officer'

export const CATEGORY_LABELS: Record<EntryCategory, string> = {
  one_act: 'One Act Show',
  full_length: 'Full Length Show',
  officer: 'Officer',
  festival_event: 'Festival/Event Attendance',
  advocacy: 'Advocacy',
  other: 'Other',
}

export const LEVELS = ['School/Local', 'District/Regional', 'State', 'National', 'Other'] as const

export type Profile = {
  id: string
  email: string
  full_name: string
  graduation_year: number | null
  is_admin: boolean
  created_at: string
}

export type PointRole = {
  id: string
  scope: RoleScope
  label: string
  points_one_act: number | null
  points_full_length: number | null
  points_flat: number | null
  sort_order: number
  active: boolean
  created_at: string
}

export type RankThreshold = {
  id: string
  name: string
  min_points: number
  created_at: string
}

export type PointEntry = {
  id: string
  user_id: string
  category: EntryCategory
  role_id: string | null
  production_title: string
  activity_date: string
  level: string
  hours: number | null
  base_points: number
  bonus_points: number
  total_points: number
  status: EntryStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

/** Highest rank whose min_points the given total still clears, or null if below every rank. */
export function computeRank(totalPoints: number, ranks: RankThreshold[]): RankThreshold | null {
  const sorted = [...ranks].sort((a, b) => a.min_points - b.min_points)
  let current: RankThreshold | null = null
  for (const rank of sorted) {
    if (totalPoints >= rank.min_points) current = rank
    else break
  }
  return current
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string; email: string }
        Update: Partial<Profile>
        Relationships: []
      }
      point_roles: {
        Row: PointRole
        Insert: Partial<PointRole> & { scope: RoleScope; label: string }
        Update: Partial<PointRole>
        Relationships: []
      }
      rank_thresholds: {
        Row: RankThreshold
        Insert: Partial<RankThreshold> & { name: string; min_points: number }
        Update: Partial<RankThreshold>
        Relationships: []
      }
      point_entries: {
        Row: PointEntry
        Insert: Partial<PointEntry> & { user_id: string; category: EntryCategory; activity_date: string }
        Update: Partial<PointEntry>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
