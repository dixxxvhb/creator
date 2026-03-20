import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TEMPLATES, CATEGORY_LABELS } from '@/lib/formationTemplates';
import type { TemplateInfo, TemplateCategory, RoleAssignment } from '@/lib/formationTemplates';
import { cn } from '@/lib/utils';
import type { Dancer } from '@/types';

interface TemplatePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (templateId: string, roleAssignments?: RoleAssignment[]) => void;
  dancerCount: number;
  hasExistingPositions: boolean;
  currentPositions: { dancer_label: string; dancer_id: string | null; color: string }[];
  rosterDancers: Dancer[];
}

// Mini SVG preview of a template's dot pattern
function TemplatePreview({ template, dancerCount }: { template: TemplateInfo; dancerCount: number }) {
  const previewSize = 80;
  const padding = 8;
  const usable = previewSize - padding * 2;
  const count = Math.max(dancerCount, template.minDancers);
  const positions = template.generate(count, usable, usable);
  const dotR = count > 12 ? 2.5 : count > 6 ? 3 : 3.5;

  return (
    <svg width={previewSize} height={previewSize} className="shrink-0">
      {/* Stage floor */}
      <rect
        x={padding - 2}
        y={padding - 2}
        width={usable + 4}
        height={usable + 4}
        rx={4}
        className="fill-surface-secondary/50 stroke-border"
        strokeWidth={0.5}
      />
      {/* Dots */}
      {positions.map((pos, i) => (
        <circle
          key={i}
          cx={padding + pos.x}
          cy={padding + pos.y}
          r={dotR}
          className={i === 0 && (template.category === 'soloist' || template.category === 'featured') ? 'fill-amber-400' : 'accent-fill'}
          opacity={0.85}
        />
      ))}
    </svg>
  );
}

const CATEGORIES: TemplateCategory[] = ['symmetric', 'asymmetric', 'soloist', 'featured'];

export function TemplatePickerModal({
  open,
  onClose,
  onSelect,
  dancerCount,
  hasExistingPositions,
  currentPositions,
  rosterDancers,
}: TemplatePickerModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('symmetric');
  const [step, setStep] = useState<'pick' | 'roles'>('pick');
  const [roleSelections, setRoleSelections] = useState<(string | '')[]>([]);

  const selectedTemplate = selected ? TEMPLATES.find((t) => t.id === selected) : null;
  const featuredCount = selectedTemplate?.featuredCount ?? 0;

  function handleApply() {
    if (!selected) return;
    if (hasExistingPositions && !confirmOverwrite) {
      setConfirmOverwrite(true);
      return;
    }
    // If template has featured roles and there are dancers to assign, show role step
    if (featuredCount > 0 && currentPositions.length > 0) {
      setRoleSelections(Array(featuredCount).fill(''));
      setStep('roles');
      return;
    }
    onSelect(selected);
    handleClose();
  }

  function handleRolesConfirm() {
    if (!selected) return;
    const assignments: RoleAssignment[] = roleSelections
      .map((label, i) => label ? { positionIndex: i, dancerLabel: label } : null)
      .filter((a): a is RoleAssignment => a !== null);
    onSelect(selected, assignments.length > 0 ? assignments : undefined);
    handleClose();
  }

  function handleClose() {
    setSelected(null);
    setConfirmOverwrite(false);
    setStep('pick');
    setRoleSelections([]);
    onClose();
  }

  // Get display name for a dancer label
  function getDancerName(dancerLabel: string): string {
    const pos = currentPositions.find((p) => p.dancer_label === dancerLabel);
    if (pos?.dancer_id) {
      const roster = rosterDancers.find((d) => d.id === pos.dancer_id);
      if (roster) return `${dancerLabel} — ${roster.short_name}`;
    }
    return dancerLabel;
  }

  // Role label for featured slots
  function getRoleLabel(index: number): string {
    if (featuredCount === 1) return 'Soloist';
    if (featuredCount === 2) return `Featured Dancer ${index + 1}`;
    return `Featured Dancer ${index + 1}`;
  }

  const filteredTemplates = TEMPLATES.filter(
    (t) => t.category === activeCategory && dancerCount >= t.minDancers
  );

  return (
    <Modal open={open} onClose={handleClose} title="Formation Templates" className="sm:max-w-2xl">
      {step === 'roles' ? (
        /* ─── Role Assignment Step ─── */
        <div className="space-y-4">
          <button
            onClick={() => setStep('pick')}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <p className="text-sm text-text-secondary">
            Assign dancers to featured roles in <strong>{selectedTemplate?.name}</strong>.
          </p>

          <div className="space-y-3">
            {roleSelections.map((sel, i) => (
              <div key={i}>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  {getRoleLabel(i)}
                </label>
                <select
                  value={sel}
                  onChange={(e) => {
                    const next = [...roleSelections];
                    next[i] = e.target.value;
                    setRoleSelections(next);
                  }}
                  className="w-full text-sm bg-surface-secondary border border-border rounded-lg px-2.5 py-2 text-text-primary"
                >
                  <option value="">Select dancer...</option>
                  {currentPositions.map((pos) => {
                    const alreadyUsed = roleSelections.some((s, j) => j !== i && s === pos.dancer_label);
                    return (
                      <option key={pos.dancer_label} value={pos.dancer_label} disabled={alreadyUsed}>
                        {getDancerName(pos.dancer_label)}
                      </option>
                    );
                  })}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleRolesConfirm}>
              Apply Template
            </Button>
          </div>
        </div>
      ) : confirmOverwrite ? (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            This will replace the current dancer positions in this formation. Continue?
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setConfirmOverwrite(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setConfirmOverwrite(false);
              // If featured template, go to role step; otherwise apply directly
              if (featuredCount > 0 && currentPositions.length > 0) {
                setRoleSelections(Array(featuredCount).fill(''));
                setStep('roles');
              } else {
                onSelect(selected!);
                handleClose();
              }
            }}>
              Replace Positions
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Choose a template to arrange {dancerCount} dancer{dancerCount !== 1 ? 's' : ''} on stage.
          </p>

          {/* Category tabs */}
          <div className="flex gap-1 border-b border-border pb-0.5 overflow-x-auto scrollbar-none">
            {CATEGORIES.map((cat) => {
              const count = TEMPLATES.filter((t) => t.category === cat && dancerCount >= t.minDancers).length;
              return (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setSelected(null); }}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap',
                    activeCategory === cat
                      ? 'accent-bg-light accent-text border-b-2 border-[var(--color-accent)]'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary/50'
                  )}
                >
                  {CATEGORY_LABELS[cat]}
                  {count > 0 && (
                    <span className="ml-1 text-text-tertiary">({count})</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-1">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelected(template.id)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-left',
                  selected === template.id
                    ? 'border-[var(--color-accent)] accent-bg-light ring-1 ring-[var(--color-accent)]'
                    : 'border-border hover:border-text-tertiary hover:bg-surface-secondary/50'
                )}
              >
                <TemplatePreview template={template} dancerCount={dancerCount} />
                <div className="text-center">
                  <p className="text-sm font-medium text-text-primary">{template.name}</p>
                  <p className="text-xs text-text-tertiary">{template.description}</p>
                </div>
              </button>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <p className="text-sm text-text-tertiary text-center py-8">
              No {CATEGORY_LABELS[activeCategory].toLowerCase()} templates for {dancerCount} dancer{dancerCount !== 1 ? 's' : ''}.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={!selected}>
              Apply Template
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
