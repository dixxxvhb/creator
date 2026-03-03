import { useAudioPlayer } from '@/hooks/useAudioPlayer'

interface AudioPlayerBarProps {
  audioUrl: string | null
  songTitle?: string | null
  songArtist?: string | null
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function AudioPlayerBar({ audioUrl, songTitle, songArtist }: AudioPlayerBarProps) {
  const { isPlaying, currentTime, duration, play, pause, seek } = useAudioPlayer(audioUrl)

  if (!audioUrl) return null

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-t border-gray-800 shrink-0">
      <button
        onClick={isPlaying ? pause : play}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm flex-shrink-0"
      >
        {isPlaying ? '||' : '\u25B6'}
      </button>

      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="text-xs text-gray-400 w-10 text-right flex-shrink-0">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={(e) => seek(parseFloat(e.target.value))}
          className="flex-1 h-1 accent-blue-500"
        />
        <span className="text-xs text-gray-400 w-10 flex-shrink-0">
          {formatTime(duration)}
        </span>
      </div>

      {(songTitle || songArtist) && (
        <div className="text-xs text-gray-500 truncate max-w-[200px] flex-shrink-0">
          {songTitle}{songArtist ? ` - ${songArtist}` : ''}
        </div>
      )}
    </div>
  )
}
