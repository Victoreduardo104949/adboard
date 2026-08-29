export type MediaType = 'image' | 'video'

export interface Group {
  id: string
  name: string
  created_at: string
}

export interface Ad {
  id: string
  title: string
  description: string | null
  media_type: MediaType
  media_url: string
  duration: number | null
  position: number
  is_active: boolean
  play_count?: number | null
  created_at: string
  updated_at: string
  ad_groups?: { groups: Pick<Group, 'name'> | null }[] | null
}

export interface Screen {
  id: string
  code: string
  name: string
  group_id: string | null
  is_active: boolean
  last_seen_at: string | null
  created_at: string
}
