import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { invitesApi } from '../lib/api'

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { data: invites } = useQuery({
    queryKey: ['my-invites'],
    queryFn: invitesApi.getMyInvites,
    enabled: isAuthenticated,
  })

  const inviteCount = invites?.filter(i => i.status === 'pending').length || 0

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path: string) => location.pathname === path

  const navLinkClass = (path: string) =>
    `px-3 py-2 text-sm font-medium border-b-2 ${
      isActive(path)
        ? 'border-primary-500 text-primary-600'
        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
    }`

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-300 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex justify-between h-14">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">FS</span>
                </div>
                <span className="font-bold text-gray-800">FoodShare</span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {isAuthenticated ? (
                <>
                  <Link to="/events" className={navLinkClass('/events')}>Events</Link>
                  <Link to="/create-event" className={navLinkClass('/create-event')}>Host</Link>
                  <Link to="/dashboard" className={navLinkClass('/dashboard')}>Dashboard</Link>
                  <Link to="/my-rsvps" className={navLinkClass('/my-rsvps')}>My RSVPs</Link>
                  <Link to="/referrals" className={navLinkClass('/referrals')}>Referrals</Link>
                  <Link to="/invites" className={`${navLinkClass('/invites')} relative`}>
                    Invites
                    {inviteCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center">
                        {inviteCount}
                      </span>
                    )}
                  </Link>
                  <div className="ml-4 pl-4 border-l border-gray-200 flex items-center gap-3">
                    <Link to="/profile" className="text-sm text-gray-600 hover:text-gray-900">
                      {user?.username}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-sm text-gray-500 hover:text-red-600"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary text-sm">Log In</Link>
                  <Link to="/register" className="btn-primary text-sm">Sign Up</Link>
                </>
              )}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              {isAuthenticated ? (
                <>
                  <Link to="/events" className="block py-2 text-gray-700" onClick={() => setMobileMenuOpen(false)}>Events</Link>
                  <Link to="/create-event" className="block py-2 text-gray-700" onClick={() => setMobileMenuOpen(false)}>Host Event</Link>
                  <Link to="/dashboard" className="block py-2 text-gray-700" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                  <Link to="/my-rsvps" className="block py-2 text-gray-700" onClick={() => setMobileMenuOpen(false)}>My RSVPs</Link>
                  <Link to="/referrals" className="block py-2 text-gray-700" onClick={() => setMobileMenuOpen(false)}>Referrals</Link>
                  <Link to="/invites" className="block py-2 text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                    Invites {inviteCount > 0 && `(${inviteCount})`}
                  </Link>
                  <Link to="/profile" className="block py-2 text-gray-700" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="block py-2 text-red-600 w-full text-left">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block py-2 text-gray-700" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
                  <Link to="/register" className="block py-2 text-gray-700" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-300 mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>© 2026 FoodShare</span>
            <span>Dinner parties with people you trust.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
