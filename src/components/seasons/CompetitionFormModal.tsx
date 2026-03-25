import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { searchCompanies, getCompanyById, CUSTOM_COMPANY_ID } from '@/data/competitionCompanies';
import { ENTRY_CATEGORIES, COMPETITIVE_LEVELS } from '@/types';
import { cn } from '@/lib/utils';
import type { Competition, CompetitionInsert } from '@/types';

interface CompetitionFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CompetitionInsert) => Promise<void>;
  seasonId?: string;
  seasons?: { id: string; name: string }[];
  competition?: Competition | null;
}

const DANCE_STYLES = [
  'Jazz', 'Lyrical', 'Contemporary', 'Tap', 'Ballet', 'Hip Hop',
  'Musical Theatre', 'Acro', 'Modern', 'Open', 'Commercial', 'Pointe',
];

type Division = { name: string; minAge: number; maxAge: number };

export function CompetitionFormModal({ open, onClose, onSubmit, seasonId, seasons, competition }: CompetitionFormModalProps) {
  // Season selector (when seasonId not provided)
  const [internalSeasonId, setInternalSeasonId] = useState(seasonId ?? seasons?.[0]?.id ?? '');

  // Company selector
  const [companySearch, setCompanySearch] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Core fields
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [entryDeadline, setEntryDeadline] = useState('');
  const [registrationUrl, setRegistrationUrl] = useState('');

  // Config sections
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [customStyle, setCustomStyle] = useState('');

  // Section collapse state
  const [divisionsOpen, setDivisionsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [levelsOpen, setLevelsOpen] = useState(false);
  const [stylesOpen, setStylesOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset company selector
      setCompanySearch(competition?.company_name ?? '');
      setCompanyId(competition?.company_id ?? null);
      setCompanyName(competition?.company_name ?? '');
      setShowDropdown(false);

      // Core fields
      setName(competition?.name ?? '');
      setLocation(competition?.location ?? '');
      setDate(competition?.date ?? '');
      setNotes(competition?.notes ?? '');
      setEntryDeadline(competition?.entry_deadline ?? '');
      setRegistrationUrl(competition?.registration_url ?? '');

      // Config
      setDivisions(competition?.configured_divisions ?? []);
      setCategories(competition?.configured_categories ?? []);
      setLevels(competition?.configured_levels ?? []);
      setStyles(competition?.configured_styles ?? []);

      // Collapse all sections
      setDivisionsOpen(false);
      setCategoriesOpen(false);
      setLevelsOpen(false);
      setStylesOpen(false);
      setCustomStyle('');
      setInternalSeasonId(seasonId ?? seasons?.[0]?.id ?? '');
    }
  }, [open, competition, seasonId, seasons]);

  const dropdownResults = searchCompanies(companySearch);

  function selectCompany(id: string) {
    if (id === CUSTOM_COMPANY_ID) {
      setCompanyId(null);
      setCompanyName('');
      setCompanySearch('');
      setShowDropdown(false);
      return;
    }
    const company = getCompanyById(id);
    if (company) {
      setCompanyId(company.id);
      setCompanyName(company.name);
      setCompanySearch(company.name);
      setName(company.name);
      setDivisions(company.defaultDivisions);
      setCategories(company.defaultCategories);
      setLevels(company.defaultLevels);
      setStyles(company.defaultStyles);
    }
    setShowDropdown(false);
  }

  function addDivision() {
    setDivisions((prev) => [...prev, { name: '', minAge: 0, maxAge: 19 }]);
  }

  function updateDivision(index: number, field: keyof Division, value: string | number) {
    setDivisions((prev) => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
  }

  function removeDivision(index: number) {
    setDivisions((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleCategory(cat: string) {
    setCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  }

  function toggleLevel(level: string) {
    setLevels((prev) => prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]);
  }

  function toggleStyle(style: string) {
    setStyles((prev) => prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]);
  }

  function addCustomStyle() {
    const trimmed = customStyle.trim();
    if (trimmed && !styles.includes(trimmed)) {
      setStyles((prev) => [...prev, trimmed]);
      setCustomStyle('');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    await onSubmit({
      season_id: seasonId ?? internalSeasonId,
      name: name.trim(),
      location: location.trim(),
      date: date || null,
      notes,
      company_id: companyId || null,
      company_name: companyName.trim() || null,
      entry_deadline: entryDeadline || null,
      registration_url: registrationUrl.trim() || null,
      configured_divisions: divisions,
      configured_categories: categories,
      configured_levels: levels,
      configured_styles: styles,
    });
    setIsSubmitting(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={competition ? 'Edit Competition' : 'Add Competition'}>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Season Selector (when seasonId not provided) */}
        {!seasonId && seasons && seasons.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Season</label>
            <select
              value={internalSeasonId}
              onChange={(e) => setInternalSeasonId(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-colors"
              required
            >
              {seasons.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Company Selector */}
        <div className="flex flex-col gap-1.5" ref={searchRef}>
          <label className="text-sm font-medium text-text-secondary">Competition Company</label>
          <div className="relative">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
              <input
                type="text"
                value={companySearch}
                onChange={(e) => {
                  setCompanySearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder="Search competition companies..."
                className="w-full rounded-lg border border-border bg-surface-secondary pl-8 pr-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-colors"
              />
            </div>
            {showDropdown && (
              <div className="absolute z-50 top-full mt-1 left-0 right-0 rounded-lg border border-border bg-surface-elevated shadow-lg overflow-hidden max-h-52 overflow-y-auto">
                {dropdownResults.map((company) => (
                  <button
                    key={company.id}
                    type="button"
                    onMouseDown={() => selectCompany(company.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-surface-secondary transition-colors"
                  >
                    <span className="text-sm text-text-primary">{company.name}</span>
                    <span className={cn(
                      'text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wide',
                      company.type === 'competition' && 'bg-accent/15 text-accent',
                      company.type === 'convention' && 'bg-blue-500/15 text-blue-400',
                      company.type === 'both' && 'bg-purple-500/15 text-purple-400',
                    )}>
                      {company.type === 'both' ? 'Both' : company.type === 'competition' ? 'Competition' : 'Convention'}
                    </span>
                  </button>
                ))}
                {dropdownResults.length === 0 && (
                  <div className="px-3 py-2.5 text-sm text-text-tertiary">No matches found</div>
                )}
                <button
                  type="button"
                  onMouseDown={() => selectCompany(CUSTOM_COMPANY_ID)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-surface-secondary transition-colors border-t border-border"
                >
                  <span className="text-sm text-text-secondary">Custom Competition</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-secondary text-text-tertiary uppercase tracking-wide">Custom</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {companyId && (
          <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/80">
            Pre-filled with {companyName} defaults. Verify divisions, levels, and styles for your specific event.
          </div>
        )}

        {/* Core fields */}
        <Input
          label="Competition Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Showstopper Dance Competition"
          required
        />
        <Input
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Orlando Convention Center"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            label="Entry Deadline"
            type="date"
            value={entryDeadline}
            onChange={(e) => setEntryDeadline(e.target.value)}
          />
        </div>
        <Input
          label="Registration URL"
          type="url"
          value={registrationUrl}
          onChange={(e) => setRegistrationUrl(e.target.value)}
          placeholder="https://..."
        />
        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Competition details, schedule info..."
          rows={3}
        />

        {/* Divisions */}
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setDivisionsOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary/40 transition-colors"
          >
            <span>Divisions {divisions.length > 0 && <span className="text-text-tertiary font-normal">({divisions.length})</span>}</span>
            {divisionsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {divisionsOpen && (
            <div className="px-4 pb-4 pt-2 border-t border-border space-y-2">
              {divisions.length === 0 && (
                <p className="text-xs text-text-tertiary py-1">No divisions configured.</p>
              )}
              {divisions.map((div, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_80px_32px] gap-2 items-end">
                  <Input
                    label={i === 0 ? 'Name' : undefined}
                    value={div.name}
                    onChange={(e) => updateDivision(i, 'name', e.target.value)}
                    placeholder="e.g. Teen"
                  />
                  <Input
                    label={i === 0 ? 'Min Age' : undefined}
                    type="number"
                    value={div.minAge}
                    onChange={(e) => updateDivision(i, 'minAge', parseInt(e.target.value) || 0)}
                    min={0}
                    max={99}
                  />
                  <Input
                    label={i === 0 ? 'Max Age' : undefined}
                    type="number"
                    value={div.maxAge}
                    onChange={(e) => updateDivision(i, 'maxAge', parseInt(e.target.value) || 0)}
                    min={0}
                    max={99}
                  />
                  <button
                    type="button"
                    onClick={() => removeDivision(i)}
                    className={cn('p-2 text-text-tertiary hover:text-danger-500 transition-colors rounded-lg', i === 0 && 'mt-6')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addDivision}
                className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors mt-1"
              >
                <Plus size={13} /> Add Division
              </button>
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setCategoriesOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary/40 transition-colors"
          >
            <span>Categories {categories.length > 0 && <span className="text-text-tertiary font-normal">({categories.length})</span>}</span>
            {categoriesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {categoriesOpen && (
            <div className="px-4 pb-4 pt-2 border-t border-border">
              <div className="flex flex-wrap gap-2 mt-1">
                {ENTRY_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      categories.includes(cat)
                        ? 'bg-accent text-white border-accent'
                        : 'bg-surface-secondary text-text-secondary border-border hover:border-accent/50'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Levels */}
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setLevelsOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary/40 transition-colors"
          >
            <span>Levels {levels.length > 0 && <span className="text-text-tertiary font-normal">({levels.length})</span>}</span>
            {levelsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {levelsOpen && (
            <div className="px-4 pb-4 pt-2 border-t border-border">
              <div className="flex flex-wrap gap-2 mt-1">
                {COMPETITIVE_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => toggleLevel(level)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      levels.includes(level)
                        ? 'bg-accent text-white border-accent'
                        : 'bg-surface-secondary text-text-secondary border-border hover:border-accent/50'
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Styles */}
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setStylesOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary/40 transition-colors"
          >
            <span>Styles {styles.length > 0 && <span className="text-text-tertiary font-normal">({styles.length})</span>}</span>
            {stylesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {stylesOpen && (
            <div className="px-4 pb-4 pt-2 border-t border-border space-y-3">
              <div className="flex flex-wrap gap-2 mt-1">
                {DANCE_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleStyle(style)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      styles.includes(style)
                        ? 'bg-accent text-white border-accent'
                        : 'bg-surface-secondary text-text-secondary border-border hover:border-accent/50'
                    )}
                  >
                    {style}
                  </button>
                ))}
                {/* Custom styles that aren't in the preset list */}
                {styles.filter((s) => !DANCE_STYLES.includes(s)).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleStyle(style)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-accent text-white border-accent transition-colors"
                  >
                    {style}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customStyle}
                  onChange={(e) => setCustomStyle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomStyle(); } }}
                  placeholder="Add custom style..."
                  className="flex-1 rounded-lg border border-border bg-surface-secondary px-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-colors"
                />
                <button
                  type="button"
                  onClick={addCustomStyle}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-secondary border border-border text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={!name.trim()}>
            {competition ? 'Save Changes' : 'Add Competition'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
