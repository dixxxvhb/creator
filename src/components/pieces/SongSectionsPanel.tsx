import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useSongSectionStore } from '@/stores/songSectionStore';
import { SECTION_TYPES } from '@/types';
import type { Piece, Formation, SongSectionInsert } from '@/types';

// Color map for section types
const SECTION_COLORS: Record<string, string> = {
  Intro: '#3B82F6',
  Verse: '#22C55E',
  'Pre-Chorus': '#F59E0B',
  Chorus: '#EF4444',
  Bridge: '#A855F7',
  Outro: '#6366F1',
  Break: '#64748B',
  Custom: '#EC4899',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function parseTime(str: string): number {
  const parts = str.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return parseFloat(str) || 0;
}

interface SongSectionsPanelProps {
  piece: Piece;
  formations: Formation[];
}

export function SongSectionsPanel({ piece, formations }: SongSectionsPanelProps) {
  const sections = useSongSectionStore((s) => s.sections);
  const addSection = useSongSectionStore((s) => s.add);
  const updateSection = useSongSectionStore((s) => s.update);
  const removeSection = useSongSectionStore((s) => s.remove);
  const [isAdding, setIsAdding] = useState(false);

  const duration = piece.duration_seconds ?? 0;

  if (!duration) {
    return (
      <div className="max-w-2xl">
        <Card>
          <div className="text-center py-8">
            <p className="text-sm text-text-secondary mb-1">No song duration set</p>
            <p className="text-xs text-text-tertiary">Set the song length in piece info to use song sections.</p>
          </div>
        </Card>
      </div>
    );
  }

  async function handleAddSection() {
    setIsAdding(true);
    const lastEnd = sections.length > 0 ? Math.max(...sections.map((s) => s.end_seconds)) : 0;
    const newSection: SongSectionInsert = {
      piece_id: piece.id,
      label: 'New Section',
      section_type: 'Custom',
      start_seconds: lastEnd,
      end_seconds: Math.min(lastEnd + 15, duration),
      formation_id: null,
      sort_order: sections.length,
    };
    await addSection(newSection);
    setIsAdding(false);
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Timeline bar */}
      <Card>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Timeline</h3>
            <span className="text-xs text-text-tertiary">{formatTime(duration)}</span>
          </div>
          <div className="relative h-8 bg-surface-secondary rounded-lg overflow-hidden">
            {sections.map((section) => {
              const left = (section.start_seconds / duration) * 100;
              const width = ((section.end_seconds - section.start_seconds) / duration) * 100;
              return (
                <div
                  key={section.id}
                  className="absolute top-0 bottom-0 flex items-center justify-center text-[10px] font-medium text-white truncate px-1"
                  style={{
                    left: `${left}%`,
                    width: `${Math.max(width, 1)}%`,
                    backgroundColor: SECTION_COLORS[section.section_type] ?? SECTION_COLORS.Custom,
                    opacity: 0.85,
                  }}
                  title={`${section.label} (${formatTime(section.start_seconds)} - ${formatTime(section.end_seconds)})`}
                >
                  {width > 8 ? section.label : ''}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Section list */}
      <Card>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Sections ({sections.length})</h3>
            <Button size="sm" onClick={handleAddSection} loading={isAdding}>
              <Plus size={14} />
              Add
            </Button>
          </div>

          {sections.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-4">No sections yet. Add one to map out the song structure.</p>
          ) : (
            <div className="space-y-2">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="p-3 rounded-xl border border-border space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: SECTION_COLORS[section.section_type] ?? SECTION_COLORS.Custom }}
                    />
                    <Input
                      value={section.label}
                      onChange={(e) => updateSection(section.id, { label: e.target.value })}
                      className="flex-1 text-sm"
                    />
                    <button
                      onClick={() => removeSection(section.id)}
                      className="p-1.5 rounded-lg text-text-secondary hover:text-red-400 hover:bg-surface-secondary transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Select
                      label="Type"
                      options={SECTION_TYPES.map((t) => ({ value: t, label: t }))}
                      value={section.section_type}
                      onChange={(e) => updateSection(section.id, {
                        section_type: e.target.value as typeof section.section_type,
                        label: section.label === 'New Section' ? e.target.value : section.label,
                      })}
                    />
                    <Input
                      label="Start"
                      value={formatTime(section.start_seconds)}
                      onChange={(e) => updateSection(section.id, { start_seconds: parseTime(e.target.value) })}
                      placeholder="0:00"
                    />
                    <Input
                      label="End"
                      value={formatTime(section.end_seconds)}
                      onChange={(e) => updateSection(section.id, { end_seconds: parseTime(e.target.value) })}
                      placeholder="0:30"
                    />
                  </div>

                  {formations.length > 0 && (
                    <Select
                      label="Linked Formation"
                      options={[
                        { value: '', label: 'None' },
                        ...formations.map((f) => ({ value: f.id, label: f.label })),
                      ]}
                      value={section.formation_id ?? ''}
                      onChange={(e) => updateSection(section.id, { formation_id: e.target.value || null })}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
