import { Link } from 'react-router-dom'
import { Calendar, Clock, MapPin, Users, Shield } from 'lucide-react'
import { format } from 'date-fns'
import type { EventListItem } from '../types'

interface EventCardProps {
  event: EventListItem
}

export default function EventCard({ event }: EventCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
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
    <Link
      to={`/events/${event.id}`}
      className="card hover:shadow-lg transition-shadow block"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {event.title}
        </h3>
        {getStatusBadge(event.status)}
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center text-gray-600">
          <Calendar className="h-5 w-5 mr-2 text-gray-400 flex-shrink-0" />
          <span>{format(new Date(event.event_date), 'EEEE, MMMM d')}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Clock className="h-5 w-5 mr-2 text-gray-400 flex-shrink-0" />
          <span>{format(new Date(event.event_date), 'h:mm a')}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <MapPin className="h-5 w-5 mr-2 text-gray-400 flex-shrink-0" />
          <span className="truncate">{event.location_name}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center text-sm text-gray-500">
          <Users className="h-4 w-4 mr-1" />
          <span>
            {event.confirmed_guest_count} / {event.max_guests}
          </span>
        </div>

        {event.host_username && (
          <div className="flex items-center text-sm text-gray-500">
            <Shield className="h-4 w-4 mr-1 text-green-500" />
            <span>{event.host_username}</span>
          </div>
        )}
      </div>

      {event.available_spots > 0 && event.status === 'open' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-sm text-green-600 font-medium">
            {event.available_spots} spot{event.available_spots > 1 ? 's' : ''} available
          </span>
        </div>
      )}
    </Link>
  )
}
