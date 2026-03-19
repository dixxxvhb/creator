import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import type { PieceInsert } from '@/types';
import { DANCE_STYLES, GROUP_SIZES } from '@/types';

interface PieceSetupFormProps {
  onSubmit: (data: PieceInsert, groupSize: string) => void;
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

  function handleGroupSizeChange(value: string) {
    setGroupSize(value);
    const match = GROUP_SIZES.find((g) => g.value === value);
    if (match) setDancerCount(match.defaultCount);
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
      stage_width: 40,
      stage_depth: 30,
      notes: notes.trim(),
      sort_order: 0,
    };

    onSubmit(data, groupSize);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* Title — full width */}
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

      {/* Dancer Count */}
      <Input
        label="Dancer Count"
        type="number"
        min={1}
        value={dancerCount}
        onChange={(e) => setDancerCount(parseInt(e.target.value) || 1)}
        required
      />

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
