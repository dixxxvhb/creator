import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronLeft, X } from 'lucide-react';
import { useShowStore } from '@/stores/showStore';
import { usePieceStore } from '@/stores/pieceStore';
import { TierGate } from '@/components/ui/TierGate';

export function BackstagePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const shows = useShowStore((s) => s.shows);
  const showActs = useShowStore((s) => s.showActs);
  const loadAllShows = useShowStore((s) => s.loadAllShows);
  const loadShowActs = useShowStore((s) => s.loadShowActs);

  const pieces = usePieceStore((s) => s.pieces);
  const loadPieces = usePieceStore((s) => s.load);

  const [currentIndex, setCurrentIndex] = useState(0);

  const show = shows.find((s) => s.id === id);
  const sortedActs = [...showActs].sort((a, b) => a.act_number - b.act_number);

  // Data loading
  useEffect(() => {
    if (shows.length === 0) loadAllShows();
    if (pieces.length === 0) loadPieces();
  }, [shows.length, pieces.length, loadAllShows, loadPieces]);

  useEffect(() => {
    if (id) loadShowActs(id);
  }, [id, loadShowActs]);

  // Keyboard navigation
  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, sortedActs.length - 1));
  }, [sortedActs.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  const goBack = useCallback(() => {
    navigate(`/shows/${id}`);
  }, [navigate, id]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        goBack();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, goBack]);

  // Helpers
  function getPiece(pieceId: string) {
    return pieces.find((p) => p.id === pieceId);
  }

  // Loading state
  if (!show || sortedActs.length === 0) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center z-50">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">
            {!show ? 'Loading show...' : 'No acts in this show.'}
          </p>
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mx-auto px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            <ChevronLeft size={20} />
            Back to Show
          </button>
        </div>
      </div>
    );
  }

  const currentAct = sortedActs[currentIndex];
  const nextAct = currentIndex < sortedActs.length - 1 ? sortedActs[currentIndex + 1] : null;
  const currentPiece = currentAct ? getPiece(currentAct.piece_id) : null;
  const nextPiece = nextAct ? getPiece(nextAct.piece_id) : null;

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === sortedActs.length - 1;

  return (
    <TierGate feature="shows">
    <div className="fixed inset-0 bg-gray-950 flex flex-col z-50 select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={goBack}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors shrink-0"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-lg font-semibold text-white truncate">{show.name}</h1>
        </div>
        <span className="text-sm font-medium text-gray-500 uppercase tracking-wider shrink-0 px-4">
          Backstage View
        </span>
        <button
          onClick={goBack}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors shrink-0"
        >
          <X size={22} />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-8 overflow-hidden">
        {/* Current act */}
        <div className="text-center max-w-2xl w-full">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-3">
            Now
          </p>
          <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-4">
            {currentPiece?.title ?? 'Unknown Piece'}
          </h2>
          <div className="flex items-center justify-center gap-4 text-xl text-gray-400">
            {currentPiece?.style && (
              <span>{currentPiece.style}</span>
            )}
            {currentPiece?.style && currentPiece.dancer_count > 0 && (
              <span className="text-gray-600">|</span>
            )}
            {currentPiece && currentPiece.dancer_count > 0 && (
              <span>{currentPiece.dancer_count} dancer{currentPiece.dancer_count !== 1 ? 's' : ''}</span>
            )}
          </div>
          {currentAct.notes && (
            <p className="mt-4 text-base text-gray-500 italic">{currentAct.notes}</p>
          )}
        </div>

        {/* Intermission / Next act divider */}
        {nextAct && (
          <>
            {nextAct.intermission_before && (
              <div className="flex items-center gap-4 w-full max-w-lg">
                <div className="flex-1 border-t border-gray-700" />
                <span className="text-lg font-bold text-amber-400 uppercase tracking-widest">
                  Intermission
                </span>
                <div className="flex-1 border-t border-gray-700" />
              </div>
            )}

            {/* Next act preview */}
            <div className="text-center max-w-xl w-full opacity-60">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-widest mb-2">
                Up Next
              </p>
              <h3 className="text-2xl md:text-3xl font-semibold text-gray-300 mb-2">
                {nextPiece?.title ?? 'Unknown Piece'}
              </h3>
              <div className="flex items-center justify-center gap-3 text-base text-gray-500">
                {nextPiece?.style && (
                  <span>{nextPiece.style}</span>
                )}
                {nextPiece?.style && nextPiece && nextPiece.dancer_count > 0 && (
                  <span className="text-gray-700">|</span>
                )}
                {nextPiece && nextPiece.dancer_count > 0 && (
                  <span>{nextPiece.dancer_count} dancer{nextPiece.dancer_count !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          </>
        )}

        {!nextAct && (
          <div className="text-center opacity-60">
            <p className="text-lg text-gray-500 font-medium">Final Act</p>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="flex items-center justify-between px-6 py-5 border-t border-gray-800">
        <button
          onClick={goPrev}
          disabled={isFirst}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-base font-medium transition-colors ${
            isFirst
              ? 'text-gray-700 cursor-not-allowed'
              : 'text-gray-300 hover:text-white hover:bg-gray-800 active:bg-gray-700'
          }`}
        >
          <ArrowLeft size={20} />
          Previous
        </button>

        <span className="text-sm font-medium text-gray-500">
          Act {currentIndex + 1} of {sortedActs.length}
        </span>

        <button
          onClick={goNext}
          disabled={isLast}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-base font-medium transition-colors ${
            isLast
              ? 'text-gray-700 cursor-not-allowed'
              : 'text-gray-300 hover:text-white hover:bg-gray-800 active:bg-gray-700'
          }`}
        >
          Next
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
    </TierGate>
  );
}
