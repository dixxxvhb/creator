# Beta Access Gate + Bug Reporting System

**Date:** 2026-03-24
**Status:** Draft
**Goal:** Get Creator into tester hands with controlled access and a lightweight way to report bugs.

---

## 1. Beta Access Gate

### Problem
The app currently has open signup via Supabase Auth. Before launch, Dixon needs to control who can create accounts — limited to invited testers only.

### Design

**Access code approach:** A single hardcoded access code gates the Sign Up tab. Login remains unchanged for existing accounts.

**Auth flow change:**
```
Login tab:     Email + Password → sign in (unchanged)
Sign Up tab:   Access Code → Email + Password + Confirm → create account
```

**Implementation details:**

- Add an `ACCESS_CODE` constant in a new `src/lib/beta.ts` file
  - Default value: `CREATOR2026` (Dixon distributes via text/DM)
  - A `BETA_ENABLED` boolean flag controls whether the gate is active
  - When `BETA_ENABLED = false`, signup works normally (for public launch)
- Modify `AuthPage.tsx`:
  - Sign Up mode shows an "Access Code" field above email/password
  - Client-side validation: code must match before the rest of the form is shown
  - Wrong code → inline error: "Invalid access code"
  - Correct code → reveals email/password fields with a brief success state
- No server-side validation needed — the code gates account creation UI, not an API. Supabase email/password signup is the real auth layer. This is a social gate, not a security boundary. Anyone technically skilled enough to bypass it is welcome to test.

**What NOT to do:**
- No Supabase edge function or RPC for code validation — overkill for a UI gate
- No code expiration or usage tracking — unnecessary for <20 testers
- No changes to the login tab or existing user flow

### Files touched
| File | Change |
|------|--------|
| `src/lib/beta.ts` | New — `ACCESS_CODE`, `BETA_ENABLED`, `ADMIN_EMAIL`, `APP_VERSION` constants |
| `src/pages/AuthPage.tsx` | Add access code field to signup mode |

---

## 2. Bug Report System

### Problem
Testers need a frictionless way to report bugs from inside the app. Dance people, not engineers — the form must be short and the system must auto-capture technical context.

### Design

**Three components:**
1. Floating trigger button (always visible)
2. Bug report modal (structured form)
3. Admin view in Settings (Dixon only)

### 2a. Supabase Table

**Table: `bug_reports`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `user_id` | uuid | FK to `auth.users`, from session |
| `user_email` | text | Denormalized for quick reading |
| `description` | text | "What happened?" — required |
| `expected` | text | "What did you expect?" — optional |
| `severity` | text | `minor` / `major` / `blocker` — required, default `major` |
| `page_url` | text | Auto-captured: `window.location.pathname` |
| `screen_width` | integer | Auto-captured: `window.innerWidth` |
| `screen_height` | integer | Auto-captured: `window.innerHeight` |
| `user_agent` | text | Auto-captured: `navigator.userAgent` |
| `app_version` | text | Auto-captured from `APP_VERSION` constant in `beta.ts` |
| `status` | text | `open` / `resolved` / `dismissed` — default `open` |
| `created_at` | timestamptz | Default `now()` |

**RLS policy:** Users can INSERT their own reports. Only Dixon's user ID can SELECT/UPDATE all reports. Users cannot read other users' reports. The admin SELECT policy uses a subquery (`auth.uid() = (SELECT id FROM auth.users WHERE email = 'dancewithdixon@gmail.com')`) so the migration doesn't need a hardcoded UUID.

**Access:** Bug reporting is only available to authenticated users. The floating button renders inside `AppLayout`, which is behind `AuthGuard`.

### 2b. Floating Trigger Button

- Fixed position, bottom-right corner
- Small pill button: "Report Bug" with a bug icon (Lucide `Bug`)
- Sits above the bottom tab bar on mobile (add appropriate `bottom` offset)
- Subtle styling — `bg-surface-secondary` with border, not the accent color. It shouldn't compete with the app's primary actions.
- Clicking opens the BugReportModal

### 2c. Bug Report Modal

Uses the existing `Modal` component. Form fields:

1. **What happened?** — `Textarea`, required, placeholder: "Describe what went wrong..."
2. **What did you expect?** — `Textarea`, optional, placeholder: "What should have happened?"
3. **Severity** — 3-option pill selector (minor / major / blocker), defaults to `major`
4. Auto-captured fields (not shown to user): page URL, screen dimensions, user agent, user email

**On submit:**
- Insert row into `bug_reports` via Supabase client
- Show success toast via Sonner: "Bug report submitted — thank you!"
- Close modal, reset form

**Validation:** `description` is required. Everything else has defaults or is optional.

### 2d. Admin View (Settings Page)

- New "Bug Reports" section in `SettingsPage.tsx`
- **Visibility:** Only rendered when the logged-in user's email matches Dixon's admin email (hardcoded in `beta.ts`)
- **List view:** Cards showing severity badge, truncated description, reporter email, relative timestamp
- **Expand:** Click to see full description, expected behavior, and auto-captured context
- **Actions:** "Mark Resolved" and "Dismiss" buttons per report
- **Filtering:** Show open reports by default, toggle to see resolved/dismissed
- **Empty state:** "No bug reports yet" with the standard EmptyState component

### Files touched
| File | Change |
|------|--------|
| `src/lib/beta.ts` | Already created in section 1 — contains `ADMIN_EMAIL` + `APP_VERSION` |
| `src/services/bugReportService.ts` | New — Supabase CRUD for `bug_reports` table |
| `src/stores/bugReportStore.ts` | New — Zustand store wrapping the service |
| `src/components/feedback/BugReportButton.tsx` | New — floating trigger button |
| `src/components/feedback/BugReportModal.tsx` | New — report form modal |
| `src/components/layout/AppLayout.tsx` | Add `BugReportButton` to layout |
| `src/pages/SettingsPage.tsx` | Add Bug Reports admin section |
| `supabase/migrations/XXX_create_bug_reports.sql` | New — table + RLS policies |

---

## 3. Scope Boundaries

**In scope:**
- Beta access code on signup
- Bug report submission from anywhere in the app
- Admin view of reports in Settings
- Auto-captured device/page context

**Out of scope (can add later):**
- Email notifications on new reports
- Screenshot capture
- GitHub Issues integration
- Unique per-tester access codes
- Server-side access code validation
- Bug report analytics or dashboards

---

## 4. Architecture Notes

This follows Creator's existing patterns:
- **Service + Store pattern:** `bugReportService.ts` handles Supabase CRUD, `bugReportStore.ts` wraps it in Zustand — same as all 14 existing stores
- **Component organization:** New `feedback/` directory under components, consistent with existing domain grouping (canvas/, pieces/, roster/, etc.)
- **Modal pattern:** Reuses the existing `Modal` component with bottom-sheet on mobile
- **Migration pattern:** New SQL migration file, same as existing 12 migrations
- **Config pattern:** `beta.ts` centralizes all beta/testing constants (`ACCESS_CODE`, `BETA_ENABLED`, `ADMIN_EMAIL`, `APP_VERSION`) — single file to update for launch
