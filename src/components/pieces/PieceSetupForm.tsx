import { useState, useEffect } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useRosterStore } from '@/stores/rosterStore';
import { useProfileStore } from '@/stores/profileStore';
import type { PieceInsert, DancerInsert } from '@/types';
import { DANCE_STYLES, GROUP_SIZES, DANCER_COLORS } from '@/types';

interface PieceSetupFormProps {
  onSubmit: (data: PieceInsert, groupSize: string, selectedDancerIds: string[]) => void;
  isSubmitting: boolean;
}

const styleOptions = DANCE_STYLES.map((s) => ({ value: s, label: s }));
const groupSizeOptions = GROUP_SIZES.map((g) => ({ value: g.value, label: g.label }));

export function PieceSetupForm({ onSubmit, isSubmitting }: PieceSetupFormProps) {
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState<string>(DANCE_STYLES[0]);
  const [groupSize, setGroupSize] = useState<string>(GROUP_SIZES[0].value);
  const [dancerCount, setDancerCount] = useState<number>(GROUP_SIZES[0].defaultCount);
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [bpm, setBpm] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [notes, setNotes] = useState('');

  // Dancer selection
  const [selectedDancerIds, setSelectedDancerIds] = useState<string[]>([]);
  const [showNewDancer, setShowNewDancer] = useState(false);
  const [newDancerName, setNewDancerName] = useState('');
  const [newDancerShort, setNewDancerShort] = useState('');

  const rosterDancers = useRosterStore((s) => s.dancers);
  const loadRoster = useRosterStore((s) => s.load);
  const addRosterDancer = useRosterStore((s) => s.add);

  const defaultStageWidth = useProfileStore((s) => s.defaultStageWidth);
  const defaultStageDepth = useProfileStore((s) => s.defaultStageDepth);

  useEffect(() => {
    if (rosterDancers.length === 0) loadRoster();
  }, [rosterDancers.length, loadRoster]);

  // Sync dancer count when selections change
  useEffect(() => {
    if (selectedDancerIds.length > 0) {
      setDancerCount(selectedDancerIds.length);
    }
  }, [selectedDancerIds]);

  function handleGroupSizeChange(value: string) {
    setGroupSize(value);
    const match = GROUP_SIZES.find((g) => g.value === value);
    if (match && selectedDancerIds.length === 0) setDancerCount(match.defaultCount);
  }

  function toggleDancer(id: string) {
    setSelectedDancerIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  async function handleAddNewDancer() {
    if (!newDancerName.trim()) return;
    const color = DANCER_COLORS[rosterDancers.length % DANCER_COLORS.length];
    const insert: DancerInsert = {
      full_name: newDancerName.trim(),
      short_name: newDancerShort.trim() || newDancerName.trim().split(' ')[0],
      birthday: null,
      color,
      is_active: true,
      height: null, weight: null, bust: null, waist: null, hips: null, inseam: null,
      shoe_size: null, tights_size: null, headpiece_size: null,
      parent_name: null, parent_email: null, parent_phone: null,
      notes: '',
    };
    const created = await addRosterDancer(insert);
    if (created) {
      setSelectedDancerIds((prev) => [...prev, created.id]);
      setNewDancerName('');
      setNewDancerShort('');
      setShowNewDancer(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const mins = parseInt(minutes) || 0;
    const secs = parseInt(seconds) || 0;
    const durationSeconds = mins * 60 + secs;

    const data: PieceInsert = {
      title: title.trim(),
      style,
      group_size: groupSize,
      dancer_count: dancerCount,
      song_title: songTitle.trim() || null,
      song_artist: songArtist.trim() || null,
      bpm: bpm ? parseInt(bpm) : null,
      duration_seconds: durationSeconds > 0 ? durationSeconds : null,
      audio_url: null,
      stage_width: defaultStageWidth,
      stage_depth: defaultStageDepth,
      notes: notes.trim(),
      sort_order: 0,
    };

    onSubmit(data, groupSize, selectedDancerIds);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* Title */}
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g., Opening Number"
        required
      />

      {/* Style + Group Size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Style"
          options={styleOptions}
          value={style}
          onChange={(e) => setStyle(e.target.value)}
        />
        <Select
          label="Group Size"
          options={groupSizeOptions}
          value={groupSize}
          onChange={(e) => handleGroupSizeChange(e.target.value)}
        />
      </div>

      {/* Dancers section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-text-secondary">
            Dancers ({selectedDancerIds.length > 0 ? `${selectedDancerIds.length} selected` : dancerCount})
          </label>
          {selectedDancerIds.length === 0 && (
            <span className="text-xs text-text-tertiary">Pick dancers or set a count below</span>
          )}
        </div>

        {/* Roster dancer chips */}
        {rosterDancers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {rosterDancers.map((dancer) => {
              const isSelected = selectedDancerIds.includes(dancer.id);
              return (
                <button
                  key={dancer.id}
                  type="button"
                  onClick={() => toggleDancer(dancer.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all',
                    isSelected
                      ? 'border-[var(--color-accent)] accent-bg-light font-medium'
                      : 'border-border hover:border-text-tertiary text-text-secondary hover:text-text-primary'
                  )}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: dancer.color }}
                  />
                  {dancer.short_name}
                  {isSelected && <Check size={12} className="text-[var(--color-accent)]" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Quick-add new dancer */}
        {showNewDancer ? (
          <div className="flex items-end gap-2 p-3 border border-border rounded-xl bg-surface-secondary/30">
            <Input
              label="Full Name"
              value={newDancerName}
              onChange={(e) => setNewDancerName(e.target.value)}
              placeholder="Jane Doe"
              autoFocus
            />
            <Input
              label="Display Name"
              value={newDancerShort}
              onChange={(e) => setNewDancerShort(e.target.value)}
              placeholder="Jane"
            />
            <Button type="button" size="sm" onClick={handleAddNewDancer} disabled={!newDancerName.trim()}>
              Add
            </Button>
            <button type="button" onClick={() => setShowNewDancer(false)} className="p-2 text-text-tertiary hover:text-text-primary">
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNewDancer(true)}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <Plus size={14} />
            New dancer
          </button>
        )}

        {/* Manual count fallback — only show when no dancers selected */}
        {selectedDancerIds.length === 0 && (
          <Input
            label="Dancer Count"
            type="number"
            min={1}
            value={dancerCount}
            onChange={(e) => setDancerCount(parseInt(e.target.value) || 1)}
            required
          />
        )}
      </div>

      {/* Song info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Song Title"
          value={songTitle}
          onChange={(e) => setSongTitle(e.target.value)}
          placeholder="e.g., River"
        />
        <Input
          label="Song Artist"
          value={songArtist}
          onChange={(e) => setSongArtist(e.target.value)}
          placeholder="e.g., Leon Bridges"
        />
      </div>

      {/* BPM + Duration */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="BPM"
          type="number"
          value={bpm}
          onChange={(e) => setBpm(e.target.value)}
          placeholder="120"
        />
        <Input
          label="Duration (min)"
          type="number"
          min={0}
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          placeholder="3"
        />
        <Input
          label="Duration (sec)"
          type="number"
          min={0}
          max={59}
          value={seconds}
          onChange={(e) => setSeconds(e.target.value)}
          placeholder="30"
        />
      </div>

      {/* Notes */}
      <Textarea
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Any additional notes about this piece..."
        rows={4}
      />

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isSubmitting} size="lg">
          Create Piece
        </Button>
      </div>
    </form>
  );
}
