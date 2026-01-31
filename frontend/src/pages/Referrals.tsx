import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { referralsApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function Referrals() {
  const { user } = useAuthStore()
  const [copied, setCopied] = useState(false)

  const { data: stats, isLoading } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: referralsApi.getStats,
  })

  const referralLink = `${window.location.origin}/register?ref=${user?.referral_code}`

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-300">
        Referral Program
      </h1>

      {/* Your Code */}
      <div className="card bg-primary-500 border-primary-600 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-primary-100 text-sm mb-1">Your referral code</div>
            <div className="text-2xl font-mono font-bold text-white tracking-wider">
              {user?.referral_code}
            </div>
          </div>
          <div className="text-right">
            <div className="text-primary-100 text-sm mb-1">Points earned</div>
            <div className="text-2xl font-bold text-white">{user?.referral_points || 0}</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-primary-400">
          <div className="flex gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 bg-primary-600 border border-primary-400 px-3 py-2 text-white text-sm"
            />
            <button
              onClick={() => copyToClipboard(referralLink)}
              className="btn bg-white text-primary-600 border-white hover:bg-primary-50"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-800">{stats?.total_referrals || 0}/5</div>
          <div className="text-xs text-gray-500">Referrals Used</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-800">{stats?.total_points_earned || 0}</div>
          <div className="text-xs text-gray-500">Total Points</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-800">100</div>
          <div className="text-xs text-gray-500">Per Referral</div>
        </div>
      </div>

      {/* How it works */}
      <div className="card mb-6">
        <h2 className="font-bold text-gray-800 mb-3">How it works</h2>
        <ol className="text-sm text-gray-600 space-y-2">
          <li><strong>1.</strong> Share your referral code or link with friends</li>
          <li><strong>2.</strong> They sign up using your code</li>
          <li><strong>3.</strong> You get 100 points (max 5 referrals)</li>
        </ol>
      </div>

      {/* History */}
      <div className="card">
        <h2 className="font-bold text-gray-800 mb-3">Referral History</h2>

        {isLoading ? (
          <div className="text-center py-6 text-gray-500">Loading...</div>
        ) : stats?.referrals.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            No referrals yet. Share your code to get started!
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="py-2 font-medium text-gray-500">User</th>
                <th className="py-2 font-medium text-gray-500">Date</th>
                <th className="py-2 font-medium text-gray-500 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {stats?.referrals.map((referral) => (
                <tr key={referral.id} className="border-b border-gray-100">
                  <td className="py-2 text-gray-800">{referral.referred_username}</td>
                  <td className="py-2 text-gray-500">
                    {format(new Date(referral.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="py-2 text-right">
                    {referral.bonus_awarded ? (
                      <span className="text-green-600">+{referral.bonus_amount}</span>
                    ) : (
                      <span className="text-gray-400">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
