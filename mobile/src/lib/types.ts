export type MediaType = 'image' | 'video'

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
}

export interface VerifyScreenResult {
  valid: boolean
  screen_id: string | null
  name: string | null
  is_active: boolean | null
}
