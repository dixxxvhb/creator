# Beta Access Gate + Bug Reporting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate signup behind a beta access code and add in-app bug reporting so testers can submit structured feedback with auto-captured device context.

**Architecture:** Two independent features sharing a `beta.ts` config file. Bug reporting follows Creator's existing service+store pattern (Supabase CRUD in a service file, Zustand store wrapping it). The access code is client-side only — a social gate, not a security boundary.

**Tech Stack:** React 19, TypeScript, Zustand, Supabase (Postgres + RLS), Tailwind v4, Sonner (toasts), Lucide icons, Framer Motion

**Spec:** `docs/superpowers/specs/2026-03-24-beta-access-bug-reporting-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/beta.ts` | Create | All beta/testing constants: `ACCESS_CODE`, `BETA_ENABLED`, `ADMIN_EMAIL`, `APP_VERSION` |
| `src/pages/AuthPage.tsx` | Modify | Add access code field to signup mode |
| `supabase/migrations/013_bug_reports.sql` | Create | `bug_reports` table + RLS policies |
| `src/types/index.ts` | Modify | Add `BugReport`, `BugReportInsert` types |
| `src/services/bugReports.ts` | Create | Supabase CRUD for `bug_reports` table |
| `src/stores/bugReportStore.ts` | Create | Zustand store wrapping bugReports service |
| `src/components/feedback/BugReportModal.tsx` | Create | Bug report form modal |
| `src/components/feedback/BugReportButton.tsx` | Create | Floating trigger button |
| `src/components/layout/AppLayout.tsx` | Modify | Add BugReportButton to layout |
| `src/pages/SettingsPage.tsx` | Modify | Add Bug Reports admin section |

---

## Task 1: Beta Config File

**Files:**
- Create: `src/lib/beta.ts`

- [ ] **Step 1: Create `beta.ts` with all constants**

```typescript
// Beta testing configuration
// Flip BETA_ENABLED to false for public launch

export const BETA_ENABLED = true;
export const ACCESS_CODE = 'CREATOR2026';
export const ADMIN_EMAIL = 'dancewithdixon@gmail.com';
export const APP_VERSION = '0.1.0';
```

- [ ] **Step 2: Verify build**

Run: `cd ~/Documents/Claude\ Projects/Code/creator && npm run build`
Expected: Clean build, no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/beta.ts
git commit -m "feat: add beta config constants"
```

---

## Task 2: Beta Access Code on Signup

**Files:**
- Modify: `src/pages/AuthPage.tsx`

- [ ] **Step 1: Add access code state and validation to AuthPage**

Add to the existing state declarations (after line 14):
```typescript
const [accessCode, setAccessCode] = useState('');
const [codeVerified, setCodeVerified] = useState(false);
```

Add imports at the top:
```typescript
import { BETA_ENABLED, ACCESS_CODE } from '@/lib/beta';
```

- [ ] **Step 2: Add access code field to the signup form**

When `mode === 'signup'` and `BETA_ENABLED` is true, show an access code field. If the code hasn't been verified yet, only show the code field (not email/password). Once verified, reveal the full signup form.

In the form's `<form>` body, before the Email input, add:

```tsx
{mode === 'signup' && BETA_ENABLED && !codeVerified && (
  <div className="space-y-4">
    <Input
      label="Access Code"
      type="text"
      value={accessCode}
      onChange={(e) => { setAccessCode(e.target.value); setError(null); }}
      placeholder="Enter your beta access code"
      required
      autoFocus
    />
    {error && (
      <p className="text-sm text-danger-500 bg-danger-50 px-3 py-2 rounded-lg">
        {error}
      </p>
    )}
    <Button
      type="button"
      className="w-full"
      onClick={() => {
        if (accessCode.toUpperCase().trim() === ACCESS_CODE) {
          setCodeVerified(true);
          setError(null);
        } else {
          setError('Invalid access code');
        }
      }}
    >
      Continue
    </Button>
  </div>
)}
```

- [ ] **Step 3: Conditionally show email/password fields**

Wrap the existing email, password, confirm password inputs, error display, and submit button in a condition:

```tsx
{(mode === 'login' || !BETA_ENABLED || codeVerified) && (
  <>
    {/* existing Email Input */}
    {/* existing Password Input */}
    {/* existing Confirm Password (signup only) */}
    {/* existing error display */}
    {/* existing Submit Button */}
  </>
)}
```

- [ ] **Step 4: Reset access code state when switching modes**

Update the Login/Sign Up tab buttons' onClick handlers to also reset access code state:

```tsx
// Login tab button onClick:
onClick={() => { setMode('login'); setError(null); setCodeVerified(false); setAccessCode(''); }}

