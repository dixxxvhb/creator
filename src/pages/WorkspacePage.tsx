import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPiece } from '@/services/pieceService'
import { loadFormations } from '@/services/formationService'
import { getAudioUrl } from '@/services/storageService'
import { usePieceStore } from '@/stores/usePieceStore'
import { useFormationStore } from '@/stores/useFormationStore'
import { useAutoSave } from '@/hooks/useAutoSave'
import { TopBar } from '@/components/layout/TopBar'
import { StageCanvas } from '@/components/stage/StageCanvas'
import { FormationStrip } from '@/components/formations/FormationStrip'
import { AudioPlayerBar } from '@/components/audio/AudioPlayerBar'

export function WorkspacePage() {
  const { pieceId } = useParams<{ pieceId: string }>()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const setPiece = usePieceStore((s) => s.setPiece)
  const setAudioUrl = usePieceStore((s) => s.setAudioUrl)
  const piece = usePieceStore((s) => s.piece)
  const audioUrl = usePieceStore((s) => s.audioUrl)
  const setFormations = useFormationStore((s) => s.setFormations)
  const resetPiece = usePieceStore((s) => s.reset)
  const resetFormations = useFormationStore((s) => s.reset)

  useAutoSave()

  useEffect(() => {
    if (!pieceId) return

    const load = async () => {
      try {
        const [pieceData, formationsData] = await Promise.all([
          getPiece(pieceId),
          loadFormations(pieceId),
        ])

        setPiece(pieceData)
        setFormations(formationsData)

        if (pieceData.audio_storage_path) {
          const url = await getAudioUrl(pieceData.audio_storage_path)
          setAudioUrl(url)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load piece')
      } finally {
        setIsLoading(false)
      }
    }

    load()

    return () => {
      resetPiece()
      resetFormations()
    }
  }, [pieceId, setPiece, setFormations, setAudioUrl, resetPiece, resetFormations])

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-gray-950">
        <TopBar title="Loading..." showBack />
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Loading piece...
        </div>
      </div>
    )
  }

  if (error || !piece) {
    return (
      <div className="flex flex-col h-screen bg-gray-950">
        <TopBar title="Error" showBack />
        <div className="flex-1 flex items-center justify-center text-red-400">
          {error || 'Piece not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 select-none">
      <TopBar title={piece.name} showBack />
      <StageCanvas />
      <AudioPlayerBar
        audioUrl={audioUrl}
        songTitle={piece.song_title}
        songArtist={piece.song_artist}
      />
      <FormationStrip />
    </div>
  )
}
