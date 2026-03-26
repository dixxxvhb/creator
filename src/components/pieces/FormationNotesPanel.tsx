import { useState } from 'react';
import { ChevronDown, ChevronUp, Volume2, UserPlus, UserMinus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { AudioUploader } from '@/components/audio/AudioUploader';
import { AudioPlayer } from '@/components/audio/AudioPlayer';
import { AudioTimeline } from '@/components/audio/AudioTimeline';
import { WaveformTimeline } from '@/components/audio/WaveformTimeline';
import { PositionRow } from './PositionRow';
import type { Piece, Formation, DancerPosition, Dancer } from '@/types';

interface FormationNotesPanelProps {
  piece: Piece;
  activeFormation: Formation;
  activeFormationId: string;
  activePositions: DancerPosition[];
  localChoreoNotes: string;
  localCountsNotes: string;
  onChoreoNotesChange: (value: string) => void;
  onCountsNotesChange: (value: string) => void;
  // Audio
  formations: Formation[];
  isAudioPlaying: boolean;
  audioCurrentTime: number;
  audioDuration: number;
  audioUrl: string | null;
  toggleAudio: () => void;
  seekAudio: (time: number) => void;
  hasAudio: boolean;
  onAudioUpload: (file: File) => Promise<void>;
  onAudioRemove: () => Promise<void>;
  onUpdateTimestamp: (formationId: string, timestamp: number) => void;
  onSelectFormation: (id: string) => void;
  // Dancers
  rosterDancers: Dancer[];
  onToggleFocal: (dancerId: string | null) => void;
  onAssign: (formationId: string, positionId: string, dancerId: string | null, color?: string) => void;
  onQuickAdd: (name: string, positionId: string) => void;
  onAddDancer: () => void;
  onRemoveDancer: (label?: string) => void;
}

export function FormationNotesPanel({
  piece,
  activeFormation,
  activeFormationId,
  activePositions,
  localChoreoNotes,
  localCountsNotes,
  onChoreoNotesChange,
  onCountsNotesChange,
  formations,
  isAudioPlaying,
  audioCurrentTime,
  audioDuration,
  audioUrl,
  toggleAudio,
  seekAudio,
  hasAudio,
  onAudioUpload,
  onAudioRemove,
  onUpdateTimestamp,
  onSelectFormation,
  rosterDancers,
  onToggleFocal,
  onAssign,
  onQuickAdd,
  onAddDancer,
  onRemoveDancer,
}: FormationNotesPanelProps) {
  const [audioOpen, setAudioOpen] = useState(true);

  return (
    <div className="w-full space-y-4 min-w-0">
      <Card
        header={
          <h3 className="text-sm font-semibold text-text-primary">
            {activeFormation.label} — Notes
          </h3>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="Choreography Notes"
            value={localChoreoNotes}
            onChange={(e) => onChoreoNotesChange(e.target.value)}
            placeholder="Movement descriptions, directions, dynamics..."
            rows={5}
          />
          <Textarea
            label="Counts & Timing"
            value={localCountsNotes}
            onChange={(e) => onCountsNotesChange(e.target.value)}
            placeholder="5-6-7-8, hold 4 counts, transition on 1..."
            rows={4}
          />
        </div>
      </Card>

      {/* Audio */}
      <Card
        header={
          <button
            onClick={() => setAudioOpen((o) => !o)}
            className="flex items-center justify-between w-full"
          >
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
              <Volume2 size={14} />
              Audio
            </h3>
            {audioOpen ? <ChevronUp size={14} className="text-text-secondary" /> : <ChevronDown size={14} className="text-text-secondary" />}
          </button>
        }
      >
        {audioOpen && (
          <div className="space-y-3">
            {hasAudio ? (
              <>
                <AudioPlayer
                  isPlaying={isAudioPlaying}
                  currentTime={audioCurrentTime}
                  duration={audioDuration}
                  onToggle={toggleAudio}
                  onSeek={seekAudio}
                />
                {audioDuration > 0 && (
                  audioUrl ? (
                    <WaveformTimeline
                      audioUrl={audioUrl}
                      formations={formations}
                      activeFormationId={activeFormationId}
                      currentTime={audioCurrentTime}
                      duration={audioDuration}
                      isPlaying={isAudioPlaying}
                      onSeek={seekAudio}
                      onPlay={toggleAudio}
                      onPause={toggleAudio}
                      onUpdateTimestamp={onUpdateTimestamp}
                      onSelectFormation={onSelectFormation}
                    />
                  ) : (
                    <AudioTimeline
                      formations={formations}
                      duration={audioDuration}
                      currentTime={audioCurrentTime}
                      activeFormationId={activeFormationId}
                      onSeek={seekAudio}
                      onUpdateTimestamp={onUpdateTimestamp}
                      onSelectFormation={onSelectFormation}
                    />
                  )
                )}
                <AudioUploader
                  onUpload={onAudioUpload}
                  hasAudio={true}
                  onRemove={onAudioRemove}
                />
              </>
            ) : (
              <AudioUploader
                onUpload={onAudioUpload}
                hasAudio={false}
                onRemove={onAudioRemove}
              />
            )}
          </div>
        )}
      </Card>

      <Card>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              Dancers ({piece.dancer_count})
            </h4>
            <div className="flex items-center gap-1.5">
              <Button variant="secondary" size="sm" onClick={onAddDancer}>
                <UserPlus size={12} />
                Add
              </Button>
              <Button variant="secondary" size="sm" onClick={() => onRemoveDancer()} disabled={piece.dancer_count <= 0}>
                <UserMinus size={12} />
              </Button>
            </div>
          </div>
          {activePositions.length === 0 ? (
            <p className="text-sm text-text-tertiary">No dancers in this formation</p>
          ) : (
            <div className="space-y-1.5">
              {activePositions.map((pos) => (
                <PositionRow
                  key={pos.id}
                  pos={pos}
                  rosterDancers={rosterDancers}
                  activeFormationId={activeFormationId}
                  isFocal={piece.focal_dancer_id === pos.dancer_id && pos.dancer_id !== null}
                  onToggleFocal={onToggleFocal}
                  onAssign={onAssign}
                  onQuickAdd={onQuickAdd}
                  onRemove={piece.dancer_count > 1 ? onRemoveDancer : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
