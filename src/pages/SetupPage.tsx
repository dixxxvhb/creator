import { TopBar } from '@/components/layout/TopBar'
import { SetupScreen } from '@/components/setup/SetupScreen'

export function SetupPage() {
  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <TopBar title="New Piece" showBack />
      <div className="flex-1 overflow-auto">
        <SetupScreen />
      </div>
    </div>
  )
}
