import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
}

export default function LoadingSpinner({ size = 'md', text, fullScreen = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  const content = (
    <div className="flex flex-col items-center justify-center">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-500`} />
      {text && <p className="mt-2 text-gray-500">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}
