import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from './store/authStore'
import { authApi } from './lib/api'

// Layouts
import Layout from './components/Layout'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import CreateEvent from './pages/CreateEvent'
import MyEvents from './pages/MyEvents'
import MyRsvps from './pages/MyRsvps'
import Referrals from './pages/Referrals'
import Profile from './pages/Profile'
import Invites from './pages/Invites'
import NotFound from './pages/NotFound'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  const { token, setUser, logout, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const user = await authApi.getMe()
          setUser(user)
        } catch {
          logout()
        }
      }
      setLoading(false)
    }
    loadUser()
  }, [token, setUser, logout])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
        {/* Protected Routes */}
        <Route path="events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
        <Route path="events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />

        <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="create-event" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
        <Route path="my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
        <Route path="my-rsvps" element={<ProtectedRoute><MyRsvps /></ProtectedRoute>} />
        <Route path="referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="invites" element={<ProtectedRoute><Invites /></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
