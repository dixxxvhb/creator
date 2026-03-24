# Creator App — March 24 Day Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the spec's Slate + Electric Blue design system, fix missing DB migrations, expand the global roster with measurements/contacts, build tier gating architecture, and add tabbed piece UI with song sections.

**Architecture:** Five independent feature areas executed sequentially. Design system is pure CSS token swap (no component restructuring). Roster expansion adds columns to existing Dancer type + Supabase table. Tier gating introduces a new store + context wrapper. Song sections add a new data model + UI tab to PieceDetailPage.

**Tech Stack:** React 19, TypeScript, Tailwind v4, Zustand, Supabase, react-konva, framer-motion

---

## File Map

### Task 1 — Design System
- Modify: `src/index.css` (swap all color tokens to slate + electric blue)
- Modify: `src/types/index.ts` (update ACCENT_PRESETS default)
- Modify: `src/stores/profileStore.ts` (change default accent to `#3B82F6`)
- Modify: `src/components/layout/Sidebar.tsx` (update brand font reference)
- ~~`src/components/branding/CreatorLogo.tsx`~~ — verified: pure SVG, no font references

### Task 2 — Missing Migrations
- Create: `supabase/migrations/005_dancer_paths.sql`
- Create: `supabase/migrations/006_formation_transition_columns.sql`

### Task 3 — Roster Expansion
- Modify: `src/types/index.ts` (add measurement + contact fields to Dancer)
- Create: `supabase/migrations/007_dancer_measurements_contacts.sql`
- Modify: `src/components/roster/DancerFormModal.tsx` (add measurement + contact fields)
- Modify: `src/components/roster/DancerCard.tsx` (show parent name, age, piece count)
- Modify: `src/services/dancers.ts` (if schema changes require service updates)

### Task 4 — Tier Gating Architecture
- Modify: `src/types/index.ts` (add Tier type, TierFeature map)
- Create: `src/stores/tierStore.ts` (tier state + gate checks)
- Create: `src/components/ui/TierGate.tsx` (wrapper component for locked features)
- Create: `supabase/migrations/008_user_purchases.sql`
- Modify: `src/components/layout/Sidebar.tsx` (tier badges on nav items)
- Modify: `src/components/layout/BottomTabBar.tsx` (tier badges on tabs)
- Modify: `src/pages/DashboardPage.tsx` (wrap in tier gate)
- Modify: `src/pages/SeasonsPage.tsx` (wrap in tier gate)
- Modify: `src/pages/RosterPage.tsx` (wrap in tier gate)
- Modify: `src/pages/CostumesPage.tsx` (wrap in tier gate)

### Task 5 — Tabbed Piece UI + Song Sections
- Modify: `src/types/index.ts` (add SongSection type)
- Create: `supabase/migrations/009_song_sections.sql`
- Create: `src/services/songSections.ts`
- Create: `src/stores/songSectionStore.ts`
- Create: `src/components/pieces/PieceTabs.tsx` (tab navigation)
- Create: `src/components/pieces/SongSectionsPanel.tsx` (song section editor)
- Create: `src/components/pieces/PieceNotesPanel.tsx` (extracted from PieceDetailPage)
- Create: `src/components/pieces/PieceRosterPanel.tsx` (extracted from PieceDetailPage)
- Modify: `src/pages/PieceDetailPage.tsx` (refactor to tabbed layout)

---

## Task 1: Design System — Slate + Electric Blue

Apply the spec palette. Dark mode default. Both modes required.

**Spec tokens:**
| Token | Dark | Light |
|---|---|---|
| Base background | `#0F1117` | `#F4F6FB` |
| Surface | `#1A1D27` | `#FFFFFF` |
| Elevated surface | `#22263A` | `#E8ECF5` |
| Primary accent | `#3B82F6` | `#3B82F6` |

**Files:**
- Modify: `src/index.css`
- Modify: `src/types/index.ts`
- Modify: `src/stores/profileStore.ts`

- [ ] **Step 1: Replace light mode tokens in index.css**

In `src/index.css`, replace the `@theme` block's light mode tokens:

