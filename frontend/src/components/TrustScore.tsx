import { Shield } from 'lucide-react'

interface TrustScoreProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function TrustScore({ score, size = 'md', showLabel = true }: TrustScoreProps) {
  const getColor = (score: number) => {
    if (score >= 80) return { text: 'text-green-600', bg: 'bg-green-100', fill: 'text-green-500' }
    if (score >= 50) return { text: 'text-yellow-600', bg: 'bg-yellow-100', fill: 'text-yellow-500' }
    return { text: 'text-red-600', bg: 'bg-red-100', fill: 'text-red-500' }
  }

  const getLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Fair'
    return 'Low'
  }

  const sizeClasses = {
    sm: { container: 'w-8 h-8', icon: 'h-4 w-4', text: 'text-sm' },
    md: { container: 'w-12 h-12', icon: 'h-6 w-6', text: 'text-base' },
    lg: { container: 'w-16 h-16', icon: 'h-8 w-8', text: 'text-lg' },
  }

  const colors = getColor(score)
  const classes = sizeClasses[size]

  return (
    <div className="flex items-center space-x-2">
      <div className={`${classes.container} ${colors.bg} rounded-full flex items-center justify-center`}>
        <Shield className={`${classes.icon} ${colors.fill}`} />
      </div>
      <div>
        <p className={`font-bold ${colors.text} ${classes.text}`}>{score}</p>
        {showLabel && (
          <p className="text-xs text-gray-500">{getLabel(score)}</p>
        )}
      </div>
    </div>
  )
}