// Sign Up tab button onClick:
onClick={() => { setMode('signup'); setError(null); setCodeVerified(false); setAccessCode(''); }}
```

- [ ] **Step 5: Verify build**

Run: `cd ~/Documents/Claude\ Projects/Code/creator && npm run build`
Expected: Clean build

- [ ] **Step 6: Commit**

```bash
git add src/pages/AuthPage.tsx
git commit -m "feat: gate signup behind beta access code"
```

---

## Task 3: Bug Reports Migration

**Files:**
- Create: `supabase/migrations/013_bug_reports.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 013: Bug reports table for beta testing feedback

CREATE TABLE bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  user_email text NOT NULL,
  description text NOT NULL,
  expected text,
  severity text NOT NULL DEFAULT 'major' CHECK (severity IN ('minor', 'major', 'blocker')),
  page_url text,
  screen_width integer,
  screen_height integer,
  user_agent text,
  app_version text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own bug reports
CREATE POLICY "Users can insert own bug reports" ON bug_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own bug reports
CREATE POLICY "Users can read own bug reports" ON bug_reports
  FOR SELECT USING (auth.uid() = user_id);

-- Admin (Dixon) can read all bug reports
CREATE POLICY "Admin can read all bug reports" ON bug_reports
  FOR SELECT USING (
    auth.uid() = (SELECT id FROM auth.users WHERE email = 'dancewithdixon@gmail.com' LIMIT 1)
  );

-- Admin can update bug report status
CREATE POLICY "Admin can update bug reports" ON bug_reports
  FOR UPDATE USING (
    auth.uid() = (SELECT id FROM auth.users WHERE email = 'dancewithdixon@gmail.com' LIMIT 1)
  )
  WITH CHECK (
    auth.uid() = (SELECT id FROM auth.users WHERE email = 'dancewithdixon@gmail.com' LIMIT 1)
  );
```

- [ ] **Step 2: Apply migration to Supabase**

Run: `cd ~/Documents/Claude\ Projects/Code/creator && npx supabase db push --linked`
(Or apply manually via Supabase dashboard SQL editor if CLI isn't configured)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/013_bug_reports.sql
git commit -m "migration: create bug_reports table with RLS"
```

---

## Task 4: Bug Report Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add BugReport types at the end of `types/index.ts`**

```typescript
// ─── Bug Reports ───
export type BugSeverity = 'minor' | 'major' | 'blocker';
export type BugStatus = 'open' | 'resolved' | 'dismissed';

export interface BugReport {
  id: string;
  user_id: string;
  user_email: string;
  description: string;
  expected: string | null;
  severity: BugSeverity;
  page_url: string | null;
  screen_width: number | null;
  screen_height: number | null;
  user_agent: string | null;
  app_version: string | null;
  status: BugStatus;
  created_at: string;
}

export type BugReportInsert = Pick<BugReport, 'description' | 'severity'> & {
  user_email: string;
  expected?: string | null;
  page_url?: string | null;
  screen_width?: number | null;
  screen_height?: number | null;
  user_agent?: string | null;
  app_version?: string | null;
};
```

- [ ] **Step 2: Verify build**

