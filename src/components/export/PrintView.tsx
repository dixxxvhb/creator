import { useEffect } from 'react';
import type { Piece, Formation, DancerPosition } from '@/types';

interface PrintViewProps {
  piece: Piece;
  formations: Formation[];
  positions: Record<string, DancerPosition[]>;
  stageImages: (string | null)[];
  onClose: () => void;
}

export function PrintView({ piece, formations, positions, stageImages, onClose }: PrintViewProps) {
  useEffect(() => {
    // Trigger print after render, close on completion
    const timeout = setTimeout(() => {
      window.print();
      onClose();
    }, 300);
    return () => clearTimeout(timeout);
  }, [onClose]);

  const songText = [piece.song_title, piece.song_artist].filter(Boolean).join(' — ');

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto print:static print:z-auto">
      {/* Close button (hidden in print) */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-50 px-3 py-1.5 bg-gray-800 text-white rounded-lg text-sm print:hidden"
      >
        Close Preview
      </button>

      <div className="max-w-[800px] mx-auto p-8 text-black">
        {/* Title */}
        <div className="text-center mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold">{piece.title}</h1>
          <div className="text-sm text-gray-500 mt-1 space-x-3">
            {piece.style && <span>{piece.style}</span>}
            <span>{piece.dancer_count} dancer{piece.dancer_count !== 1 ? 's' : ''}</span>
            {songText && <span>{songText}</span>}
          </div>
        </div>

        {/* Formations */}
        {formations.map((formation, idx) => {
          const formPositions = positions[formation.id] ?? [];
          return (
            <div key={formation.id} className="mb-8 break-inside-avoid-page">
              <h2 className="text-lg font-semibold mb-2">
                {formation.label || `Formation ${idx + 1}`}
                {formation.timestamp_seconds !== null && (
                  <span className="text-sm font-normal text-gray-400 ml-2">
                    {Math.floor(formation.timestamp_seconds / 60)}:{Math.floor(formation.timestamp_seconds % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </h2>

              {/* Stage image */}
              {stageImages[idx] && (
                <img
                  src={stageImages[idx]!}
                  alt={formation.label}
                  className="w-full border rounded mb-3"
                />
              )}

              {/* Dancer positions */}
              {formPositions.length > 0 && (
                <div className="mb-3">
                  <h3 className="text-xs font-semibold uppercase text-gray-500 mb-1">Dancers</h3>
                  <div className="grid grid-cols-4 gap-1 text-xs text-gray-600">
                    {formPositions.map((pos) => (
                      <span key={pos.id}>
                        {pos.dancer_label} ({Math.round(pos.x)}, {Math.round(pos.y)})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {formation.choreo_notes && (
                <div className="mb-2">
                  <h3 className="text-xs font-semibold uppercase text-gray-500 mb-1">Choreography</h3>
                  <p className="text-sm whitespace-pre-wrap">{formation.choreo_notes}</p>
                </div>
              )}
              {formation.counts_notes && (
                <div className="mb-2">
                  <h3 className="text-xs font-semibold uppercase text-gray-500 mb-1">Counts</h3>
                  <p className="text-sm whitespace-pre-wrap">{formation.counts_notes}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