```css
@theme {
  /* Semantic surfaces — light mode defaults */
  --color-surface: #FFFFFF;
  --color-surface-secondary: #F4F6FB;
  --color-surface-elevated: #E8ECF5;

  /* Text hierarchy */
  --color-text-primary: #0F1117;
  --color-text-secondary: #64748B;
  --color-text-tertiary: #94A3B8;

  /* Borders */
  --color-border: #CBD5E1;
  --color-border-light: #E8ECF5;

  /* Status colors (keep existing) */
  --color-success-50: #f0fdf4;
  --color-success-500: #34C759;
  --color-success-600: #30B350;
  --color-danger-50: #fef2f2;
  --color-danger-500: #FF3B30;
  --color-danger-600: #E0352B;
  --color-warning-50: #fffbeb;
  --color-warning-500: #FF9500;
  --color-warning-600: #E08600;

  /* Fonts — clean sans-serif throughout */
  --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-brand: 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'SF Mono', 'Fira Code', monospace;
}
```

- [ ] **Step 2: Replace dark mode tokens in index.css**

Replace the `html.dark` block:

```css
html.dark {
  --color-surface: #0F1117;
  --color-surface-secondary: #1A1D27;
  --color-surface-elevated: #22263A;
  --color-text-primary: #F1F5F9;
  --color-text-secondary: #94A3B8;
  --color-text-tertiary: #475569;
  --color-border: #334155;
  --color-border-light: #1E293B;
  --color-success-50: #0a1f0d;
  --color-danger-50: #1f0a0a;
  --color-warning-50: #1f160a;
}
```

- [ ] **Step 3: Update default accent color to electric blue**

In `src/index.css`, update `:root` accent:

```css
:root {
  --color-accent: #3B82F6;
  --color-accent-hover: #2563EB;
  --color-accent-light: rgba(59, 130, 246, 0.1);
}
```

- [ ] **Step 4: Update glass surface for new palette**

```css
.glass {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
}
html.dark .glass {
  background: rgba(15, 17, 23, 0.72);
}
```

- [ ] **Step 5: Update ACCENT_PRESETS default in types/index.ts**

Change first preset from `#007AFF` to `#3B82F6`:

```ts
export const ACCENT_PRESETS = [
  { value: '#3B82F6', label: 'Electric Blue' },
  { value: '#FF2D55', label: 'Coral' },
  // ... rest unchanged
] as const;
```

- [ ] **Step 6: Update profileStore default accent**

In `src/stores/profileStore.ts`, change `DEFAULT_PROFILE.accentColor` from `'#007AFF'` to `'#3B82F6'` and change `DEFAULT_PROFILE.themePreference` from `'light'` to `'dark'`.

- [ ] **Step 7: Remove Raleway from Google Fonts import**

In `src/index.css` line 1, remove `&family=Raleway:wght@200;300;400;500;600` from the import URL. Keep Plus Jakarta Sans only.

- [ ] **Step 8: Update Sidebar brand text**

In `src/components/layout/Sidebar.tsx`, change `font-brand` usage. The brand text should use `font-sans font-light` instead of `font-brand` with weight 200 (since font-brand now points to Plus Jakarta Sans too, we want light weight tracking):

```tsx
<span
  className="text-text-primary uppercase font-sans"
  style={{ fontWeight: 300, letterSpacing: '0.25em', fontSize: '0.9rem' }}
>
  Creator
</span>
```

- [ ] **Step 9: Run build to verify**

```bash
cd ~/Documents/Claude\ Projects/Code/creator && npm run build
```

Expected: Clean build, zero errors.

- [ ] **Step 10: Commit**

```bash
git add src/index.css src/types/index.ts src/stores/profileStore.ts src/components/layout/Sidebar.tsx
git commit -m "design: apply Slate + Electric Blue palette from spec

Swap iOS-inspired tokens to spec's design system:
- Dark: #0F1117 base, #1A1D27 surface, #22263A elevated
- Light: #F4F6FB secondary, #E8ECF5 elevated
- Accent: #3B82F6 electric blue (was #007AFF)
- Default theme: dark (was light)
- Drop Raleway font, use Plus Jakarta Sans throughout"
```

