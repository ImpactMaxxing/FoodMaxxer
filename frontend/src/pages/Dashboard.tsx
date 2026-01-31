import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { eventsApi, rsvpsApi } from '../lib/api'
import { format } from 'date-fns'

export default function Dashboard() {
  const { user } = useAuthStore()

  const { data: myEvents } = useQuery({
    queryKey: ['my-events'],
    queryFn: eventsApi.getMyEvents,
  })

  const { data: myRsvps } = useQuery({
    queryKey: ['my-rsvps'],
    queryFn: rsvpsApi.getMyRsvps,
  })

  const upcomingHostedEvents = myEvents?.filter(
    (e) => e.status === 'open' || e.status === 'confirmed'
  ) || []

  const upcomingRsvps = myRsvps?.filter(
    (r) => r.event_status === 'open' || r.event_status === 'confirmed'
  ) || []

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {user?.full_name || user?.username}
        </h1>
        <Link to="/create-event" className="btn-primary">+ Host Event</Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Your Upcoming Events */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-gray-800">Your Events</h2>
            {upcomingHostedEvents.length > 0 && (
              <Link to="/my-events" className="text-sm text-primary-600 hover:underline">View all →</Link>
            )}
          </div>

          {upcomingHostedEvents.length === 0 ? (
            <div className="card text-center py-6 text-gray-500 text-sm">
              No upcoming events.{' '}
              <Link to="/create-event" className="text-primary-600 hover:underline">Host one?</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingHostedEvents.slice(0, 3).map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="card block hover:border-primary-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-800">{event.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {format(new Date(event.event_date), 'MMM d, h:mm a')} · {event.confirmed_guest_count}/{event.max_guests} guests
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 ${
                      event.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Your RSVPs */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-gray-800">Your RSVPs</h2>
            {upcomingRsvps.length > 0 && (
              <Link to="/my-rsvps" className="text-sm text-primary-600 hover:underline">View all →</Link>
            )}
          </div>

          {upcomingRsvps.length === 0 ? (
            <div className="card text-center py-6 text-gray-500 text-sm">
              No upcoming RSVPs.{' '}
              <Link to="/events" className="text-primary-600 hover:underline">Find an event?</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingRsvps.slice(0, 3).map((rsvp) => (
                <Link
                  key={rsvp.id}
                  to={`/events/${rsvp.event_id}`}
                  className="card block hover:border-primary-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-800">{rsvp.event_title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {rsvp.event_date && format(new Date(rsvp.event_date), 'MMM d, h:mm a')}
                        {rsvp.bringing_food_item && ` · Bringing: ${rsvp.bringing_food_item}`}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 ${
                      rsvp.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      rsvp.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {rsvp.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Browse Events */}
      <div className="mt-6 text-center">
        <Link to="/events" className="btn-secondary">Browse All Events</Link>
      </div>
    </div>
  )
}
