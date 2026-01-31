import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { eventsApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { format } from 'date-fns'

export default function Events() {
  const { isAuthenticated } = useAuthStore()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: events, isLoading } = useQuery({
    queryKey: ['events', statusFilter],
    queryFn: () => eventsApi.list({ status: statusFilter || undefined }),
  })

  const filteredEvents = events?.filter((event) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300">
        <h1 className="text-2xl font-bold text-gray-800">Events</h1>
        {isAuthenticated && (
          <Link to="/create-event" className="btn-primary">+ Host Event</Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-40"
        >
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="confirmed">Confirmed</option>
        </select>
      </div>

      {/* Events */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">
            {searchQuery ? 'No events match your search.' : 'No events yet.'}
          </p>
          {isAuthenticated && (
            <Link to="/create-event" className="btn-primary">Host an Event</Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="card block hover:border-primary-300"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{event.title}</h3>
                  <div className="text-sm text-gray-500 mt-1">
                    {format(new Date(event.event_date), 'EEE, MMM d · h:mm a')} · {event.location_name}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {event.confirmed_guest_count}/{event.max_guests} guests
                    {event.available_spots > 0 && event.status === 'open' && (
                      <span className="text-green-600 ml-2">
                        ({event.available_spots} spots left)
                      </span>
                    )}
                    {event.host_trust_score && (
                      <span className="ml-2">· Host score: {event.host_trust_score}</span>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 ${
                  event.status === 'open' ? 'bg-green-100 text-green-700' :
                  event.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                  event.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {event.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
