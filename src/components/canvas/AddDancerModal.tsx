import { useState } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { Dancer, Formation } from '@/types';

export interface AddDancerParams {
  dancer: { id: string | null; color: string };
  create?: { fullName: string; shortName: string };
  formationRange: [number, number]; // [startIdx, endIdx] inclusive
}

interface AddDancerModalProps {
  open: boolean;
  onClose: () => void;
  rosterDancers: Dancer[];
  /** IDs of dancers already in this piece */
  assignedDancerIds: Set<string>;
  formations: Formation[];
  activeFormationIndex: number;
  onAddDancers: (params: AddDancerParams) => Promise<void>;
}

type RangeMode = 'this' | 'this-and-after' | 'all' | 'custom';

export function AddDancerModal({
  open,
  onClose,
  rosterDancers,
  assignedDancerIds,
  formations,
  activeFormationIndex,
  onAddDancers,
}: AddDancerModalProps) {
  const [mode, setMode] = useState<'pick' | 'create' | 'range'>('pick');
  const [fullName, setFullName] = useState('');
  const [shortName, setShortName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  // Range step state
  const [pendingDancer, setPendingDancer] = useState<{ id: string | null; color: string } | null>(null);
  const [pendingCreate, setPendingCreate] = useState<{ fullName: string; shortName: string } | null>(null);
  const [rangeMode, setRangeMode] = useState<RangeMode>('this-and-after');
  const [customStart, setCustomStart] = useState(0);
  const [customEnd, setCustomEnd] = useState(0);

  function handleClose() {
    setMode('pick');
    setFullName('');
    setShortName('');
    setSearch('');
    setPendingDancer(null);
    setPendingCreate(null);
    setRangeMode('this-and-after');
    onClose();
  }

  function goToRange(dancer: { id: string | null; color: string }, create?: { fullName: string; shortName: string }) {
    setPendingDancer(dancer);
    setPendingCreate(create ?? null);
    setCustomStart(activeFormationIndex);
    setCustomEnd(formations.length - 1);
    setMode('range');
  }

  function handlePickDancer(dancer: Dancer) {
    goToRange({ id: dancer.id, color: dancer.color });
  }

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    const fn = fullName.trim();
    const sn = shortName.trim() || fn.split(' ')[0];
    goToRange({ id: null, color: '' }, { fullName: fn, shortName: sn });
  }

  function getRange(): [number, number] {
    switch (rangeMode) {
      case 'this': return [activeFormationIndex, activeFormationIndex];
      case 'this-and-after': return [activeFormationIndex, formations.length - 1];
      case 'all': return [0, formations.length - 1];
      case 'custom': return [customStart, customEnd];
    }
  }

  async function handleConfirmAdd() {
    if (!pendingDancer) return;
    setIsSubmitting(true);
    await onAddDancers({
      dancer: pendingDancer,
      create: pendingCreate ?? undefined,
      formationRange: getRange(),
    });
    setIsSubmitting(false);
    handleClose();
  }

  const available = rosterDancers.filter((d) => !assignedDancerIds.has(d.id));
  const filtered = search
    ? available.filter((d) =>
        d.full_name.toLowerCase().includes(search.toLowerCase()) ||
        d.short_name.toLowerCase().includes(search.toLowerCase())
      )
    : available;

  const activeLabel = formations[activeFormationIndex]?.label || `Formation ${activeFormationIndex + 1}`;
  const lastLabel = formations[formations.length - 1]?.label || `Formation ${formations.length}`;
  const firstLabel = formations[0]?.label || 'Formation 1';

  // Range description for the confirm button
  const range = getRange();
  const rangeCount = range[1] - range[0] + 1;

  return (
    <Modal open={open} onClose={handleClose} title="Add Dancer to Piece">
      <div className="space-y-4">
        {mode === 'range' ? (
          /* ─── Range Picker Step ─── */
          <>
            <button
              onClick={() => { setMode(pendingCreate ? 'create' : 'pick'); setPendingDancer(null); }}
              className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={14} />
              Back
            </button>

            <p className="text-sm text-text-secondary">
              Add {pendingCreate ? <strong>{pendingCreate.shortName}</strong> : 'dancer'} to which formations?
            </p>

            <div className="space-y-2">
              <RangeOption
                selected={rangeMode === 'this'}
                onClick={() => setRangeMode('this')}
                label="This formation only"
                description={activeLabel}
              />
              <RangeOption
                selected={rangeMode === 'this-and-after'}
                onClick={() => setRangeMode('this-and-after')}
                label="This formation and all after"
                description={`${activeLabel} through ${lastLabel}`}
              />
              <RangeOption
                selected={rangeMode === 'all'}
                onClick={() => setRangeMode('all')}
                label="All formations"
                description={`${firstLabel} through ${lastLabel}`}
              />
              <RangeOption
                selected={rangeMode === 'custom'}
                onClick={() => setRangeMode('custom')}
                label="Custom range"
                description={rangeMode === 'custom' ? undefined : 'Pick start and end'}
              />
            </div>

            {/* Custom range dropdowns */}
            {rangeMode === 'custom' && (
              <div className="flex items-center gap-2 pl-4">
                <select
                  value={customStart}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    setCustomStart(v);
                    if (v > customEnd) setCustomEnd(v);
                  }}
                  className="flex-1 text-sm bg-surface-secondary border border-border rounded-lg px-2.5 py-2 text-text-primary"
                >
                  {formations.map((f, i) => (
                    <option key={f.id} value={i}>{f.label || `Formation ${i + 1}`}</option>
                  ))}
                </select>
                <span className="text-text-tertiary text-sm">to</span>
                <select
                  value={customEnd}
                  onChange={(e) => setCustomEnd(parseInt(e.target.value))}
                  className="flex-1 text-sm bg-surface-secondary border border-border rounded-lg px-2.5 py-2 text-text-primary"
                >
                  {formations.map((f, i) => (
                    <option key={f.id} value={i} disabled={i < customStart}>
                      {f.label || `Formation ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleConfirmAdd} loading={isSubmitting}>
                <Plus size={14} />
                Add to {rangeCount} formation{rangeCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </>
        ) : mode === 'pick' ? (
          /* ─── Pick from Roster ─── */
          <>
            <div className="flex gap-1 bg-surface-secondary rounded-lg p-1">
              <button
                onClick={() => setMode('pick')}
                className={cn(
                  'flex-1 text-sm py-1.5 rounded-md transition-colors font-medium',
                  'bg-surface-elevated text-text-primary shadow-sm'
                )}
              >
                From Roster
              </button>
              <button
                onClick={() => setMode('create')}
                className="flex-1 text-sm py-1.5 rounded-md transition-colors font-medium text-text-secondary hover:text-text-primary"
              >
                New Dancer
              </button>
            </div>

            {rosterDancers.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-text-tertiary mb-3">No dancers in your roster yet.</p>
                <Button variant="secondary" size="sm" onClick={() => setMode('create')}>
                  <Plus size={14} />
                  Create First Dancer
                </Button>
              </div>
            ) : available.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-text-tertiary mb-3">All roster dancers are already in this piece.</p>
                <Button variant="secondary" size="sm" onClick={() => setMode('create')}>
                  <Plus size={14} />
                  Create New Dancer
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-text-secondary font-medium">Tap a dancer below to add them to this piece</p>
                {available.length > 5 && (
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search dancers..."
                    autoFocus
                  />
                )}
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {filtered.map((dancer) => (
                    <button
                      key={dancer.id}
                      onClick={() => handlePickDancer(dancer)}
                      className="flex items-center gap-3 w-full p-3 rounded-xl border border-border hover:border-text-tertiary hover:bg-surface-secondary/50 transition-all text-left group"
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: dancer.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary">{dancer.full_name}</p>
                        {dancer.short_name !== dancer.full_name && (
                          <p className="text-xs text-text-secondary">{dancer.short_name}</p>
                        )}
                      </div>
                      <Plus size={14} className="text-text-tertiary group-hover:text-text-primary shrink-0 transition-colors" />
                    </button>
                  ))}
                  {filtered.length === 0 && search && (
                    <p className="text-sm text-text-tertiary text-center py-4">No matches found</p>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          /* ─── Create New Dancer ─── */
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="flex gap-1 bg-surface-secondary rounded-lg p-1">
              <button
                type="button"
                onClick={() => setMode('pick')}
                className="flex-1 text-sm py-1.5 rounded-md transition-colors font-medium text-text-secondary hover:text-text-primary"
              >
                From Roster
              </button>
              <button
                type="button"
                onClick={() => setMode('create')}
                className={cn(
                  'flex-1 text-sm py-1.5 rounded-md transition-colors font-medium',
                  'bg-surface-elevated text-text-primary shadow-sm'
                )}
              >
                New Dancer
              </button>
            </div>

            <p className="text-sm text-text-secondary">
              Creates a new dancer in your roster and adds them to this piece.
            </p>
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g., Sarah Johnson"
              required
              autoFocus
            />
            <Input
              label="Display Name"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              placeholder="e.g., Sarah"
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setMode('pick')}>Back</Button>
              <Button type="submit" disabled={!fullName.trim()}>
                Next
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

/** Radio-style option card for the range picker */
function RangeOption({
  selected,
  onClick,
  label,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-xl border transition-all',
        selected
          ? 'border-[var(--color-accent)] accent-bg-light ring-1 ring-[var(--color-accent)]'
          : 'border-border hover:border-text-tertiary hover:bg-surface-secondary/50'
      )}
    >
      <p className="text-sm font-medium text-text-primary">{label}</p>
      {description && (
        <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
      )}
    </button>
  );
}
