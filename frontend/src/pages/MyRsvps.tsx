import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rsvpsApi } from '../lib/api'
import toast from 'react-hot-toast'
import { Calendar, MapPin, Clock, Users, Loader2, X } from 'lucide-react'
import { format } from 'date-fns'

export default function MyRsvps() {
  const queryClient = useQueryClient()

  const { data: rsvps, isLoading } = useQuery({
    queryKey: ['my-rsvps'],
    queryFn: rsvpsApi.getMyRsvps,
  })

  const cancelRsvpMutation = useMutation({
    mutationFn: (rsvpId: number) => rsvpsApi.cancel(rsvpId),
    onSuccess: () => {
      toast.success('RSVP cancelled')
      queryClient.invalidateQueries({ queryKey: ['my-rsvps'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to cancel RSVP')
    },
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-yellow">Pending</span>
      case 'confirmed':
        return <span className="badge badge-green">Confirmed</span>
      case 'declined':
        return <span className="badge badge-red">Declined</span>
      case 'cancelled':
        return <span className="badge badge-gray">Cancelled</span>
      case 'attended':
        return <span className="badge badge-blue">Attended</span>
      case 'no_show':
        return <span className="badge badge-red">No Show</span>
      default:
        return <span className="badge badge-gray">{status}</span>
    }
  }

  const upcomingRsvps = rsvps?.filter(
    (r) => ['pending', 'confirmed'].includes(r.status) &&
           ['open', 'confirmed'].includes(r.event_status || '')
  ) || []

  const pastRsvps = rsvps?.filter(
    (r) => !['pending', 'confirmed'].includes(r.status) ||
           !['open', 'confirmed'].includes(r.event_status || '')
  ) || []

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My RSVPs</h1>
        <p className="text-gray-600 mt-1">Events you've signed up for</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : rsvps?.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No RSVPs yet</h3>
          <p className="text-gray-500 mb-4">Browse events and RSVP to join a dinner party!</p>
          <Link to="/events" className="btn-primary">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming RSVPs */}
          {upcomingRsvps.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming</h2>
              <div className="space-y-4">
                {upcomingRsvps.map((rsvp) => (
                  <div key={rsvp.id} className="card">
                    <div className="flex items-start justify-between">
                      <Link to={`/events/${rsvp.event_id}`} className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600">
                            {rsvp.event_title}
                          </h3>
                          {getStatusBadge(rsvp.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          {rsvp.event_date && (
                            <>
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {format(new Date(rsvp.event_date), 'MMM d, yyyy')}
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {format(new Date(rsvp.event_date), 'h:mm a')}
                              </span>
                            </>
                          )}
                          {rsvp.event_location && (
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {rsvp.event_location}
                            </span>
                          )}
                        </div>
                        {rsvp.bringing_food_item && (
                          <p className="text-sm text-gray-600 mt-2">
                            Bringing: <span className="font-medium">{rsvp.bringing_food_item}</span>
                          </p>
                        )}
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          if (confirm('Are you sure you want to cancel this RSVP?')) {
                            cancelRsvpMutation.mutate(rsvp.id)
                          }
                        }}
                        disabled={cancelRsvpMutation.isPending}
                        className="text-gray-400 hover:text-red-500 p-2"
                        title="Cancel RSVP"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past RSVPs */}
          {pastRsvps.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Past</h2>
              <div className="space-y-4">
                {pastRsvps.map((rsvp) => (
                  <Link
                    key={rsvp.id}
                    to={`/events/${rsvp.event_id}`}
                    className="card hover:shadow-md transition-shadow block opacity-75"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {rsvp.event_title}
                          </h3>
                          {getStatusBadge(rsvp.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          {rsvp.event_date && (
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {format(new Date(rsvp.event_date), 'MMM d, yyyy')}
                            </span>
                          )}
                          {rsvp.event_location && (
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {rsvp.event_location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
