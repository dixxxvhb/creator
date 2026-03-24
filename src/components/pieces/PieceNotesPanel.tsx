import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import type { Piece, Formation } from '@/types';

interface PieceNotesPanelProps {
  piece: Piece;
  formations: Formation[];
  onUpdatePiece: (updates: { notes: string }) => void;
  onNavigateFormation: (formationId: string) => void;
}

export function PieceNotesPanel({ piece, formations, onUpdatePiece, onNavigateFormation }: PieceNotesPanelProps) {
  const formationsWithNotes = formations.filter(
    (f) => f.choreo_notes.trim() || f.counts_notes.trim()
  );

  return (
    <div className="space-y-4 max-w-2xl">
      <Card header={<h3 className="text-sm font-semibold text-text-primary">Piece Notes</h3>}>
        <Textarea
          value={piece.notes}
          onChange={(e) => onUpdatePiece({ notes: e.target.value })}
          placeholder="General notes about this piece..."
          rows={6}
        />
      </Card>

      <Card header={<h3 className="text-sm font-semibold text-text-primary">Formation Notes Overview</h3>}>
        {formationsWithNotes.length === 0 ? (
          <p className="text-sm text-text-tertiary">No formation notes yet. Add notes on the Canvas tab.</p>
        ) : (
          <div className="space-y-3">
            {formationsWithNotes.map((f) => (
              <button
                key={f.id}
                onClick={() => onNavigateFormation(f.id)}
                className="w-full text-left p-3 rounded-xl bg-surface-secondary hover:bg-surface-elevated transition-colors"
              >
                <p className="text-xs font-semibold text-text-primary mb-1">{f.label}</p>
                {f.choreo_notes.trim() && (
                  <p className="text-xs text-text-secondary line-clamp-2">{f.choreo_notes}</p>
                )}
                {f.counts_notes.trim() && (
                  <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">{f.counts_notes}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
