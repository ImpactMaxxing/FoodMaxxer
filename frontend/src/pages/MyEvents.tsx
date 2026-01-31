import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { eventsApi } from '../lib/api'
import { Calendar, Users, Clock, Plus, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

export default function MyEvents() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['my-events'],
    queryFn: eventsApi.getMyEvents,
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="badge badge-gray">Draft</span>
      case 'open':
        return <span className="badge badge-green">Open</span>
      case 'confirmed':
        return <span className="badge badge-blue">Confirmed</span>
      case 'completed':
        return <span className="badge badge-gray">Completed</span>
      case 'cancelled':
        return <span className="badge badge-red">Cancelled</span>
      default:
        return <span className="badge badge-gray">{status}</span>
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
          <p className="text-gray-600 mt-1">Events you're hosting</p>
        </div>
        <Link to="/create-event" className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-1" />
          New Event
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : events?.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-500 mb-4">Host your first dinner party!</p>
          <Link to="/create-event" className="btn-primary">
            Create Event
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {events?.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="card hover:shadow-md transition-shadow block"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                    {getStatusBadge(event.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(new Date(event.event_date), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {format(new Date(event.event_date), 'h:mm a')}
                    </span>
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {event.confirmed_guest_count} / {event.max_guests} guests
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {event.available_spots > 0 && event.status === 'open' && (
                    <span className="text-sm text-green-600">
                      {event.available_spots} spots left
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
