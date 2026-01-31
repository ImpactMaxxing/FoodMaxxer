import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Home() {
  const { isAuthenticated } = useAuthStore()

  return (
    <div>
      {/* Hero */}
      <section className="bg-primary-500 border-b-4 border-primary-700">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            FoodShare
          </h1>
          <p className="text-xl text-primary-100 mb-8">
            Dinner parties with people you trust. No flakes, no strangers.
          </p>
          <div className="flex justify-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/create-event" className="btn-secondary">
                  Host a Dinner
                </Link>
                <Link to="/events" className="btn bg-primary-700 text-white border-primary-800 hover:bg-primary-800">
                  Browse Events
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-secondary">
                  Join with Invite Code
                </Link>
                <Link to="/login" className="btn bg-primary-700 text-white border-primary-800 hover:bg-primary-800">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card text-center">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="font-bold text-gray-800 mb-2">Invite Only</h3>
              <p className="text-gray-600 text-sm">
                Join with a referral code from someone who vouches for you. Build trust over time.
              </p>
            </div>
            <div className="card text-center">
              <div className="text-3xl mb-3">🍽️</div>
              <h3 className="font-bold text-gray-800 mb-2">Coordinate Food</h3>
              <p className="text-gray-600 text-sm">
                Hosts list what's needed. Guests claim dishes. No more five people bringing chips.
              </p>
            </div>
            <div className="card text-center">
              <div className="text-3xl mb-3">⭐</div>
              <h3 className="font-bold text-gray-800 mb-2">Trust Scores</h3>
              <p className="text-gray-600 text-sm">
                Show up, build reputation. Flake, lose points. Hosts see who's reliable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
            Getting Started
          </h2>
          <div className="space-y-4">
            <div className="card flex gap-4 items-start">
              <span className="bg-primary-500 text-white w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">1</span>
              <div>
                <h3 className="font-bold text-gray-800">Get an invite code</h3>
                <p className="text-gray-600 text-sm">Ask a friend who's already a member for their referral code.</p>
              </div>
            </div>
            <div className="card flex gap-4 items-start">
              <span className="bg-primary-500 text-white w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">2</span>
              <div>
                <h3 className="font-bold text-gray-800">Browse or host</h3>
                <p className="text-gray-600 text-sm">Find dinners to join or create your own event.</p>
              </div>
            </div>
            <div className="card flex gap-4 items-start">
              <span className="bg-primary-500 text-white w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">3</span>
              <div>
                <h3 className="font-bold text-gray-800">Show up, eat well</h3>
                <p className="text-gray-600 text-sm">Bring what you promised. Build your reputation. Enjoy good food.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gray-800">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to join?
          </h2>
          <p className="text-gray-400 mb-6">
            Get an invite code from a friend and start attending dinners with people who actually show up.
          </p>
          {isAuthenticated ? (
            <Link to="/events" className="btn-primary">
              Browse Events
            </Link>
          ) : (
            <Link to="/register" className="btn-primary">
              Sign Up
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
