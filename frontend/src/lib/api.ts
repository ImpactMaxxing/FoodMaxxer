import axios from 'axios'
import type {
  User,
  Event,
  EventListItem,
  EventCreate,
  RSVP,
  RSVPWithEvent,
  RSVPCreate,
  AuthResponse,
  ReferralStats,
  FoodItem,
  FoodItemCreate
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors - but not on login/register pages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginOrRegister = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
    
    if (error.response?.status === 401 && !isLoginOrRegister) {
      // Only clear and redirect if we aren't currently trying to authenticate
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: async (data: {
    email: string
    username: string
    password: string
    full_name?: string
    referral_code?: string
  }): Promise<User> => {
    const res = await api.post('/auth/register', data)
    return res.data
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)
    const res = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return res.data
  },

  getMe: async (token?: string): Promise<User> => {
  // Use the 'api' instance, NOT the raw 'axios'
    const res = await api.get('/auth/me', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    return res.data
  },
}

// Users
export const usersApi = {
  getProfile: async (): Promise<User> => {
    const res = await api.get('/users/me')
    return res.data
  },

  updateProfile: async (data: { full_name?: string; email?: string }): Promise<User> => {
    const res = await api.patch('/users/me', data)
    return res.data
  },

  getPublicProfile: async (userId: number): Promise<User> => {
    const res = await api.get(`/users/${userId}`)
    return res.data
  },
}

// Events
export const eventsApi = {
  list: async (params?: { status?: string; upcoming_only?: boolean }): Promise<EventListItem[]> => {
    const res = await api.get('/events', { params })
    return res.data
  },

  getMyEvents: async (): Promise<EventListItem[]> => {
    const res = await api.get('/events/my-events')
    return res.data
  },

  get: async (eventId: number): Promise<Event> => {
    const res = await api.get(`/events/${eventId}`)
    return res.data
  },

  create: async (data: EventCreate): Promise<Event> => {
    const res = await api.post('/events', data)
    return res.data
  },

  update: async (eventId: number, data: Partial<EventCreate>): Promise<Event> => {
    const res = await api.patch(`/events/${eventId}`, data)
    return res.data
  },

  confirm: async (eventId: number): Promise<Event> => {
    const res = await api.post(`/events/${eventId}/confirm`)
    return res.data
  },

  cancel: async (eventId: number): Promise<Event> => {
    const res = await api.post(`/events/${eventId}/cancel`)
    return res.data
  },

  complete: async (eventId: number): Promise<Event> => {
    const res = await api.post(`/events/${eventId}/complete`)
    return res.data
  },

  addFoodItem: async (eventId: number, data: FoodItemCreate): Promise<FoodItem> => {
    const res = await api.post(`/events/${eventId}/food-items`, data)
    return res.data
  },
}

// RSVPs
export const rsvpsApi = {
  create: async (data: RSVPCreate): Promise<RSVP> => {
    const res = await api.post('/rsvps', data)
    return res.data
  },

  getMyRsvps: async (): Promise<RSVPWithEvent[]> => {
    const res = await api.get('/rsvps/my-rsvps')
    return res.data
  },

  getEventRsvps: async (eventId: number): Promise<RSVP[]> => {
    const res = await api.get(`/rsvps/event/${eventId}`)
    return res.data
  },

  update: async (rsvpId: number, data: Partial<RSVPCreate>): Promise<RSVP> => {
    const res = await api.patch(`/rsvps/${rsvpId}`, data)
    return res.data
  },

  cancel: async (rsvpId: number): Promise<RSVP> => {
    const res = await api.post(`/rsvps/${rsvpId}/cancel`)
    return res.data
  },

  updateStatus: async (rsvpId: number, status: string): Promise<RSVP> => {
    const res = await api.post(`/rsvps/${rsvpId}/status`, { status })
    return res.data
  },
}

// Invites
export interface Invite {
  id: number
  user_id: number
  event_id: number
  username: string
  status: string
  invited_at: string
}

export const invitesApi = {
  create: async (eventId: number, username: string): Promise<Invite> => {
    const res = await api.post('/invites', { event_id: eventId, username })
    return res.data
  },

  getEventInvites: async (eventId: number): Promise<Invite[]> => {
    const res = await api.get(`/invites/event/${eventId}`)
    return res.data
  },

  getMyInvites: async (): Promise<Invite[]> => {
    const res = await api.get('/invites/my-invites')
    return res.data
  },

  accept: async (inviteId: number): Promise<{ message: string; status: string }> => {
    const res = await api.post(`/invites/${inviteId}/accept`)
    return res.data
  },

  decline: async (inviteId: number): Promise<{ message: string; status: string }> => {
    const res = await api.post(`/invites/${inviteId}/decline`)
    return res.data
  },
}

// Referrals
export const referralsApi = {
  getMyCode: async (): Promise<{ referral_code: string; referral_points: number }> => {
    const res = await api.get('/referrals/my-code')
    return res.data
  },

  getStats: async (): Promise<ReferralStats> => {
    const res = await api.get('/referrals/stats')
    return res.data
  },

  validate: async (code: string): Promise<{ valid: boolean; referrer_username?: string; message: string }> => {
    const res = await api.get(`/referrals/validate/${code}`)
    return res.data
  },
}

export default api