---

## Task 2: Fix Missing Migrations

**Files:**
- Create: `supabase/migrations/005_dancer_paths.sql`
- Create: `supabase/migrations/006_formation_transition_columns.sql`

- [ ] **Step 1: Create dancer_paths migration**

```sql
-- 005: dancer_paths table (matches services/dancerPaths.ts expectations)
CREATE TABLE IF NOT EXISTS dancer_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  dancer_label TEXT NOT NULL,
  path_points JSONB NOT NULL DEFAULT '[]',
  path_type TEXT NOT NULL DEFAULT 'freehand' CHECK (path_type IN ('freehand', 'geometric')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (formation_id, dancer_label)
);

-- Index for fast lookups by formation
CREATE INDEX idx_dancer_paths_formation ON dancer_paths(formation_id);

-- RLS (permissive for now — TODO: tighten when auth is wired up,
-- should join through formations → pieces → user_id like 001)
ALTER TABLE dancer_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all dancer_paths" ON dancer_paths FOR ALL USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Create formation transition columns migration**

```sql
-- 006: Add transition columns to formations table
ALTER TABLE formations
  ADD COLUMN IF NOT EXISTS transition_duration_ms INTEGER NOT NULL DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS transition_easing TEXT NOT NULL DEFAULT 'ease-in-out'
    CHECK (transition_easing IN ('linear', 'ease-in', 'ease-out', 'ease-in-out'));
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/005_dancer_paths.sql supabase/migrations/006_formation_transition_columns.sql
git commit -m "db: add missing migrations for dancer_paths and formation transition columns"
```

---

## Task 3: Roster Expansion — Measurements + Contacts

Add fields from spec: measurements (height, weight, bust, waist, hips, inseam), sizes (shoe, tights, headpiece), parent/guardian contact info.

**Files:**
- Modify: `src/types/index.ts`
- Create: `supabase/migrations/007_dancer_measurements_contacts.sql`
- Modify: `src/components/roster/DancerFormModal.tsx`
- Modify: `src/components/roster/DancerCard.tsx`

- [ ] **Step 1: Create migration for new dancer columns**

```sql
-- 007: Expand dancers with measurements and contact info
ALTER TABLE dancers
  ADD COLUMN IF NOT EXISTS height TEXT,
  ADD COLUMN IF NOT EXISTS weight TEXT,
  ADD COLUMN IF NOT EXISTS bust TEXT,
  ADD COLUMN IF NOT EXISTS waist TEXT,
  ADD COLUMN IF NOT EXISTS hips TEXT,
  ADD COLUMN IF NOT EXISTS inseam TEXT,
  ADD COLUMN IF NOT EXISTS shoe_size TEXT,
  ADD COLUMN IF NOT EXISTS tights_size TEXT,
  ADD COLUMN IF NOT EXISTS headpiece_size TEXT,
  ADD COLUMN IF NOT EXISTS parent_name TEXT,
  ADD COLUMN IF NOT EXISTS parent_email TEXT,
  ADD COLUMN IF NOT EXISTS parent_phone TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';
