import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listPieces, deletePiece } from '@/services/pieceService'
import { TopBar } from '@/components/layout/TopBar'
import type { Piece } from '@/types/piece'

export function HomePage() {
  const navigate = useNavigate()
  const [pieces, setPieces] = useState<Piece[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPieces()
  }, [])

  const loadPieces = async () => {
    try {
      const data = await listPieces()
      setPieces(data)
    } catch (err) {
      console.error('Failed to load pieces:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deletePiece(id)
      setPieces((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error('Failed to delete piece:', err)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <TopBar title="Creator" />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Your Pieces</h2>
            <button
              onClick={() => navigate('/setup')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + New Piece
            </button>
          </div>

          {isLoading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : pieces.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 mb-4">No pieces yet</p>
              <button
                onClick={() => navigate('/setup')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Create Your First Piece
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pieces.map((piece) => (
                <div
                  key={piece.id}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/workspace/${piece.id}`)}
                >
                  <h3 className="text-white font-medium truncate">{piece.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {piece.dance_style.replace('_', ' ')} &middot; {piece.dancer_count} dancer{piece.dancer_count !== 1 ? 's' : ''}
                  </p>
                  {piece.song_title && (
                    <p className="text-gray-600 text-xs mt-1 truncate">
                      {piece.song_title}{piece.song_artist ? ` - ${piece.song_artist}` : ''}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-600">
                      {new Date(piece.updated_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(piece.id)
                      }}
                      className="text-xs text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