Run: `cd ~/Documents/Claude\ Projects/Code/creator && npm run build`
Expected: Clean build

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "types: add BugReport and BugReportInsert"
```

---

## Task 5: Bug Report Service

**Files:**
- Create: `src/services/bugReports.ts`

Follow the exact pattern from `src/services/pieces.ts`: import supabase, export async functions, throw on error.

- [ ] **Step 1: Create the service file**

```typescript
import { supabase } from '@/lib/supabase';
import type { BugReport, BugReportInsert, BugStatus } from '@/types';

export async function createBugReport(report: BugReportInsert): Promise<BugReport> {
  const { data, error } = await supabase
    .from('bug_reports')
    .insert(report)
    .select()
    .single();
  if (error) throw new Error(`Failed to submit bug report: ${error.message}`);
  return data;
}

export async function fetchBugReports(): Promise<BugReport[]> {
  const { data, error } = await supabase
    .from('bug_reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to fetch bug reports: ${error.message}`);
  return data;
}

export async function updateBugReportStatus(id: string, status: BugStatus): Promise<BugReport> {
  const { data, error } = await supabase
    .from('bug_reports')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update bug report: ${error.message}`);
  return data;
}
```

- [ ] **Step 2: Verify build**

Run: `cd ~/Documents/Claude\ Projects/Code/creator && npm run build`
Expected: Clean build

- [ ] **Step 3: Commit**

```bash
git add src/services/bugReports.ts
git commit -m "feat: add bug report Supabase service"
```

---

## Task 6: Bug Report Store

**Files:**
- Create: `src/stores/bugReportStore.ts`

Follow the exact pattern from `src/stores/pieceStore.ts`: create Zustand store, wrap service calls, manage loading/error state, use `toast` from toastStore.

- [ ] **Step 1: Create the store file**

```typescript
import { create } from 'zustand';
import type { BugReport, BugReportInsert, BugStatus } from '@/types';
import * as bugReportService from '@/services/bugReports';
import { toast } from '@/stores/toastStore';

interface BugReportState {
  reports: BugReport[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  submit: (report: BugReportInsert) => Promise<boolean>;
  updateStatus: (id: string, status: BugStatus) => Promise<void>;
}

export const useBugReportStore = create<BugReportState>((set, get) => ({
  reports: [],
  isLoading: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const reports = await bugReportService.fetchBugReports();
      set({ reports, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load bug reports';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  submit: async (report) => {
    try {
      await bugReportService.createBugReport(report);
      toast.success('Bug report submitted — thank you!');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit bug report';
      toast.error(message);
      return false;
    }
  },

  updateStatus: async (id, status) => {
    try {
      const updated = await bugReportService.updateBugReportStatus(id, status);
      set((state) => ({
        reports: state.reports.map((r) => (r.id === id ? updated : r)),
      }));
      toast.success(`Report marked as ${status}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update bug report';
      toast.error(message);
    }
  },
}));
```

- [ ] **Step 2: Verify build**

Run: `cd ~/Documents/Claude\ Projects/Code/creator && npm run build`
Expected: Clean build

- [ ] **Step 3: Commit**

```bash
git add src/stores/bugReportStore.ts
git commit -m "feat: add bug report Zustand store"
```

---

## Task 7: Bug Report Modal

**Files:**
- Create: `src/components/feedback/BugReportModal.tsx`

Uses existing `Modal`, `Textarea`, `Button` components. Auto-captures context on submit.

- [ ] **Step 1: Create the feedback directory and modal component**

```typescript
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useBugReportStore } from '@/stores/bugReportStore';
import { useAuthStore } from '@/stores/authStore';
import { APP_VERSION } from '@/lib/beta';
import { cn } from '@/lib/utils';
import type { BugSeverity } from '@/types';

const severityOptions: { value: BugSeverity; label: string }[] = [
  { value: 'minor', label: 'Minor' },
  { value: 'major', label: 'Major' },
  { value: 'blocker', label: 'Blocker' },
];

interface BugReportModalProps {
  open: boolean;
  onClose: () => void;
}

