import { useState, useEffect, useMemo } from 'react';
import { Plus, Info } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { QuickAddPieceModal } from '@/components/pieces';
import { ENTRY_CATEGORIES, AWARD_TIERS } from '@/types';
import { computeAgeAtDate } from '@/lib/age';
import { useRosterStore } from '@/stores/rosterStore';
import type { CompetitionEntry, CompetitionEntryInsert, Piece, Dancer, DancerPosition } from '@/types';

interface EntryFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CompetitionEntryInsert) => Promise<void>;
  competitionId: string;
  pieces: Piece[];
  entry?: CompetitionEntry | null;
  // Competition config for dropdowns
  divisions?: { name: string; minAge: number; maxAge: number }[];
  categories?: string[];
  levels?: string[];
  styles?: string[];
  // Feature 2: duplicate detection
  existingEntries?: CompetitionEntry[];
  // Feature 1 & 3: competition date + piece positions
  competitionDate?: string | null;
  /** Map of piece_id -> DancerPosition[] (first formation positions) */
  piecePositions?: Record<string, DancerPosition[]>;
}

const PLACEMENT_OPTIONS = [
  { value: '', label: 'No placement yet' },
  { value: '1st Overall', label: '1st Overall' },
  { value: '2nd Overall', label: '2nd Overall' },
  { value: '3rd Overall', label: '3rd Overall' },
  { value: 'High Platinum', label: 'High Platinum' },
  { value: 'Platinum', label: 'Platinum' },
  { value: 'High Gold', label: 'High Gold' },
  { value: 'Gold', label: 'Gold' },
  { value: 'High Silver', label: 'High Silver' },
  { value: 'Silver', label: 'Silver' },
];

function groupSizeToCategory(groupSize: string | null): string {
  switch (groupSize) {
    case 'solo': return 'Solo';
    case 'duo': return 'Duo';
    case 'trio': return 'Trio';
    case 'small_group': return 'Small Group';
    case 'large_group': return 'Large Group';
    default: return '';
  }
}

/**
 * Given a youngest dancer age and the division config, find the matching division name.
 */
function matchDivision(
  youngestAge: number,
  divisions: { name: string; minAge: number; maxAge: number }[],
): string | null {
  for (const div of divisions) {
    if (youngestAge >= div.minAge && youngestAge <= div.maxAge) {
      return div.name;
    }
  }
  return null;
}

/**
 * Resolve dancer names from positions using the roster.
 */
function resolveDancerNames(
  positions: DancerPosition[],
  dancers: Dancer[],
): string[] {
  const dancerMap = new Map(dancers.map((d) => [d.id, d]));
  // Deduplicate by dancer_id (positions may repeat across formations)
  const seen = new Set<string>();
  const names: string[] = [];
  for (const pos of positions) {
    const key = pos.dancer_id ?? pos.dancer_label;
    if (seen.has(key)) continue;
    seen.add(key);
    if (pos.dancer_id) {
      const dancer = dancerMap.get(pos.dancer_id);
      names.push(dancer?.full_name ?? dancer?.short_name ?? pos.dancer_label);
    } else {
      names.push(pos.dancer_label);
    }
  }
  return names;
}

