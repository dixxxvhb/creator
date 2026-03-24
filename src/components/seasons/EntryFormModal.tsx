import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { ENTRY_CATEGORIES, AWARD_TIERS } from '@/types';
import type { CompetitionEntry, CompetitionEntryInsert, Piece } from '@/types';

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

  const selectedPiece = pieces.find((p) => p.id === pieceId) ?? null;

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
    }
  }, [open, entry]);

  // Auto-suggest category when piece is selected (only if not editing)
  useEffect(() => {
    if (selectedPiece && !entry) {
      const suggested = groupSizeToCategory(selectedPiece.group_size);
      if (suggested) setCategory(suggested);
    }
  }, [selectedPiece, entry]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pieceId) return;
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
    });
    setIsSubmitting(false);
    onClose();
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
        </div>

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
          <Select
            label="Age Division"
            options={divisionOptions}
            value={ageDivision}
            onChange={(e) => setAgeDivision(e.target.value)}
          />
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
    </Modal>
  );
}