export function BugReportModal({ open, onClose }: BugReportModalProps) {
  const [description, setDescription] = useState('');
  const [expected, setExpected] = useState('');
  const [severity, setSeverity] = useState<BugSeverity>('major');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useBugReportStore((s) => s.submit);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  function reset() {
    setDescription('');
    setExpected('');
    setSeverity('major');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    const success = await submit({
      description: description.trim(),
      expected: expected.trim() || null,
      severity,
      user_email: user?.email ?? 'unknown',
      page_url: location.pathname,
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
      user_agent: navigator.userAgent,
      app_version: APP_VERSION,
    });

    setIsSubmitting(false);
    if (success) {
      reset();
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Report a Bug" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          label="What happened?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what went wrong..."
          rows={3}
          required
        />
        <Textarea
          label="What did you expect?"
          value={expected}
          onChange={(e) => setExpected(e.target.value)}
          placeholder="What should have happened? (optional)"
          rows={2}
          hint="Optional"
        />
        <div>
          <label className="text-sm font-medium text-text-secondary block mb-2">
            Severity
          </label>
          <div className="flex gap-2">
            {severityOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSeverity(value)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-all border',
                  severity === value
                    ? 'border-current accent-text accent-bg-light'
                    : 'border-border-light text-text-secondary hover:text-text-primary hover:bg-surface-secondary',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-text-tertiary">
          Page, screen size, and browser info are captured automatically.
        </p>
        <Button type="submit" loading={isSubmitting} className="w-full">
          Submit Report
        </Button>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd ~/Documents/Claude\ Projects/Code/creator && npm run build`
Expected: Clean build

- [ ] **Step 3: Commit**

```bash
git add src/components/feedback/BugReportModal.tsx
git commit -m "feat: add bug report modal component"
```

---

## Task 8: Floating Bug Report Button + Wire Into Layout

**Files:**
- Create: `src/components/feedback/BugReportButton.tsx`
- Modify: `src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Create the floating button component**

```typescript
import { useState } from 'react';
import { Bug } from 'lucide-react';
import { BugReportModal } from './BugReportModal';

export function BugReportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface-secondary border border-border-light text-text-secondary text-sm font-medium shadow-lg hover:bg-border-light hover:text-text-primary transition-all"
        aria-label="Report a bug"
      >
        <Bug size={16} />
        <span className="hidden sm:inline">Report Bug</span>
      </button>
      <BugReportModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

Note: `bottom-20` on mobile places it above the BottomTabBar (which is `fixed bottom-0` with ~64px height). `md:bottom-6` on desktop where there's no tab bar.

- [ ] **Step 2: Add BugReportButton to AppLayout**

In `src/components/layout/AppLayout.tsx`, add the import:
```typescript
import { BugReportButton } from '@/components/feedback/BugReportButton';
```

Add `<BugReportButton />` inside the layout div, after the `<Toaster>` component (before the closing `</div>`):
```tsx
      <Toaster ... />
      <BugReportButton />
    </div>
```

- [ ] **Step 3: Verify build**

Run: `cd ~/Documents/Claude\ Projects/Code/creator && npm run build`
Expected: Clean build

- [ ] **Step 4: Commit**

```bash
git add src/components/feedback/BugReportButton.tsx src/components/layout/AppLayout.tsx
git commit -m "feat: add floating bug report button to app layout"
```

---

## Task 9: Admin Bug Reports View in Settings

**Files:**
- Modify: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: Add imports and admin section to SettingsPage**

Add imports at top of `SettingsPage.tsx`:
```typescript
import { useEffect, useState } from 'react';
import { ADMIN_EMAIL } from '@/lib/beta';
import { useBugReportStore } from '@/stores/bugReportStore';
import { Badge } from '@/components/ui/Badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { BugReport, BugStatus } from '@/types';
```

Update the existing `import { useState } from 'react'` if it already exists — merge with `useEffect`.

- [ ] **Step 2: Add admin detection and bug report loading**

Inside the `SettingsPage` component, after the existing store hooks:

```typescript
const isAdmin = user?.email === ADMIN_EMAIL;
const { reports, isLoading: reportsLoading, load: loadReports, updateStatus } = useBugReportStore();
const [statusFilter, setStatusFilter] = useState<BugStatus | 'all'>('open');
const [expandedId, setExpandedId] = useState<string | null>(null);

useEffect(() => {
  if (isAdmin) loadReports();
}, [isAdmin, loadReports]);

const filteredReports = statusFilter === 'all'
  ? reports
  : reports.filter((r) => r.status === statusFilter);
```

- [ ] **Step 3: Add the Bug Reports section JSX**

Add a new section before the Account section (before `{/* Account Section */}`):

```tsx
{isAdmin && (
  <section>
    <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3 px-1">
      Bug Reports
    </h2>
    <Card>
      {/* Filter tabs */}
      <div className="flex gap-1 bg-surface-secondary rounded-lg p-1 mb-4">
        {(['open', 'resolved', 'dismissed', 'all'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={cn(
              'flex-1 text-xs py-1.5 rounded-md transition-colors font-medium capitalize',
              statusFilter === filter
                ? 'bg-surface-elevated text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {filter}
            {filter !== 'all' && (
              <span className="ml-1 text-text-tertiary">
                ({reports.filter((r) => r.status === filter).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {reportsLoading ? (
        <p className="text-sm text-text-tertiary text-center py-4">Loading...</p>
      ) : filteredReports.length === 0 ? (
        <p className="text-sm text-text-tertiary text-center py-4">
          {statusFilter === 'open' ? 'No open bug reports' : 'No bug reports'}
        </p>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="border border-border-light rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-secondary transition-colors"
              >
                <Badge
                  variant={
                    report.severity === 'blocker' ? 'danger'
                    : report.severity === 'major' ? 'warning'
                    : 'default'
                  }
                >
                  {report.severity}
                </Badge>
                <p className="flex-1 text-sm text-text-primary truncate">
                  {report.description}
                </p>
                <span className="text-xs text-text-tertiary shrink-0">
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
                {expandedId === report.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {expandedId === report.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-border-light pt-3">
                  <div>
                    <p className="text-xs font-medium text-text-secondary mb-1">Description</p>
                    <p className="text-sm text-text-primary whitespace-pre-wrap">{report.description}</p>
                  </div>
                  {report.expected && (
                    <div>
                      <p className="text-xs font-medium text-text-secondary mb-1">Expected</p>
                      <p className="text-sm text-text-primary whitespace-pre-wrap">{report.expected}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs text-text-tertiary">
                    <p>Reporter: {report.user_email}</p>
                    <p>Page: {report.page_url}</p>
                    <p>Screen: {report.screen_width}x{report.screen_height}</p>
                    <p>Version: {report.app_version ?? '—'}</p>
                  </div>
                  {report.status === 'open' && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="secondary" onClick={() => updateStatus(report.id, 'resolved')}>
                        Mark Resolved
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(report.id, 'dismissed')}>
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  </section>
)}
```

- [ ] **Step 4: Verify build**

Run: `cd ~/Documents/Claude\ Projects/Code/creator && npm run build`
Expected: Clean build

- [ ] **Step 5: Commit**

```bash
git add src/pages/SettingsPage.tsx
git commit -m "feat: add bug reports admin view in settings"
```

---

## Task 10: Final Verification + Push

- [ ] **Step 1: Full build check**

Run: `cd ~/Documents/Claude\ Projects/Code/creator && npm run build`
Expected: Clean build with no warnings

- [ ] **Step 2: Manual smoke test checklist**

Run `npm run dev` and verify:
1. Sign Up tab shows access code field
2. Wrong code shows error, doesn't reveal email/password
3. Correct code (`CREATOR2026`) reveals signup form
4. Login tab works unchanged for existing accounts
5. Floating "Report Bug" button visible on all pages
6. Bug report modal opens, form submits successfully
7. Button sits above bottom tab bar on mobile viewport
8. Settings page shows Bug Reports section for admin email

- [ ] **Step 3: Push to GitHub**

```bash
git push origin main
```

GitHub Actions auto-deploys to GitHub Pages.