```

- [ ] **Step 2: Update Dancer type in types/index.ts**

Add to the `Dancer` interface after `is_active`:

```ts
export interface Dancer {
  id: string;
  user_id: string;
  full_name: string;
  short_name: string;
  birthday: string | null;
  color: string;
  is_active: boolean;
  // Measurements
  height: string | null;
  weight: string | null;
  bust: string | null;
  waist: string | null;
  hips: string | null;
  inseam: string | null;
  shoe_size: string | null;
  tights_size: string | null;
  headpiece_size: string | null;
  // Contact
  parent_name: string | null;
  parent_email: string | null;
  parent_phone: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 3: Update DancerFormModal with collapsible sections**

Refactor `DancerFormModal.tsx` to add two collapsible sections below the existing fields:

**Contact section** (collapsed by default): parent_name, parent_email, parent_phone
**Measurements section** (collapsed by default): height, weight, bust, waist, hips, inseam, shoe_size, tights_size, headpiece_size

Use a disclosure pattern — section header with chevron icon, clicking toggles visibility. This keeps the form clean for quick adds while making detail entry available.

Each field is a simple `<Input>` with appropriate label. All fields are optional (no `required`).

The `onSave` call must include all new fields (defaulting to `null` if empty, `''` for notes).

**IMPORTANT:** `DancerInsert` derives from `Dancer` via `Omit<...>`, so `notes: string` becomes a required field. Every call site that builds a `DancerInsert` must include `notes: ''` (or the actual value). The existing `handleSubmit` in `DancerFormModal.tsx` must be updated to include `notes` and all measurement/contact fields (defaulting `null`). Also check `PieceSetupPage.tsx` and `AddDancerModal.tsx` for any inline dancer creation that builds `DancerInsert` objects.

- [ ] **Step 4: Update DancerCard to show parent name and notes indicator**

Read `src/components/roster/DancerCard.tsx` first. Add:
- Parent name below the dancer name (small text, if present)
- A small indicator dot if the dancer has notes

- [ ] **Step 5: Run build**

```bash
cd ~/Documents/Claude\ Projects/Code/creator && npm run build
```

Expected: Clean build. TypeScript may flag missing properties in existing code that creates DancerInsert objects — fix any that arise by adding the new optional fields.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/007_dancer_measurements_contacts.sql src/types/index.ts src/components/roster/DancerFormModal.tsx src/components/roster/DancerCard.tsx
git commit -m "feat: expand roster with measurements, sizes, and parent contacts

Adds height/weight/bust/waist/hips/inseam, shoe/tights/headpiece sizes,
parent name/email/phone, and notes to dancer profiles."
```

---

## Task 4: Tier Gating Architecture

Build the free/mid/studio tier system. For now, tier is stored locally (no Supabase auth yet). The migration creates the table for when auth is ready. The UI shows locked states for Studio-tier features.

**Tiers:**
- `free` — 1-2 pieces, basic formation tools
- `mid` — unlimited pieces, full canvas + pathways
- `studio` — everything: home dashboard, seasons, roster, costumes

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/stores/tierStore.ts`
- Create: `src/components/ui/TierGate.tsx`
- Create: `supabase/migrations/008_user_purchases.sql`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/BottomTabBar.tsx`

- [ ] **Step 1: Add tier types to types/index.ts**

```ts
// ─── Tier System ───
export type Tier = 'free' | 'mid' | 'studio';

export const TIER_LABELS: Record<Tier, string> = {
  free: 'Free',
  mid: 'Choreographer',
  studio: 'Studio',
};

export const TIER_FEATURES = {
  // Navigation sections
  home_dashboard: 'studio',
  seasons: 'studio',
  roster: 'studio',
  costumes: 'studio',
  // Canvas features
  transition_animations: 'mid',
  drawn_pathways: 'mid',
  // Piece limits
  unlimited_pieces: 'mid',
} as const satisfies Record<string, Tier>;

export type TierFeature = keyof typeof TIER_FEATURES;

export const FREE_PIECE_LIMIT = 2;
```

- [ ] **Step 2: Create tierStore.ts**

```ts
import { create } from 'zustand';
import type { Tier, TierFeature } from '@/types';
import { TIER_FEATURES } from '@/types';

const STORAGE_KEY = 'creator-tier';
const TIER_ORDER: Record<Tier, number> = { free: 0, mid: 1, studio: 2 };

function loadTier(): Tier {
  if (typeof window === 'undefined') return 'free';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'mid' || stored === 'studio') return stored;
  return 'free';
}

interface TierState {
  tier: Tier;
  hasFeature: (feature: TierFeature) => boolean;
  setTier: (tier: Tier) => void;
}

