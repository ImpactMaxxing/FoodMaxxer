import { Link } from 'react-router-dom'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionLink?: string
  onAction?: () => void
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionLink,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="card text-center py-12">
      <Icon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{description}</p>
      {actionLabel && actionLink && (
        <Link to={actionLink} className="btn-primary">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  )
}
