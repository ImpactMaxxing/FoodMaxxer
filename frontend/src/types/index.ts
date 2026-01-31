export interface User {
  id: number
  email: string
  username: string
  full_name: string | null
  trust_score: number
  events_hosted: number
  events_attended: number
  referral_code: string
  referral_points: number
  reliability_percentage: number
  can_host: boolean
  is_verified: boolean
  created_at: string
}

export interface UserPublic {
  id: number
  username: string
  full_name: string | null
  trust_score: number
  events_hosted: number
  events_attended: number
  reliability_percentage: number
}

export interface FoodItem {
  id: number
  name: string
  description: string | null
  quantity_needed: number
  quantity_claimed: number
  is_fully_claimed: boolean
  remaining_needed: number
}

export interface FoodItemCreate {
  name: string
  description?: string
  quantity_needed: number
}

export interface Event {
  id: number
  title: string
  description: string | null
  event_date: string
  location_name: string
  location_address: string | null
  location_notes: string | null
  max_guests: number
  reserved_spots: number
  min_guests: number
  rsvp_deadline: string
  confirmation_deadline: string
  status: EventStatus
  is_public: boolean
  host_id: number
  host_username: string | null
  host_trust_score: number | null
  available_spots: number
  confirmed_guest_count: number
  can_be_confirmed: boolean
  food_items: FoodItem[]
  created_at: string
}

export interface EventListItem {
  id: number
  title: string
  event_date: string
  location_name: string
  max_guests: number
  available_spots: number
  confirmed_guest_count: number
  status: EventStatus
  host_username: string | null
  host_trust_score: number | null
}

export type EventStatus = 'draft' | 'open' | 'confirmed' | 'cancelled' | 'completed'

export interface EventCreate {
  title: string
  description?: string
  event_date: string
  location_name: string
  location_address?: string
  location_notes?: string
  max_guests: number
  reserved_spots?: number
  min_guests?: number
  rsvp_deadline: string
  is_public?: boolean
  food_items?: FoodItemCreate[]
}

export interface RSVP {
  id: number
  user_id: number
  event_id: number
  status: RSVPStatus
  guest_count: number
  message: string | null
  bringing_food_item: string | null
  food_notes: string | null
  food_item_id: number | null
  is_reserved: boolean
  created_at: string
  confirmed_at: string | null
  user_username?: string
  user_trust_score?: number
  user_reliability?: number
}

export interface RSVPWithEvent extends RSVP {
  event_title: string | null
  event_date: string | null
  event_location: string | null
  event_status: EventStatus | null
}

export type RSVPStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'attended' | 'no_show'

export interface RSVPCreate {
  event_id: number
  guest_count?: number
  message?: string
  food_item_id?: number
  bringing_food_item?: string
  food_notes?: string
}

export interface ReferralStats {
  referral_code: string
  total_referrals: number
  total_points_earned: number
  referrals: Referral[]
}

export interface Referral {
  id: number
  referred_user_id: number
  referred_username: string
  referral_code_used: string
  bonus_awarded: boolean
  bonus_amount: number
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}
