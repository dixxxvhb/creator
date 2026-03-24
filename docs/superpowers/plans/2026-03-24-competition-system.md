# Competition System — Hybrid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the existing competition model with a hybrid system: preloaded competition companies with smart defaults, director-configurable divisions/categories/levels, rich entry fields, and award tracking.

**Architecture:** Extend existing `competitions` and `competition_entries` tables with new columns + add a `competition_companies` reference table (local JSON data, not a Supabase table — keeps it lightweight and avoids staleness). The Competition form auto-populates defaults when a known company is selected. All configuration is per-competition to handle cross-company variation.

**Tech Stack:** React 19, TypeScript, Tailwind v4, Zustand, Supabase

---

## Design Decisions

### Why local JSON instead of a Supabase table for companies?
Competition companies (StarQuest, Showstopper, etc.) are reference data that rarely changes. Storing them as a static JSON file:
- Zero network calls to populate a dropdown
- No migration needed when adding/updating companies
- Easily bundled, searchable, filterable
- Director can still add custom companies not in the list

### What data goes where?
- **Company defaults** (static JSON): company name, website, scoring system type, default age divisions, default categories, default levels, default styles
- **Competition record** (Supabase): extends existing `competitions` table with company reference, configured divisions/categories/levels for THIS specific event, entry deadline, registration URL
- **Competition entries** (Supabase): extends existing `competition_entries` with age division, level, style, award tier, choreographer, time limit, dancer names

---

## File Map

### Task 1 — Competition Company Reference Data
- Create: `src/data/competitionCompanies.ts` (static reference data)
- Modify: `src/types/index.ts` (add CompetitionCompany, CompetitionConfig types)

### Task 2 — Expand Competition Schema
- Create: `supabase/migrations/010_expand_competitions.sql`
- Modify: `src/types/index.ts` (expand Competition + CompetitionEntry interfaces)
- Modify: `src/services/competitions.ts` (if needed for new fields)

### Task 3 — Enhanced Competition Form
- Modify: `src/components/seasons/CompetitionFormModal.tsx` (company selector, auto-populate, config fields)

### Task 4 — Enhanced Entry Form
- Modify: `src/components/seasons/EntryFormModal.tsx` (division, level, style, award tier, choreographer fields)

### Task 5 — Competition Detail View
- Modify: `src/pages/SeasonDetailPage.tsx` (show richer competition cards, award summaries)

---

## Task 1: Competition Company Reference Data

**Files:**
- Create: `src/data/competitionCompanies.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add types to types/index.ts**

Add before the Tier System section:

```ts
// ─── Competition Companies & Config ───
export interface CompetitionCompany {
  id: string;
  name: string;
  shortName: string;
  website: string;
  type: 'competition' | 'convention' | 'both';
  scoringSystem: 'tiered' | 'ranked' | 'both';
  defaultDivisions: { name: string; minAge: number; maxAge: number }[];
  defaultCategories: string[];
  defaultLevels: string[];
  defaultStyles: string[];
}

export const AWARD_TIERS = [
  'Platinum', 'High Gold', 'Gold', 'High Silver', 'Silver', 'Bronze',
] as const;

export type AwardTier = (typeof AWARD_TIERS)[number];

export const ENTRY_CATEGORIES = [
  'Solo', 'Duo', 'Trio', 'Small Group', 'Large Group', 'Line', 'Production', 'Super Group',
] as const;

export type EntryCategory = (typeof ENTRY_CATEGORIES)[number];

export const COMPETITIVE_LEVELS = [
  'Recreational', 'Intermediate', 'Competitive', 'Elite',
] as const;

export type CompetitiveLevel = (typeof COMPETITIVE_LEVELS)[number];
```

- [ ] **Step 2: Create competition companies data file**

Create `src/data/competitionCompanies.ts` with ~15 major competition companies. Each has smart defaults for divisions, categories, levels, and styles. Include a searchable export function.

Key companies to include:
- StarQuest, Showstopper, NUVO, Radix, The Dance Awards, JUMP, NYCDA, 24 Seven, Hall of Fame, Tremaine, KAR, Starpower, Groove, Headliners, Energy

Each company gets:
- Accurate default age divisions (researched per company)
- Standard categories (Solo through Production)
- Levels offered
- Styles accepted

Also export:
```ts
export function searchCompanies(query: string): CompetitionCompany[]
export function getCompanyById(id: string): CompetitionCompany | undefined
export const CUSTOM_COMPANY_ID = 'custom';
```

- [ ] **Step 3: Run build, commit**

```bash
cd "/Users/dixxx/Documents/Claude Projects/Code/creator" && npm run build
git add src/data/competitionCompanies.ts src/types/index.ts
git commit -m "feat: add competition company reference data with smart defaults

15 major competition companies with configurable divisions, categories,
levels, and styles. Searchable. Custom company support."
```

---

## Task 2: Expand Competition Schema

Extend existing `competitions` and `competition_entries` tables.

**Files:**
- Create: `supabase/migrations/010_expand_competitions.sql`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Create migration**

```sql
-- 010: Expand competitions with company config and richer entries