export function EntryFormModal({
  open,
  onClose,
  onSubmit,
  competitionId,
  pieces,
  entry,
  divisions,
  categories,
  levels,
  styles,
  existingEntries,
  competitionDate,
  piecePositions,
}: EntryFormModalProps) {
  const [pieceId, setPieceId] = useState('');
  const [category, setCategory] = useState('');
  const [ageDivision, setAgeDivision] = useState('');
  const [competitiveLevel, setCompetitiveLevel] = useState('');
  const [style, setStyle] = useState('');
  const [choreographer, setChoreographer] = useState('');
  const [placement, setPlacement] = useState('');
  const [awardTier, setAwardTier] = useState('');
  const [score, setScore] = useState('');
  const [specialAwards, setSpecialAwards] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const [autoAgeDivisionInfo, setAutoAgeDivisionInfo] = useState<string | null>(null);

  const rosterDancers = useRosterStore((s) => s.dancers);
  const selectedPiece = pieces.find((p) => p.id === pieceId) ?? null;

  // Get positions for the selected piece
  const selectedPiecePositions = useMemo(() => {
    if (!pieceId || !piecePositions) return [];
    return piecePositions[pieceId] ?? [];
  }, [pieceId, piecePositions]);

  // Feature 3: Resolve dancer names from positions
  const dancerNames = useMemo(() => {
    if (selectedPiecePositions.length === 0) return [];
    return resolveDancerNames(selectedPiecePositions, rosterDancers);
  }, [selectedPiecePositions, rosterDancers]);

  useEffect(() => {
    if (open) {
      setPieceId(entry?.piece_id ?? '');
      setCategory(entry?.category ?? '');
      setAgeDivision(entry?.age_division ?? '');
      setCompetitiveLevel(entry?.competitive_level ?? '');
      setStyle(entry?.style ?? '');
      setChoreographer(entry?.choreographer ?? '');
      setPlacement(entry?.placement ?? '');
      setAwardTier(entry?.award_tier ?? '');
      setScore(entry?.score?.toString() ?? '');
      setSpecialAwards(entry?.special_awards ?? '');
      setNotes(entry?.notes ?? '');
      setAutoAgeDivisionInfo(null);
      setShowDuplicateConfirm(false);
    }
  }, [open, entry]);

  // Auto-suggest category when piece is selected (only if not editing)
  useEffect(() => {
    if (selectedPiece && !entry) {
      const suggested = groupSizeToCategory(selectedPiece.group_size);
      if (suggested) setCategory(suggested);
    }
  }, [selectedPiece, entry]);

  // Feature 1: Auto-suggest age division from dancer birthdates
  useEffect(() => {
    if (!selectedPiece || entry || !divisions || divisions.length === 0 || selectedPiecePositions.length === 0) {
      setAutoAgeDivisionInfo(null);
      return;
    }

    const refDate = competitionDate ? new Date(competitionDate + 'T00:00:00') : new Date();
    const dancerMap = new Map(rosterDancers.map((d) => [d.id, d]));

    // Get all dancer ages from positions
    const ages: number[] = [];
    const seen = new Set<string>();
    for (const pos of selectedPiecePositions) {
      const key = pos.dancer_id ?? pos.dancer_label;
      if (seen.has(key)) continue;
      seen.add(key);
      if (pos.dancer_id) {
        const dancer = dancerMap.get(pos.dancer_id);
        if (dancer?.birthday) {
          const age = computeAgeAtDate(dancer.birthday, refDate);
          if (age !== null) ages.push(age);
        }
      }
    }

    if (ages.length === 0) {
      setAutoAgeDivisionInfo(null);
      return;
    }

    const youngestAge = Math.min(...ages);
    const matchedDivision = matchDivision(youngestAge, divisions);

    if (matchedDivision) {
      setAgeDivision(matchedDivision);
      setAutoAgeDivisionInfo(`Auto: ${matchedDivision} (youngest dancer age: ${youngestAge})`);
    } else {
      setAutoAgeDivisionInfo(`No matching division for youngest age ${youngestAge}`);
    }
  }, [selectedPiece, entry, divisions, selectedPiecePositions, rosterDancers, competitionDate]);

  // Build category options from competition config or fallback
  const categoryOptions = [
    { value: '', label: 'Select category...' },
    ...(categories ?? [...ENTRY_CATEGORIES]).map((c) => ({ value: c, label: c })),
  ];

  // Build division options
  const divisionOptions = [
    { value: '', label: 'Select division...' },
    ...(divisions ?? []).map((d) => ({ value: d.name, label: `${d.name} (${d.minAge}–${d.maxAge})` })),
  ];

  // Build level options
  const levelOptions = [
    { value: '', label: 'Select level...' },
    ...(levels ?? []).map((l) => ({ value: l, label: l })),
  ];

  // Build style options
  const styleOptions = [
    { value: '', label: 'Select style...' },
    ...(styles ?? []).map((s) => ({ value: s, label: s })),
  ];

  const awardTierOptions = [
    { value: '', label: 'No award tier' },
    ...AWARD_TIERS.map((t) => ({ value: t, label: t })),
  ];

  const pieceOptions = [
    { value: '', label: 'Select a piece...' },
    ...pieces.map((p) => ({ value: p.id, label: p.title })),
  ];

  async function doSubmit() {
    if (!pieceId) return;
    if (score && parseFloat(score) < 0) return;
    setIsSubmitting(true);
    await onSubmit({
      competition_id: competitionId,
      piece_id: pieceId,
      category: category.trim(),
      age_division: ageDivision || null,
      competitive_level: competitiveLevel || null,
      style: style || null,
      award_tier: awardTier || null,
      choreographer: choreographer.trim() || null,
      song_title: selectedPiece?.song_title || null,
      song_artist: selectedPiece?.song_artist || null,
      placement: placement || null,
      score: score ? parseFloat(score) : null,
      special_awards: specialAwards.trim() || null,
      notes,
      dancer_names: dancerNames.length > 0 ? dancerNames : undefined,
    });
    setIsSubmitting(false);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pieceId) return;

    // Feature 2: Duplicate entry detection (only for new entries)
    if (!entry && existingEntries) {
      const isDuplicate = existingEntries.some((e) => e.piece_id === pieceId);
      if (isDuplicate) {
        setShowDuplicateConfirm(true);
        return;
      }
    }

    await doSubmit();
  }

  return (
    <Modal open={open} onClose={onClose} title={entry ? 'Edit Entry' : 'Add Entry'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Piece selector */}
        <div>
          <Select
            label="Piece"
            options={pieceOptions}
            value={pieceId}
            onChange={(e) => setPieceId(e.target.value)}
          />
          {selectedPiece?.song_title && (
            <p className="text-xs text-text-secondary mt-1.5">
              Song: {selectedPiece.song_title}{selectedPiece.song_artist ? ` — ${selectedPiece.song_artist}` : ''}
            </p>
          )}
          <button
            type="button"
            onClick={() => setShowQuickAdd(true)}
            className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1 mt-1"
          >
            <Plus size={12} /> New Piece
          </button>
        </div>

        {/* Feature 3: Dancer names badges */}
        {dancerNames.length > 0 && (
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1.5">Dancers</label>
            <div className="flex flex-wrap gap-1.5">
              {dancerNames.map((name) => (
                <span
                  key={name}
                  className="inline-block text-xs px-2 py-0.5 rounded-full bg-surface-secondary text-text-primary"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Category */}
        {categoryOptions.length > 1 ? (
          <Select
            label="Category"
            options={categoryOptions}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        ) : (
          <Input
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Teen Contemporary Small Group"
          />
        )}

        {/* Age Division */}
        {divisionOptions.length > 1 && (
          <div>
            <Select
              label="Age Division"
              options={divisionOptions}
              value={ageDivision}
              onChange={(e) => {
                setAgeDivision(e.target.value);
                // Clear auto info when user manually overrides
                if (autoAgeDivisionInfo) setAutoAgeDivisionInfo(null);
              }}
            />
            {autoAgeDivisionInfo && (
              <p className="text-xs text-[var(--color-accent)] mt-1 flex items-center gap-1">
                <Info size={12} />
                {autoAgeDivisionInfo}
              </p>
            )}
          </div>
        )}

        {/* Competitive Level */}
        {levelOptions.length > 1 && (
          <Select
            label="Competitive Level"
            options={levelOptions}
            value={competitiveLevel}
            onChange={(e) => setCompetitiveLevel(e.target.value)}
          />
        )}

        {/* Style */}
        {styleOptions.length > 1 && (
          <Select
            label="Style"
            options={styleOptions}
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          />
        )}

        {/* Choreographer */}
        <Input
          label="Choreographer"
          value={choreographer}
          onChange={(e) => setChoreographer(e.target.value)}
          placeholder="e.g. Dixon Van Hoozer-Bowles"
        />

        {/* Placement + Award Tier */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Placement"
            options={PLACEMENT_OPTIONS}
            value={placement}
            onChange={(e) => setPlacement(e.target.value)}
          />
          <Select
            label="Award Tier"
            options={awardTierOptions}
            value={awardTier}
            onChange={(e) => setAwardTier(e.target.value)}
          />
        </div>

        {/* Score */}
        <Input
          label="Score"
          type="number"
          step="0.01"
          min="0"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="e.g. 285.50"
        />

        <Input
          label="Special Awards"
          value={specialAwards}
          onChange={(e) => setSpecialAwards(e.target.value)}
          placeholder="e.g. Best Choreography, Judges' Choice"
        />
        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Judge feedback, performance notes..."
          rows={3}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={!pieceId}>
            {entry ? 'Save Changes' : 'Add Entry'}
          </Button>
        </div>
      </form>

      {/* Feature 2: Duplicate entry confirmation dialog */}
      <Modal
        open={showDuplicateConfirm}
        onClose={() => setShowDuplicateConfirm(false)}
        title="Duplicate Entry"
      >
        <p className="text-sm text-text-secondary mb-4">
          This piece is already entered in this competition. Add another entry?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDuplicateConfirm(false)}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setShowDuplicateConfirm(false);
              await doSubmit();
            }}
          >
            Add Anyway
          </Button>
        </div>
      </Modal>

      <QuickAddPieceModal
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onCreated={(piece) => {
          setPieceId(piece.id);
        }}
      />
    </Modal>
  );
}
