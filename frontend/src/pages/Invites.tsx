import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invitesApi } from '../lib/api'
import toast from 'react-hot-toast'
import { Mail, Calendar, Check, X, Loader2, Clock } from 'lucide-react'
import { format } from 'date-fns'

export default function Invites() {
  const queryClient = useQueryClient()

  const { data: invites, isLoading } = useQuery({
    queryKey: ['my-invites'],
    queryFn: invitesApi.getMyInvites,
  })

  const acceptMutation = useMutation({
    mutationFn: (inviteId: number) => invitesApi.accept(inviteId),
    onSuccess: () => {
      toast.success('Invite accepted!')
      queryClient.invalidateQueries({ queryKey: ['my-invites'] })
      queryClient.invalidateQueries({ queryKey: ['my-rsvps'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to accept invite')
    },
  })

  const declineMutation = useMutation({
    mutationFn: (inviteId: number) => invitesApi.decline(inviteId),
    onSuccess: () => {
      toast.success('Invite declined')
      queryClient.invalidateQueries({ queryKey: ['my-invites'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to decline invite')
    },
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Invites</h1>
        <p className="text-gray-600 mt-1">Event invitations sent to you</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : invites?.length === 0 ? (
        <div className="card text-center py-12">
          <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No pending invites</h3>
          <p className="text-gray-500 mb-4">You don't have any event invitations right now.</p>
          <Link to="/events" className="btn-primary">
            Browse Public Events
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {invites?.map((invite) => (
            <div key={invite.id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <Link
                    to={`/events/${invite.event_id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                  >
                    View Event Details
                  </Link>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Invited {format(new Date(invite.invited_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => acceptMutation.mutate(invite.id)}
                    disabled={acceptMutation.isPending || declineMutation.isPending}
                    className="btn-primary flex items-center"
                  >
                    {acceptMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => declineMutation.mutate(invite.id)}
                    disabled={acceptMutation.isPending || declineMutation.isPending}
                    className="btn-secondary flex items-center"
                  >
                    {declineMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
