import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsApi, rsvpsApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Shield,
  ChefHat,
  Check,
  X,
  Loader2,
  AlertCircle,
  User,
  MessageSquare
} from 'lucide-react'
import { format } from 'date-fns'
import type { RSVPCreate } from '../types'

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuthStore()

  const [showRsvpForm, setShowRsvpForm] = useState(false)
  const [rsvpData, setRsvpData] = useState<Partial<RSVPCreate>>({
    guest_count: 1,
    message: '',
    food_item_id: undefined,
    bringing_food_item: '',
  })

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.get(Number(id)),
    enabled: !!id,
  })

  const { data: rsvps } = useQuery({
    queryKey: ['event-rsvps', id],
    queryFn: () => rsvpsApi.getEventRsvps(Number(id)),
    enabled: !!id && isAuthenticated,
  })

  const isHost = user?.id === event?.host_id
  const existingRsvp = rsvps?.find(
    (r) => r.user_id === user?.id && !['cancelled', 'declined'].includes(r.status)
  )

  const createRsvpMutation = useMutation({
    mutationFn: (data: RSVPCreate) => rsvpsApi.create(data),
    onSuccess: () => {
      toast.success('RSVP submitted!')
      queryClient.invalidateQueries({ queryKey: ['event', id] })
      queryClient.invalidateQueries({ queryKey: ['event-rsvps', id] })
      setShowRsvpForm(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to RSVP')
    },
  })

  const cancelRsvpMutation = useMutation({
    mutationFn: (rsvpId: number) => rsvpsApi.cancel(rsvpId),
    onSuccess: () => {
      toast.success('RSVP cancelled')
      queryClient.invalidateQueries({ queryKey: ['event', id] })
      queryClient.invalidateQueries({ queryKey: ['event-rsvps', id] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to cancel RSVP')
    },
  })

  const confirmEventMutation = useMutation({
    mutationFn: () => eventsApi.confirm(Number(id)),
    onSuccess: () => {
      toast.success('Event confirmed!')
      queryClient.invalidateQueries({ queryKey: ['event', id] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to confirm event')
    },
  })

  const cancelEventMutation = useMutation({
    mutationFn: () => eventsApi.cancel(Number(id)),
    onSuccess: () => {
      toast.success('Event cancelled')
      queryClient.invalidateQueries({ queryKey: ['event', id] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to cancel event')
    },
  })

  const updateRsvpStatusMutation = useMutation({
    mutationFn: ({ rsvpId, status }: { rsvpId: number; status: string }) =>
      rsvpsApi.updateStatus(rsvpId, status),
    onSuccess: () => {
      toast.success('RSVP status updated')
      queryClient.invalidateQueries({ queryKey: ['event-rsvps', id] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update RSVP')
    },
  })

  const handleSubmitRsvp = () => {
    if (!event) return
    createRsvpMutation.mutate({
      event_id: event.id,
      guest_count: rsvpData.guest_count || 1,
      message: rsvpData.message || undefined,
      food_item_id: rsvpData.food_item_id || undefined,
      bringing_food_item: rsvpData.bringing_food_item || undefined,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
        <p className="text-gray-500 mb-4">This event may have been removed or doesn't exist.</p>
        <Link to="/events" className="btn-primary">Browse Events</Link>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="badge badge-green text-base px-3 py-1">Open for RSVPs</span>
      case 'confirmed':
        return <span className="badge badge-blue text-base px-3 py-1">Confirmed</span>
      case 'completed':
        return <span className="badge badge-gray text-base px-3 py-1">Completed</span>
      case 'cancelled':
        return <span className="badge badge-red text-base px-3 py-1">Cancelled</span>
      default:
        return <span className="badge badge-gray text-base px-3 py-1">{status}</span>
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
          {getStatusBadge(event.status)}
        </div>

        {event.description && (
          <p className="text-gray-600 text-lg">{event.description}</p>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Event Details Card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-gray-500">
                    {format(new Date(event.event_date), 'h:mm a')}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{event.location_name}</p>
                  {event.location_address && (
                    <p className="text-gray-500">{event.location_address}</p>
                  )}
                  {event.location_notes && (
                    <p className="text-gray-500 text-sm mt-1">{event.location_notes}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start">
                <Users className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {event.confirmed_guest_count} / {event.max_guests} guests
                  </p>
                  <p className="text-gray-500">
                    {event.available_spots} spots available
                    {event.reserved_spots > 0 && ` (${event.reserved_spots} reserved)`}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Clock className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">RSVP Deadline</p>
                  <p className="text-gray-500">
                    {format(new Date(event.rsvp_deadline), 'MMMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Food Items */}
          {event.food_items.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ChefHat className="h-5 w-5 mr-2 text-primary-500" />
                What to Bring
              </h2>
              <div className="space-y-3">
                {event.food_items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      item.is_fully_claimed ? 'bg-green-50' : 'bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.description && (
                        <p className="text-sm text-gray-500">{item.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {item.is_fully_claimed ? (
                        <span className="text-green-600 flex items-center">
                          <Check className="h-4 w-4 mr-1" />
                          Claimed
                        </span>
                      ) : (
                        <span className="text-gray-500">
                          {item.quantity_claimed}/{item.quantity_needed} claimed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RSVPs (Host View) */}
          {isHost && rsvps && rsvps.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Guest RSVPs</h2>
              <div className="space-y-3">
                {rsvps.map((rsvp) => (
                  <div key={rsvp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{rsvp.user_username}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Shield className="h-3 w-3 mr-1" />
                            Trust: {rsvp.user_trust_score}
                          </span>
                          <span>|</span>
                          <span>{rsvp.user_reliability}% reliable</span>
                        </div>
                        {rsvp.bringing_food_item && (
                          <p className="text-sm text-gray-500">
                            Bringing: {rsvp.bringing_food_item}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`badge ${
                        rsvp.status === 'confirmed' ? 'badge-green' :
                        rsvp.status === 'pending' ? 'badge-yellow' :
                        rsvp.status === 'attended' ? 'badge-blue' :
                        'badge-gray'
                      }`}>
                        {rsvp.status}
                      </span>
                      {rsvp.status === 'pending' && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => updateRsvpStatusMutation.mutate({ rsvpId: rsvp.id, status: 'confirmed' })}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                            title="Confirm"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => updateRsvpStatusMutation.mutate({ rsvpId: rsvp.id, status: 'declined' })}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                            title="Decline"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Host Info */}
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Hosted by</h3>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{event.host_username}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <Shield className="h-4 w-4 mr-1 text-green-500" />
                  Trust Score: {event.host_trust_score}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isHost ? (
            <div className="card space-y-3">
              <h3 className="font-medium text-gray-900">Host Actions</h3>

              {event.status === 'open' && (
                <>
                  <button
                    onClick={() => confirmEventMutation.mutate()}
                    disabled={!event.can_be_confirmed || confirmEventMutation.isPending}
                    className="btn-primary w-full"
                  >
                    {confirmEventMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    ) : (
                      'Confirm Event'
                    )}
                  </button>
                  {!event.can_be_confirmed && (
                    <p className="text-sm text-gray-500 text-center">
                      Need {event.min_guests - event.confirmed_guest_count} more confirmed RSVPs
                    </p>
                  )}
                </>
              )}

              {['open', 'confirmed'].includes(event.status) && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this event?')) {
                      cancelEventMutation.mutate()
                    }
                  }}
                  disabled={cancelEventMutation.isPending}
                  className="btn-danger w-full"
                >
                  Cancel Event
                </button>
              )}
            </div>
          ) : isAuthenticated ? (
            <div className="card">
              {existingRsvp ? (
                <div className="text-center">
                  <div className={`badge ${
                    existingRsvp.status === 'confirmed' ? 'badge-green' :
                    existingRsvp.status === 'pending' ? 'badge-yellow' :
                    'badge-gray'
                  } mb-3`}>
                    RSVP: {existingRsvp.status}
                  </div>
                  {existingRsvp.bringing_food_item && (
                    <p className="text-sm text-gray-600 mb-3">
                      Bringing: {existingRsvp.bringing_food_item}
                    </p>
                  )}
                  {['pending', 'confirmed'].includes(existingRsvp.status) && (
                    <button
                      onClick={() => cancelRsvpMutation.mutate(existingRsvp.id)}
                      disabled={cancelRsvpMutation.isPending}
                      className="btn-secondary w-full"
                    >
                      Cancel RSVP
                    </button>
                  )}
                </div>
              ) : event.status === 'open' && event.available_spots > 0 ? (
                showRsvpForm ? (
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">RSVP to this event</h3>

                    <div>
                      <label className="label">Number of guests</label>
                      <select
                        value={rsvpData.guest_count}
                        onChange={(e) => setRsvpData({ ...rsvpData, guest_count: Number(e.target.value) })}
                        className="input"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    {event.food_items.filter(fi => !fi.is_fully_claimed).length > 0 && (
                      <div>
                        <label className="label">Claim a dish (optional)</label>
                        <select
                          value={rsvpData.food_item_id || ''}
                          onChange={(e) => setRsvpData({ ...rsvpData, food_item_id: e.target.value ? Number(e.target.value) : undefined })}
                          className="input"
                        >
                          <option value="">Select a dish...</option>
                          {event.food_items.filter(fi => !fi.is_fully_claimed).map((item) => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="label">Or bring something else</label>
                      <input
                        type="text"
                        value={rsvpData.bringing_food_item || ''}
                        onChange={(e) => setRsvpData({ ...rsvpData, bringing_food_item: e.target.value })}
                        className="input"
                        placeholder="e.g., Homemade pasta"
                      />
                    </div>

                    <div>
                      <label className="label">Message to host (optional)</label>
                      <textarea
                        value={rsvpData.message || ''}
                        onChange={(e) => setRsvpData({ ...rsvpData, message: e.target.value })}
                        className="input"
                        rows={2}
                        placeholder="Looking forward to it!"
                      />
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={handleSubmitRsvp}
                        disabled={createRsvpMutation.isPending}
                        className="btn-primary flex-1"
                      >
                        {createRsvpMutation.isPending ? (
                          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                        ) : (
                          'Submit RSVP'
                        )}
                      </button>
                      <button
                        onClick={() => setShowRsvpForm(false)}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRsvpForm(true)}
                    className="btn-primary w-full"
                  >
                    RSVP to this Event
                  </button>
                )
              ) : (
                <p className="text-center text-gray-500">
                  {event.status !== 'open'
                    ? 'This event is not accepting RSVPs'
                    : 'No spots available'}
                </p>
              )}
            </div>
          ) : (
            <div className="card text-center">
              <p className="text-gray-600 mb-3">Sign in to RSVP to this event</p>
              <Link to="/login" className="btn-primary w-full">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