export const useTierStore = create<TierState>((set, get) => ({
  tier: loadTier(),

  hasFeature: (feature: TierFeature) => {
    const required = TIER_FEATURES[feature];
    return TIER_ORDER[get().tier] >= TIER_ORDER[required];
  },

  setTier: (tier: Tier) => {
    localStorage.setItem(STORAGE_KEY, tier);
    set({ tier });
  },
}));
```

- [ ] **Step 3: Create TierGate.tsx component**

```tsx
import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { useTierStore } from '@/stores/tierStore';
import { TIER_LABELS, TIER_FEATURES } from '@/types';
import type { TierFeature } from '@/types';

interface TierGateProps {
  feature: TierFeature;
  children: ReactNode;
  /** If true, shows children with a locked overlay instead of replacing them */
  overlay?: boolean;
}

export function TierGate({ feature, children, overlay }: TierGateProps) {
  const hasFeature = useTierStore((s) => s.hasFeature);

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  const requiredTier = TIER_FEATURES[feature];
  const label = TIER_LABELS[requiredTier];

  if (overlay) {
    return (
      <div className="relative">
        <div className="opacity-40 pointer-events-none select-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-elevated border border-border shadow-lg">
            <Lock size={14} className="text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">{label}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-surface-secondary flex items-center justify-center mb-4">
        <Lock size={24} className="text-text-tertiary" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-1">{label} Feature</h3>
      <p className="text-sm text-text-secondary max-w-sm">
        Upgrade to the {label} tier to unlock this feature.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Create user_purchases migration**

```sql
-- 008: User purchases for tier tracking
CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'mid', 'studio')),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  apple_transaction_id TEXT,
  receipt_data TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_purchases_user ON user_purchases(user_id);

-- TODO: tighten RLS when auth is wired up
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all user_purchases" ON user_purchases FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER set_user_purchases_updated_at
  BEFORE UPDATE ON user_purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

- [ ] **Step 5: Add tier badges to Sidebar nav items**

In `src/components/layout/Sidebar.tsx`, import `useTierStore` and `TIER_FEATURES`. Add a small `PRO` or `STUDIO` badge next to nav items that require a higher tier than the user has. The badge should be a subtle pill (`text-[10px] px-1.5 py-0.5 rounded-full bg-surface-secondary text-text-tertiary`).

Map nav items to features:
- Home → `home_dashboard`
- Seasons → `seasons`
- Roster → `roster`
- Costumes → `costumes`

Only show badge if user doesn't have the feature. Items remain clickable (they navigate to the page which shows the TierGate).

- [ ] **Step 6: Add tier badges to BottomTabBar**

Same logic as Sidebar but for mobile nav. Add a tiny lock icon (size 8) in the top-right corner of locked tab icons.

- [ ] **Step 7: Wrap gated pages**

In each gated page (`SeasonsPage.tsx`, `RosterPage.tsx`, `CostumesPage.tsx`), wrap the page content with `<TierGate feature="...">`. The page still renders its `PageContainer` shell so navigation works — only the content inside is gated.

**DashboardPage special case:** Don't gate the entire dashboard. Instead, for free-tier users, show a simplified welcome with a "New Piece" quick action and an upgrade prompt card. The full dashboard (stats, recent pieces, deadlines) only renders for studio-tier users. Use `<TierGate feature="home_dashboard" overlay>` around the stats/deadlines sections so free users can see what they're missing.

- [ ] **Step 8: Add tier selector to Settings page**

In `SettingsPage.tsx`, add a new "Subscription" section at the top showing current tier with buttons to switch (for dev/testing). This lets Dixon test tier gating without Supabase auth. Label it clearly as "Development Only".

```tsx
<section>
  <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3 px-1">
    Subscription (Dev Only)
  </h2>
  <Card>
    <div className="flex gap-2">
      {(['free', 'mid', 'studio'] as const).map((t) => (
        <Button
          key={t}
          variant={tier === t ? 'primary' : 'secondary'}
          onClick={() => setTier(t)}
        >
          {TIER_LABELS[t]}
        </Button>
      ))}
    </div>
  </Card>
</section>
```

- [ ] **Step 9: Add piece limit enforcement**

In `PiecesPage.tsx`, when `tier === 'free'` and `pieces.length >= FREE_PIECE_LIMIT`, disable the "New Piece" button and show a message: "Free tier allows up to 2 pieces. Upgrade to create more."

- [ ] **Step 10: Run build**

```bash
cd ~/Documents/Claude\ Projects/Code/creator && npm run build
```

- [ ] **Step 11: Commit**

```bash
git add src/types/index.ts src/stores/tierStore.ts src/components/ui/TierGate.tsx supabase/migrations/008_user_purchases.sql src/components/layout/Sidebar.tsx src/components/layout/BottomTabBar.tsx src/pages/DashboardPage.tsx src/pages/SeasonsPage.tsx src/pages/RosterPage.tsx src/pages/CostumesPage.tsx src/pages/SettingsPage.tsx src/pages/PiecesPage.tsx
git commit -m "feat: add three-tier gating system (free/mid/studio)

Introduces tier store, TierGate component, and visible-but-locked
states for Studio features. Dev tier switcher in Settings.
Free tier limited to 2 pieces."
```

---

## Task 5: Tabbed Piece UI + Song Sections

Refactor PieceDetailPage from a single scrollable page into a tabbed interface. Add the missing "Song Sections" concept.

**Tabs:** Canvas | Notes | Song Sections | Roster

**Files:**
- Modify: `src/types/index.ts`
- Create: `supabase/migrations/009_song_sections.sql`
- Create: `src/services/songSections.ts`
- Create: `src/stores/songSectionStore.ts`
- Create: `src/components/pieces/PieceTabs.tsx`
- Create: `src/components/pieces/SongSectionsPanel.tsx`
- Create: `src/components/pieces/PieceNotesPanel.tsx`
- Create: `src/components/pieces/PieceRosterPanel.tsx`
- Modify: `src/pages/PieceDetailPage.tsx`

- [ ] **Step 1: Add SongSection type to types/index.ts**

```ts
// ─── Song Section ───
export const SECTION_TYPES = [
  'Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Outro', 'Break', 'Custom',
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export interface SongSection {
  id: string;
  piece_id: string;
  label: string;
  section_type: SectionType;
  start_seconds: number;
  end_seconds: number;
  formation_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type SongSectionInsert = Omit<SongSection, 'id' | 'created_at' | 'updated_at'>;
export type SongSectionUpdate = Partial<Omit<SongSectionInsert, 'piece_id'>>;
```

- [ ] **Step 2: Create song_sections migration**

```sql
-- 009: Song sections for piece structure
CREATE TABLE IF NOT EXISTS song_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id UUID NOT NULL REFERENCES pieces(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  section_type TEXT NOT NULL DEFAULT 'Custom',
  start_seconds REAL NOT NULL DEFAULT 0,
  end_seconds REAL NOT NULL DEFAULT 0,
  formation_id UUID REFERENCES formations(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_song_sections_piece ON song_sections(piece_id);

-- TODO: tighten RLS when auth is wired up
ALTER TABLE song_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all song_sections" ON song_sections FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER set_song_sections_updated_at
  BEFORE UPDATE ON song_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

- [ ] **Step 3: Create songSections service**

`src/services/songSections.ts` — standard CRUD service following the pattern in `src/services/formations.ts`:
- `fetchSongSections(pieceId: string): Promise<SongSection[]>` — select where piece_id, order by sort_order
- `createSongSection(section: SongSectionInsert): Promise<SongSection>` — insert, return single
- `updateSongSection(id: string, updates: SongSectionUpdate): Promise<SongSection>` — update, return single
- `deleteSongSection(id: string): Promise<void>` — delete

- [ ] **Step 4: Create songSectionStore**

`src/stores/songSectionStore.ts` — Zustand store wrapping the service. Same pattern as `costumeStore.ts`:
- State: `sections: SongSection[]`, `isLoading: boolean`
- Actions: `load(pieceId)`, `add(section)`, `update(id, updates)`, `remove(id)`, `reorder(id, newIndex)`

- [ ] **Step 5: Create PieceTabs component**

`src/components/pieces/PieceTabs.tsx` — horizontal tab bar with four tabs: Canvas, Notes, Song Sections, Roster. Uses accent color for active tab indicator. Renders as a sticky bar below the piece header.

```tsx
interface PieceTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}
```

Tabs array: `[{ id: 'canvas', label: 'Canvas' }, { id: 'notes', label: 'Notes' }, { id: 'sections', label: 'Song Sections' }, { id: 'roster', label: 'Roster' }]`

Style: horizontal scroll on mobile, centered on desktop. Active tab has bottom border in accent color + accent text. Inactive tabs are `text-text-secondary`.

- [ ] **Step 6: Extract PieceNotesPanel from PieceDetailPage**

Read `PieceDetailPage.tsx` first. Extract the **piece-level** notes and a summary view of all formation notes into `src/components/pieces/PieceNotesPanel.tsx`. This component receives `pieceId` and renders:
- General piece notes (editable textarea)
- A read-only summary of all formation choreo_notes and counts_notes (listed by formation label)

**IMPORTANT:** Per-formation notes (choreo_notes, counts_notes) stay editable on the Canvas tab alongside the formation they describe. The Notes tab provides an overview, not the primary editing surface. This preserves the workflow of annotating formations while looking at them.

- [ ] **Step 7: Extract PieceRosterPanel from PieceDetailPage**

Extract the dancer assignment UI from PieceDetailPage into `src/components/pieces/PieceRosterPanel.tsx`. Shows which dancers are in this piece, add/remove dancers.

- [ ] **Step 8: Create SongSectionsPanel**

`src/components/pieces/SongSectionsPanel.tsx` — visual timeline editor for song sections.

Shows a horizontal bar representing the song length (from `piece.duration_seconds`). Each section is a colored block on the timeline. Below the timeline, a list of sections with:
- Section type dropdown (from SECTION_TYPES)
- Label input
- Start/end time inputs (MM:SS format)
- Optional formation link dropdown
- Delete button

Add section button creates a new section at the end of the last section (or at 0:00 if none exist). Default label = section type name.

If `piece.duration_seconds` is null, show a message: "Set the song length in piece info to use song sections."

- [ ] **Step 9: Refactor PieceDetailPage to tabbed layout**

Replace the current single-scroll layout with:
1. Piece header (title, info modal trigger, back button) — always visible
2. PieceTabs — sticky below header
3. Tab content area — renders the active tab's component

Tab mapping:
- `canvas` → existing FormationCanvas + toolbar + thumbnails + playback + audio + per-formation notes
- `notes` → PieceNotesPanel (piece-level notes + formation notes overview)
- `sections` → SongSectionsPanel
- `roster` → PieceRosterPanel

Default active tab: `canvas`.

**CRITICAL — Canvas tab rendering:** Use `display: none` (CSS visibility) for inactive tabs, NOT conditional rendering. The canvas tab initializes audio playback, Konva stage, and animation state — unmounting and remounting it on tab switch would reset playback position, lose unsaved drawing state, and cause performance issues. All tabs should remain mounted; only visibility changes.

- [ ] **Step 10: Run build**

```bash
cd ~/Documents/Claude\ Projects/Code/creator && npm run build
```

- [ ] **Step 11: Commit**

```bash
git add src/types/index.ts supabase/migrations/009_song_sections.sql src/services/songSections.ts src/stores/songSectionStore.ts src/components/pieces/PieceTabs.tsx src/components/pieces/SongSectionsPanel.tsx src/components/pieces/PieceNotesPanel.tsx src/components/pieces/PieceRosterPanel.tsx src/pages/PieceDetailPage.tsx
git commit -m "feat: add tabbed piece UI with song sections

Refactors PieceDetailPage into Canvas/Notes/Song Sections/Roster tabs.
Adds song section data model with timeline visualization and formation linking."
```

---

## End of Day Verification

- [ ] Run final build: `npm run build`
- [ ] Verify all 5 commits are clean: `git log --oneline -5`
- [ ] Quick visual check: `npm run dev` and navigate all pages
