import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { usersApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface ProfileForm {
  full_name: string
  email: string
}

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const [editing, setEditing] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileForm>({
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: (data: { full_name?: string; email?: string }) => usersApi.updateProfile(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser)
      toast.success('Profile updated!')
      setEditing(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update profile')
    },
  })

  const onSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate({
      full_name: data.full_name || undefined,
      email: data.email,
    })
  }

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-700'
    if (score >= 50) return 'text-yellow-700'
    return 'text-red-700'
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-300">
        Profile
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-4">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800">Account</h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm text-primary-600 hover:underline"
                >
                  Edit
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div>
                  <label className="label">Full Name</label>
                  <input {...register('full_name')} className="input" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    {...register('email', { required: 'Email is required' })}
                    type="email"
                    className="input"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={updateProfileMutation.isPending} className="btn-primary">
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={() => { reset(); setEditing(false); }} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Username</span>
                  <span className="text-gray-800 font-medium">@{user?.username}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Full Name</span>
                  <span className="text-gray-800">{user?.full_name || '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Email</span>
                  <span className="text-gray-800">{user?.email}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Joined</span>
                  <span className="text-gray-800">{user?.created_at && format(new Date(user.created_at), 'MMM yyyy')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="card">
            <h2 className="font-bold text-gray-800 mb-4">Stats</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="py-3 border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">{user?.events_hosted}</div>
                <div className="text-xs text-gray-500">Hosted</div>
              </div>
              <div className="py-3 border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">{user?.events_attended}</div>
                <div className="text-xs text-gray-500">Attended</div>
              </div>
              <div className="py-3 border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">{user?.reliability_percentage}%</div>
                <div className="text-xs text-gray-500">Reliability</div>
              </div>
              <div className="py-3 border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">{user?.referral_points}</div>
                <div className="text-xs text-gray-500">Points</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card text-center">
            <div className="text-xs text-gray-500 mb-1">Trust Score</div>
            <div className={`text-4xl font-bold ${getTrustScoreColor(user?.trust_score || 0)}`}>
              {user?.trust_score}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {user?.can_host ? 'Can host events' : 'Build trust to host'}
            </div>
          </div>

          <div className="card">
            <div className="text-xs text-gray-500 mb-1">Referral Code</div>
            <div className="font-mono font-bold text-primary-600 text-lg">
              {user?.referral_code}
            </div>
            <div className="text-xs text-gray-500 mt-1">Share to earn points</div>
          </div>
        </div>
      </div>
    </div>
  )
}
