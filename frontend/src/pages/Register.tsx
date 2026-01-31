import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { authApi, referralsApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'

interface RegisterForm {
  email: string
  username: string
  password: string
  confirmPassword: string
  full_name: string
  referral_code: string
}

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [referralValid, setReferralValid] = useState<boolean | null>(null)
  const [referrerName, setReferrerName] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    defaultValues: {
      referral_code: searchParams.get('ref') || '',
    },
  })

  const password = watch('password')

  const validateReferralCode = async (code: string) => {
    if (!code || code.length < 4) {
      setReferralValid(null)
      setReferrerName(null)
      return
    }

    try {
      const result = await referralsApi.validate(code)
      setReferralValid(result.valid)
      setReferrerName(result.valid ? result.referrer_username || null : null)
    } catch {
      setReferralValid(false)
      setReferrerName(null)
    }
  }

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    try {
      await authApi.register({
        email: data.email,
        username: data.username,
        password: data.password,
        full_name: data.full_name || undefined,
        referral_code: data.referral_code || undefined,
      })

      const authResponse = await authApi.login(data.email, data.password)
      localStorage.setItem('token', authResponse.access_token)
      const user = await authApi.getMe(authResponse.access_token)
      setAuth(user, authResponse.access_token)

      toast.success('Account created!')
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-sm">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Create Account</h2>
          <p className="text-sm text-gray-500 mb-6">Join FoodShare with an invite code</p>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }} className="space-y-4">
            <div>
              <label className="label">Referral Code <span className="text-red-500">*</span></label>
              <input
                {...register('referral_code', { required: 'Referral code is required' })}
                type="text"
                className="input uppercase"
                placeholder="ABCD1234"
                onBlur={(e) => validateReferralCode(e.target.value)}
              />
              {referralValid === true && (
                <p className="mt-1 text-xs text-green-600">✓ Referred by {referrerName}</p>
              )}
              {referralValid === false && (
                <p className="mt-1 text-xs text-red-600">Invalid referral code</p>
              )}
              {errors.referral_code && (
                <p className="mt-1 text-xs text-red-600">{errors.referral_code.message}</p>
              )}
            </div>

            <div>
              <label className="label">Email</label>
              <input
                {...register('email', { required: 'Email is required' })}
                type="email"
                className="input"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label">Username</label>
              <input
                {...register('username', {
                  required: 'Username is required',
                  minLength: { value: 3, message: 'Min 3 characters' },
                  pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Letters, numbers, underscores only' },
                })}
                type="text"
                className="input"
                placeholder="johndoe"
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="label">Full Name <span className="text-gray-400">(optional)</span></label>
              <input
                {...register('full_name')}
                type="text"
                className="input"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Min 8 characters' },
                })}
                type="password"
                className="input"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
                type="password"
                className="input"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-4 text-sm text-gray-600 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
