import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPiece } from '@/services/pieceService'
import { uploadAudio } from '@/services/storageService'
import { saveFormations } from '@/services/formationService'
import { generateStarterFormation } from '@/utils/formationGenerator'
import { nanoid } from 'nanoid'
import { DANCE_STYLES, GROUP_SIZES } from '@/types/piece'
import type { DanceStyle, GroupSize } from '@/types/piece'

export function SetupScreen() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [danceStyle, setDanceStyle] = useState<DanceStyle>('contemporary')
  const [groupSize, setGroupSize] = useState<GroupSize>('small_group')
  const [dancerCount, setDancerCount] = useState(5)
  const [songTitle, setSongTitle] = useState('')
  const [songArtist, setSongArtist] = useState('')
  const [bpm, setBpm] = useState('')
  const [songLength, setSongLength] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGroupSizeChange = (gs: GroupSize) => {
    setGroupSize(gs)
    const defaults: Record<GroupSize, number> = {
      solo: 1, duo: 2, trio: 3, small_group: 5, large_group: 12,
    }
    setDancerCount(defaults[gs])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Piece name is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Create the piece
      const piece = await createPiece({
        name: name.trim(),
        dance_style: danceStyle,
        group_size: groupSize,
        dancer_count: dancerCount,
        song_title: songTitle.trim() || null,
        song_artist: songArtist.trim() || null,
        bpm: bpm ? parseInt(bpm) : null,
        song_length_seconds: songLength ? parseInt(songLength) : null,
        audio_storage_path: null,
      })

      // Upload audio if provided
      if (audioFile) {
        const path = await uploadAudio(piece.id, audioFile)
        // Update piece with audio path
        const { supabase } = await import('@/config/supabase')
        await supabase.from('pieces').update({ audio_storage_path: path }).eq('id', piece.id)
      }

      // Generate and save starter formation
      const starterPositions = generateStarterFormation(groupSize, dancerCount)
      const starterFormation = {
        id: nanoid(),
        name: 'Formation 1',
        order_index: 0,
        dancer_positions: starterPositions,
        timestamp_seconds: null,
      }
      await saveFormations(piece.id, [starterFormation])

      navigate(`/workspace/${piece.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">New Piece</h2>
        <p className="text-gray-400 text-sm">Set up your choreography details</p>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* Piece Info */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Piece Details</h3>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Piece Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Spring Showcase Opener"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Dance Style</label>
            <select
              value={danceStyle}
              onChange={(e) => setDanceStyle(e.target.value as DanceStyle)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
            >
              {DANCE_STYLES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Group Size</label>
            <select
              value={groupSize}
              onChange={(e) => handleGroupSizeChange(e.target.value as GroupSize)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
            >
              {GROUP_SIZES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label} ({g.range})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Number of Dancers</label>
          <input
            type="number"
            min={1}
            max={100}
            value={dancerCount}
            onChange={(e) => setDancerCount(parseInt(e.target.value) || 1)}
            className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </section>

      {/* Song Info */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Song Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Song Title</label>
            <input
              type="text"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="e.g. Clair de Lune"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Artist</label>
            <input
              type="text"
              value={songArtist}
              onChange={(e) => setSongArtist(e.target.value)}
              placeholder="e.g. Debussy"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">BPM</label>
            <input
              type="number"
              min={1}
              max={300}
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
              placeholder="e.g. 120"
              className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Song Length (seconds)</label>
            <input
              type="number"
              min={1}
              value={songLength}
              onChange={(e) => setSongLength(e.target.value)}
              placeholder="e.g. 180"
              className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Audio File</label>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
            className="w-full text-gray-400 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-500"
          />
          {audioFile && (
            <p className="mt-1 text-xs text-gray-500">{audioFile.name}</p>
          )}
        </div>
      </section>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
      >
        {isSubmitting ? 'Creating...' : 'Create Piece'}
      </button>
    </form>
  )
}
