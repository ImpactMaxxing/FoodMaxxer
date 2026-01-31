import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invitesApi } from '../lib/api'
import toast from 'react-hot-toast'
import { X, UserPlus, Loader2 } from 'lucide-react'

interface InviteGuestModalProps {
  eventId: number
  onClose: () => void
}

export default function InviteGuestModal({ eventId, onClose }: InviteGuestModalProps) {
  const [username, setUsername] = useState('')
  const queryClient = useQueryClient()

  const inviteMutation = useMutation({
    mutationFn: () => invitesApi.create(eventId, username),
    onSuccess: () => {
      toast.success(`Invited ${username}!`)
      queryClient.invalidateQueries({ queryKey: ['event-rsvps', eventId] })
      setUsername('')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to invite user')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return
    inviteMutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <UserPlus className="h-5 w-5 mr-2 text-primary-500" />
            Invite Guest
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="label">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              placeholder="Enter username to invite"
              autoFocus
            />
            <p className="text-sm text-gray-500 mt-1">
              The user will receive an invite they can accept or decline.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!username.trim() || inviteMutation.isPending}
              className="btn-primary flex items-center"
            >
              {inviteMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Send Invite
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
