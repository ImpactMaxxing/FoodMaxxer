import { Link } from 'react-router-dom'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-500">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mt-4">Page Not Found</h2>
        <p className="text-gray-600 mt-2 max-w-md mx-auto">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <Link to="/" className="btn-primary flex items-center justify-center">
            <Home className="h-5 w-5 mr-2" />
            Go Home
          </Link>
          <Link to="/events" className="btn-secondary flex items-center justify-center">
            <Search className="h-5 w-5 mr-2" />
            Browse Events
          </Link>
        </div>
      </div>
    </div>
  )
}
