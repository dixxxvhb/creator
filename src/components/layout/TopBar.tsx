import { useNavigate } from 'react-router-dom'
import { useFormationStore } from '@/stores/useFormationStore'

interface TopBarProps {
  title?: string
  showBack?: boolean
}

export function TopBar({ title = 'Creator', showBack = false }: TopBarProps) {
  const navigate = useNavigate()
  const isDirty = useFormationStore((s) => s.isDirty)

  return (
    <div className="flex items-center h-14 px-4 bg-gray-900 border-b border-gray-800 shrink-0">
      {showBack && (
        <button
          onClick={() => navigate('/')}
          className="mr-3 text-gray-400 hover:text-white text-sm"
        >
          &larr; Back
        </button>
      )}
      <h1 className="text-white font-semibold text-lg truncate flex-1">
        {title}
      </h1>
      {showBack && (
        <span className="text-xs text-gray-500">
          {isDirty ? 'Saving...' : 'Saved'}
        </span>
      )}
    </div>
  )
}
