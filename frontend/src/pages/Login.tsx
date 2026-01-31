import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { authApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'

interface LoginForm {
  email: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const authResponse = await authApi.login(data.email, data.password)
      localStorage.setItem('token', authResponse.access_token)
      const user = await authApi.getMe(authResponse.access_token)
      setAuth(user, authResponse.access_token)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-sm">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Sign In</h2>
          <p className="text-sm text-gray-500 mb-6">Welcome back to FoodShare</p>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email</label>
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
              <label htmlFor="password" className="label">Password</label>
              <input
                {...register('password', { required: 'Password is required' })}
                type="password"
                className="input"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-4 text-sm text-gray-600 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