-- Competitions: add company reference and configuration
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS company_id TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS entry_deadline DATE,
  ADD COLUMN IF NOT EXISTS registration_url TEXT,
  ADD COLUMN IF NOT EXISTS scoring_system TEXT NOT NULL DEFAULT 'tiered',
  ADD COLUMN IF NOT EXISTS configured_divisions JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS configured_categories JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS configured_levels JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS configured_styles JSONB NOT NULL DEFAULT '[]';

-- Competition entries: add structured fields
ALTER TABLE competition_entries
  ADD COLUMN IF NOT EXISTS age_division TEXT,
  ADD COLUMN IF NOT EXISTS competitive_level TEXT,
  ADD COLUMN IF NOT EXISTS style TEXT,
  ADD COLUMN IF NOT EXISTS award_tier TEXT,
  ADD COLUMN IF NOT EXISTS choreographer TEXT,
  ADD COLUMN IF NOT EXISTS song_title TEXT,
  ADD COLUMN IF NOT EXISTS song_artist TEXT,
  ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS dancer_names TEXT[] DEFAULT '{}';
```

- [ ] **Step 2: Update Competition type in types/index.ts**

Expand the existing Competition interface:

```ts
export interface Competition {
  id: string;
  season_id: string;
  name: string;
  location: string;
  date: string | null;
  notes: string;
  // New fields
  company_id: string | null;
  company_name: string | null;
  entry_deadline: string | null;
  registration_url: string | null;
  scoring_system: string;
  configured_divisions: { name: string; minAge: number; maxAge: number }[];
  configured_categories: string[];
  configured_levels: string[];
  configured_styles: string[];
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 3: Update CompetitionEntry type**

Expand the existing CompetitionEntry interface:

```ts
export interface CompetitionEntry {
  id: string;
  competition_id: string;
  piece_id: string;
  category: string;
  placement: string | null;
  score: number | null;
  special_awards: string | null;
  notes: string;
  // New fields
  age_division: string | null;
  competitive_level: string | null;
  style: string | null;
  award_tier: AwardTier | null;
  choreographer: string | null;
  song_title: string | null;
  song_artist: string | null;
  time_limit_seconds: number | null;
  dancer_names: string[];
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 4: Update CompetitionInsert and CompetitionEntryInsert**

These derive from the interfaces via `Omit`, so they'll automatically include the new fields. But verify that all existing call sites that create `CompetitionInsert` or `CompetitionEntryInsert` objects include the new fields (or that the new fields have defaults in the DB so they can be omitted).

Check:
- `src/components/seasons/CompetitionFormModal.tsx` — where CompetitionInsert is built
- `src/components/seasons/EntryFormModal.tsx` — where CompetitionEntryInsert is built
- `src/stores/seasonStore.ts` — where add/update methods are called

Since all new DB columns have defaults (`NULL`, `DEFAULT '[]'`, `DEFAULT '{}'`), the existing code should still compile. But `CompetitionInsert` = `Omit<Competition, 'id' | 'created_at' | 'updated_at'>` which means the new JSONB fields (`configured_divisions` etc.) will be required in TypeScript. Fix this by making them optional in the interface or adjusting the insert type.

**Solution:** Make the new competition fields optional in the insert type by using a custom insert type instead of the derived one, OR make the JSONB fields have `| undefined` in the interface. Simplest: change CompetitionInsert to use Partial for the new fields.

```ts
export type CompetitionInsert = Omit<Competition, 'id' | 'created_at' | 'updated_at'> & {
  configured_divisions?: { name: string; minAge: number; maxAge: number }[];
  configured_categories?: string[];
  configured_levels?: string[];
  configured_styles?: string[];
};
```

Similarly for CompetitionEntryInsert — new fields should be optional:

```ts
export type CompetitionEntryInsert = Omit<CompetitionEntry, 'id' | 'created_at' | 'updated_at'> & {
  age_division?: string | null;
  competitive_level?: string | null;
  style?: string | null;
  award_tier?: AwardTier | null;
  choreographer?: string | null;
  song_title?: string | null;
  song_artist?: string | null;
  time_limit_seconds?: number | null;
  dancer_names?: string[];
};
```

- [ ] **Step 5: Run build, commit**

```bash
cd "/Users/dixxx/Documents/Claude Projects/Code/creator" && npm run build
git add supabase/migrations/010_expand_competitions.sql src/types/index.ts
git commit -m "db: expand competitions with company config and structured entries

Adds company reference, entry deadline, scoring system, and configurable
divisions/categories/levels/styles to competitions. Entries gain division,
level, style, award tier, choreographer, and dancer names."
```

---

## Task 3: Enhanced Competition Form

Add company selector with search, auto-populate defaults, and configuration fields.

**Files:**
- Modify: `src/components/seasons/CompetitionFormModal.tsx`

- [ ] **Step 1: Read current CompetitionFormModal**

Read the file first to understand current structure.

- [ ] **Step 2: Add company selector**

At the top of the form, add a searchable company selector:
- Text input with autocomplete dropdown showing matching companies
- Selecting a company auto-populates: company_id, company_name, configured_divisions, configured_categories, configured_levels, configured_styles from the company defaults
- "Custom" option for unlisted competitions
- If editing an existing competition, show the saved company name

- [ ] **Step 3: Add configuration fields**

Below the company selector, show collapsible sections for:

**Event Details** (always visible):
- Name (existing)
- Location (existing)
- Date (existing)
- Entry Deadline (new date picker)
- Registration URL (new input)
- Notes (existing)

**Divisions** (collapsible, shows auto-populated list):
- List of divisions with name, min age, max age
- Add/remove buttons
- Pre-populated from company defaults

**Categories** (collapsible):
- Checkboxes or chips for: Solo, Duo, Trio, Small Group, Large Group, Line, Production
- Pre-populated from company defaults

**Levels** (collapsible):
- Checkboxes: Recreational, Intermediate, Competitive, Elite
- Pre-populated from company defaults

**Styles** (collapsible):
- Checkboxes for dance styles
- Pre-populated from company defaults

- [ ] **Step 4: Wire up form submission**

The form's submit handler must include all new fields in the CompetitionInsert object.

- [ ] **Step 5: Run build, commit**

```bash
cd "/Users/dixxx/Documents/Claude Projects/Code/creator" && npm run build
git add src/components/seasons/CompetitionFormModal.tsx
git commit -m "feat: enhanced competition form with company selector and config

Company search with auto-populated defaults. Configurable divisions,
categories, levels, and styles per competition event."
```

---

## Task 4: Enhanced Entry Form

Add structured entry fields that pull from the competition's configuration.

**Files:**
- Modify: `src/components/seasons/EntryFormModal.tsx`

- [ ] **Step 1: Read current EntryFormModal**

Read the file to understand current structure.

- [ ] **Step 2: Add structured fields**

The entry form should show:
- Piece selector (existing — links to a piece)
- **Category** — dropdown from competition's `configured_categories` (was free text, now constrained)
- **Age Division** — dropdown from competition's `configured_divisions`
- **Competitive Level** — dropdown from competition's `configured_levels`
- **Style** — dropdown from competition's `configured_styles`
- **Choreographer** — text input (auto-suggest from profile display name)
- **Song Title / Artist** — auto-populated from linked piece's song_title/song_artist (editable)

**Results section** (for after the competition):
- **Score** — numeric input (existing)
- **Placement** — text input (existing, e.g., "1st Overall")
- **Award Tier** — dropdown from AWARD_TIERS (Platinum, High Gold, Gold, etc.)
- **Special Awards** — text input (existing)

- [ ] **Step 3: Pass competition config to entry form**

The EntryFormModal needs to receive the parent competition's configured_divisions, configured_categories, etc. to populate its dropdowns. Update the props interface.

- [ ] **Step 4: Auto-populate from piece**

When a piece is selected, auto-fill:
- song_title from piece.song_title
- song_artist from piece.song_artist
- category based on piece.group_size (solo → Solo, duo → Duo, etc.)
- dancer_names from piece's assigned roster dancers

- [ ] **Step 5: Run build, commit**

```bash
cd "/Users/dixxx/Documents/Claude Projects/Code/creator" && npm run build
git add src/components/seasons/EntryFormModal.tsx
git commit -m "feat: structured entry form with division, level, style, and awards

Entries pull config from parent competition. Auto-populates song info
and category from linked piece. Award tier dropdown for results."
```

---

## Task 5: Competition Detail View Enhancement

Show richer competition cards and award summaries in SeasonDetailPage.

**Files:**
- Modify: `src/pages/SeasonDetailPage.tsx`

- [ ] **Step 1: Read current SeasonDetailPage**

Read the full file to understand current layout.

- [ ] **Step 2: Enhance competition cards**

Each competition card should show:
- Company name / logo badge (if from a known company)
- Date with urgency indicator (red ≤3 days, amber ≤2 weeks)
- Entry deadline with urgency
- Location
- Entry count with award tier breakdown (e.g., "6 entries: 3 Platinum, 2 High Gold, 1 Gold")
- Quick stats: total score average, placement highlights

- [ ] **Step 3: Add results summary section**

At the top of SeasonDetailPage, show a season results banner:
- Total entries across all competitions
- Award tier distribution (bar chart or pill badges)
- Best placement
- Average score

- [ ] **Step 4: Run build, commit**

```bash
cd "/Users/dixxx/Documents/Claude Projects/Code/creator" && npm run build
git add src/pages/SeasonDetailPage.tsx
git commit -m "feat: enhanced competition cards with award summaries and urgency indicators"
```

---

## End of Competition System

- [ ] Run final build: `npm run build`
- [ ] Verify all commits: `git log --oneline -5`
