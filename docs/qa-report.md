# Creator App QA Report -- 2026-03-25

## Executive Summary

Two-wave QA audit: Wave 1 (code review, 5 agents) + Wave 2 (live preview testing, 5 agents). Tested from the perspective of 10 real-world user personas.

| Category | Count |
|----------|-------|
| Critical Bugs | 7 |
| High Bugs | 15 |
| Medium Bugs | 21 |
| Low Issues | 18 |
| Tier Gating Issues | 10 |
| Missing Features (known gaps) | 14 |
| Enhancement Requests | 12 |

---

## Critical Bugs (Must Fix Before Launch)

### BUG-001: Sidebar and BottomTabBar navigation locks are cosmetic only
- **Severity:** Critical
- **Area:** Tier Gating
- **Personas:** All
- **Files:** `src/components/layout/Sidebar.tsx`, `src/components/layout/BottomTabBar.tsx`
- **Description:** Lock badges appear on tier-restricted nav items, but clicking them still navigates to the page. `NavLink` has no `onClick` prevention for locked items.
- **Expected:** Locked items should not navigate; should show upgrade prompt.
- **Actual:** Lock badge is decorative. Users navigate freely to restricted pages.
- **Fix:** Add `onClick={(e) => { e.preventDefault(); showUpgradePrompt(); }}` for locked items, or replace `NavLink` with a non-navigating element.

### BUG-002: `drawn_pathways` feature gate is completely unenforced
- **Severity:** Critical
- **Area:** Tier Gating / Canvas
- **Personas:** 6 (Anika, free user), 4 (Marissa, free user)
- **Files:** `src/components/canvas/CanvasToolbar.tsx`, `src/components/canvas/PathLayer.tsx`, `src/components/canvas/FormationCanvas.tsx`
- **Description:** `drawn_pathways` is defined in `TIER_FEATURES` as requiring 'mid' tier, but no component checks for it. Free users can enter draw mode, create paths, edit paths, and delete paths with zero restriction.
- **Expected:** Draw mode button should be gated; paths should not render for free users.
- **Fix:** Wrap draw mode toggle in `TierGate` or check `hasFeature('drawn_pathways')` before enabling draw tools.

### BUG-003: `transition_animations` feature gate is completely unenforced
- **Severity:** Critical
- **Area:** Tier Gating / Canvas
- **Personas:** 6 (Anika, free user), 4 (Marissa, free user)
- **Files:** `src/components/canvas/PlaybackControls.tsx`, `src/pages/PieceDetailPage.tsx`
- **Description:** Same as BUG-002 but for transition animations. Playback controls and transition settings render unconditionally.
- **Expected:** Playback/animation controls should be gated for free users.
- **Fix:** Wrap PlaybackControls in `TierGate` or check `hasFeature('transition_animations')`.

### BUG-004: Free piece limit bypassable via multiple paths
- **Severity:** Critical
- **Area:** Tier Gating
- **Personas:** 6 (Anika), 4 (Marissa), 10 (Riley)
- **Files:** `src/pages/PiecesPage.tsx` (enforced), `src/pages/PieceSetupPage.tsx` (NOT), `src/stores/pieceStore.ts` (NOT), `src/components/pieces/QuickAddPieceModal.tsx` (NOT), `src/pages/DashboardPage.tsx` (NOT)
- **Description:** `FREE_PIECE_LIMIT = 2` only disables the "New Piece" button on PiecesPage. Bypassed by: (1) navigating to `/pieces/new` directly, (2) clicking "New Piece" on Dashboard, (3) using QuickAddPieceModal from Shows/Costumes/Seasons.
- **Expected:** Piece limit enforced at the store level (`pieceStore.add()`), not just one UI button.
- **Fix:** Add limit check in `pieceStore.add()` that returns early with toast if free tier at limit.

### BUG-005: `shows` and `show_acts` tables have no migration file
- **Severity:** Critical
- **Area:** Database / Infrastructure
- **Personas:** 7 (Patricia), 1 (Karen)
- **Files:** `supabase/migrations/` (missing), `src/services/shows.ts`, `src/stores/showStore.ts`
- **Description:** The shows and show_acts tables are referenced by service/store code but have no `CREATE TABLE` SQL in any migration file. They were likely created manually in the Supabase dashboard. No FK constraints or cascade behavior can be verified. Database cannot be reproduced from migrations alone.
- **Expected:** All tables defined in version-controlled migration files.
- **Fix:** Create a new migration file defining both tables with proper FK constraints and ON DELETE CASCADE.

---

## High Bugs

### BUG-006: ShowsPage, ShowDetailPage, BackstagePage have zero tier gating
- **Severity:** High
- **Area:** Tier Gating
- **Files:** `src/pages/ShowsPage.tsx`, `src/pages/ShowDetailPage.tsx`, `src/pages/BackstagePage.tsx`
- **Description:** `shows` feature requires Studio tier per sidebar, but all three pages render full content with no `TierGate` wrapper. Additionally, `'shows'` is referenced in the Sidebar's `tierFeature` but is NOT defined in `TIER_FEATURES` in types/index.ts -- would cause a runtime crash when `BETA_ENABLED` is turned off.
- **Fix:** Add `shows: 'studio'` to `TIER_FEATURES`, wrap all three pages in `TierGate`.

### BUG-007: CompetitionsPage has zero tier gating
- **Severity:** High
- **Area:** Tier Gating
- **Files:** `src/pages/CompetitionsPage.tsx`
- **Description:** Sidebar marks it with `seasons` tier requirement, but the page has no `TierGate`. Direct URL access renders full content.
- **Fix:** Wrap page content in `<TierGate feature="seasons">`.

### BUG-008: SeasonDetailPage has zero tier gating
- **Severity:** High
- **Area:** Tier Gating
- **Files:** `src/pages/SeasonDetailPage.tsx`
- **Description:** SeasonsPage is gated, but `/seasons/:id` has no tier check. Direct URL access renders full detail (competitions, entries, pieces, timeline).
- **Fix:** Wrap page content in `<TierGate feature="seasons">`.

### BUG-009: `dancerPositions.upsertPositions` is non-atomic (data loss risk)
- **Severity:** High
- **Area:** State / Data Integrity
- **Files:** `src/services/dancerPositions.ts` (lines 39-53)
- **Description:** Delete-all-then-insert pattern. If delete succeeds but insert fails (network error, constraint violation), all dancer positions for that formation are permanently lost.
- **Expected:** Atomic upsert or transaction.
- **Fix:** Use Supabase `.upsert()` with conflict resolution on `(formation_id, dancer_label)`, or wrap in an RPC transaction.

### BUG-010: `authStore.initialize()` hangs forever if Supabase unreachable
- **Severity:** High
- **Area:** Auth / UX
- **Files:** `src/stores/authStore.ts`
- **Description:** `getSession()` uses `.then()` with no `.catch()`. If Supabase is unreachable, `isInitialized` stays `false`, `isLoading` stays `true`, and the app shows a loading spinner indefinitely with no error feedback or retry.
- **Fix:** Add `.catch()` that sets error state, shows retry button.

### BUG-011: Zoom toolbar buttons are disconnected from canvas zoom
- **Severity:** High
- **Area:** Canvas / UX
- **Personas:** 2 (Jaylen), 5 (Derek), 6 (Anika)
- **Files:** `src/pages/PieceDetailPage.tsx` (line 232), `src/components/canvas/FormationCanvas.tsx` (line 45)
- **Description:** PieceDetailPage has `const [zoom, setZoom] = useState(1)` passed to CanvasToolbar. FormationCanvas has its own `const [zoom, setZoom] = useState(1)` controlled only by Ctrl+wheel. The toolbar zoom in/out/reset buttons update the page state, which has zero effect on the canvas.
- **Fix:** Remove duplicate zoom state. Either lift canvas zoom to page level or expose canvas zoom via ref/callback.

### BUG-012: Notes textarea calls Supabase API on every keystroke
- **Severity:** High
- **Area:** Performance / API
- **Files:** `src/pages/PieceDetailPage.tsx` (lines 901-916)
- **Description:** `onChange` for choreo_notes and counts_notes textareas calls `updateFormation()` (async Supabase write) on every keystroke. No debounce. Typing generates massive API traffic.
- **Fix:** Debounce `updateFormation` calls (500ms-1s) or switch to `onBlur`.

### BUG-013: No show delete button in UI
- **Severity:** High
- **Area:** Shows / UX
- **Personas:** 7 (Patricia), 1 (Karen)
- **Files:** `src/pages/ShowsPage.tsx`, `src/pages/ShowDetailPage.tsx`
- **Description:** `removeShow` is fully implemented in store and service but never wired to a button in either page. Shows can be created but never deleted through the interface.
- **Fix:** Add delete button with confirm dialog to ShowDetailPage header.

### BUG-014: No `error` event listener on Audio element
- **Severity:** High
- **Area:** Audio
- **Personas:** 2 (Jaylen), 5 (Derek), 9 (Sam)
- **Files:** `src/hooks/useAudioPlayer.ts`
- **Description:** The hook listens for `loadedmetadata` and `ended` but NOT `error`. If audio URL is invalid, expired, or file corrupt, the player shows controls but provides zero feedback. Non-functional player with no explanation.
- **Fix:** Add `audio.addEventListener('error', ...)` and surface error state.

### BUG-015: PNG export captures current zoom/viewport, not full stage
- **Severity:** High
- **Area:** Export
- **Personas:** 2 (Jaylen), 4 (Marissa), 6 (Anika)
- **Files:** `src/lib/exportImage.ts`, `src/components/canvas/FormationCanvas.tsx`
- **Description:** PNG export calls `Stage.toDataURL()` which captures the current viewport. A user zoomed to 200% gets a cropped export. No option to reset zoom for export or export full stage.
- **Fix:** Temporarily reset zoom to 1.0 before capture, restore after.

### BUG-016: RESET_TABLES missing 4 tables
- **Severity:** High
- **Area:** Beta / Testing
- **Files:** `src/lib/beta.ts`
- **Description:** `RESET_TABLES` is missing: `costume_accessories`, `song_sections`, `shows`, `show_acts`. Beta reset leaves orphaned data in these tables.
- **Fix:** Add missing tables in correct deletion order (children before parents).

### BUG-017: QuickAddPieceModal fire-and-forget addFormation
- **Severity:** High
- **Area:** State / Data Integrity
- **Files:** `src/components/pieces/QuickAddPieceModal.tsx` (line 77)
- **Description:** `addFormation(...)` is called without `await`. `onCreated(piece)` fires immediately. If user navigates to the new piece before formation insert completes, they see an empty formation list. Unhandled promise rejection if it fails.
- **Fix:** `await addFormation(...)` before calling `onCreated`.

### BUG-018: PDF export causes visible canvas flickering
- **Severity:** High
- **Area:** Export / UX
- **Personas:** 1 (Karen), 2 (Jaylen), 5 (Derek)
- **Files:** `src/pages/PieceDetailPage.tsx` (lines 362-371)
- **Description:** Export loops through formations, calling `setActiveFormation()` with 150ms delays. User sees the canvas rapidly switching formations. No UI lock -- clicking during export corrupts captures. 30 formations = ~4.5 seconds of flickering.
- **Fix:** Add modal overlay during export, or capture off-screen.

---

## Medium Bugs

### BUG-019: Piece deletion leaves stale data in 5+ stores
- **Files:** `src/stores/pieceStore.ts`
- **Description:** `pieceStore.remove()` only removes the piece. formationStore, costumeStore, pathStore, songSectionStore, and seasonStore all retain references until page navigation.

### BUG-020: Season deletion doesn't clean up entries in store
- **Files:** `src/stores/seasonStore.ts` (lines 96-107)
- **Description:** `removeSeason` clears competitions but NOT entries. Orphaned entries persist in store.

### BUG-021: Costume deletion doesn't clean up accessories in store
- **Files:** `src/stores/costumeStore.ts`
- **Description:** Store filters `assignments` but not `accessories` on costume delete.

### BUG-022: Piece unassignment from season doesn't warn about entries
- **Files:** `src/components/seasons/PiecePickerModal.tsx`
- **Description:** Unassigning a piece with active competition entries creates confusing state. No warning.

### BUG-023: No negative number validation on cost/score/BPM fields
- **Files:** `EntryFormModal.tsx`, `CostumeFormModal.tsx`, `PropFormModal.tsx`, `PieceSetupForm.tsx`
- **Description:** Multiple forms accept negative values for cost, score, and BPM. All nonsensical.

### BUG-024: Auto-save can lose dirty positions on formation switch
- **Files:** `src/pages/PieceDetailPage.tsx` (lines 281-307)
- **Description:** 1.5s debounce timer resets on activeFormationId change. If user switches formations within 1.5s, pending save is cancelled.

### BUG-025: No try/catch on 8+ async handlers in PieceDetailPage
- **Files:** `src/pages/PieceDetailPage.tsx`
- **Description:** `handleAudioUpload`, `handleAudioRemove`, `handleDeletePiece`, `handleDeleteFormation`, `handleAddFormation`, `handleRemoveDancer`, `handleQuickPopulate`, auto-save effect -- all lack error handling.

### BUG-026: PDF title overflow (formation PDF)
- **Files:** `src/lib/exportPdf.ts` (line 28)
- **Description:** Piece titles rendered without `splitTextToSize`. Long titles overflow page width. (Program PDF handles this correctly.)

### BUG-027: Costume PDF text fields don't wrap
- **Files:** `src/lib/exportCostumePdf.ts`
- **Description:** Description, alteration notes, and vendor URLs use single-line `doc.text()`. Long text overflows.

### BUG-028: No pan support on canvas
- **Files:** `src/components/canvas/FormationCanvas.tsx`
- **Description:** Users can zoom in but cannot pan. At high zoom, parts of the stage become inaccessible.

### BUG-029: `getElementById` React anti-pattern in PieceDetailPage
- **Files:** `src/pages/PieceDetailPage.tsx` (line 831)
- **Description:** `document.getElementById('quick-populate-count')` instead of React ref/controlled state.

### BUG-030: `sort_order` on Season always hardcoded to 0
- **Files:** `src/components/seasons/SeasonFormModal.tsx` (line 43)
- **Description:** Field exists in type/DB but is always 0. Never exposed in UI.

### BUG-031: Show acts not filtered by season
- **Files:** `src/pages/ShowDetailPage.tsx`
- **Description:** Piece picker shows ALL pieces globally, not just pieces assigned to the show's season.

### BUG-032: `studioName` never passed to program PDF export
- **Files:** `src/pages/ShowDetailPage.tsx`, `src/lib/exportProgram.ts`
- **Description:** `generateProgramPDF` accepts optional `studioName` but it's never provided. Footer always omits studio name.

### BUG-033: `alert()` used for audio errors instead of toast
- **Files:** `src/components/audio/AudioUploader.tsx` (line 29)
- **Description:** Uses browser `alert()` instead of the app's toast/sonner system.

### BUG-034: Two different snap granularities
- **Files:** `src/components/canvas/DancerDot.tsx` (SNAP_UNIT=31.25), `src/lib/smartSnap.ts` (SNAP_UNIT=1.25)
- **Description:** Interactive snapping uses 31.25, templates use 1.25. Template-placed dancers may not align with visible grid.

### BUG-035: Competition deletion may not cascade in DB
- **Files:** `src/services/competitions.ts`
- **Description:** `deleteCompetition` does simple `.delete()`. If ON DELETE CASCADE isn't set (unverifiable without migration), entries become DB orphans.

### BUG-036: Invalid date in program PDF causes "Invalid Date" text
- **Files:** `src/lib/exportProgram.ts`
- **Description:** `new Date(date + 'T00:00:00')` with malformed date string produces "Invalid Date" in PDF output.

---

## Tier Gating Audit Summary

| Feature | TIER_FEATURES | Sidebar Gated? | Page Gated? | Component Gated? | Status |
|---------|--------------|----------------|-------------|-------------------|--------|
| `home_dashboard` | studio | Yes | Partial (2 cards only) | N/A | PARTIAL |
| `seasons` | studio | Yes | Yes (SeasonsPage) | N/A | PARTIAL -- SeasonDetailPage ungated |
| `roster` | studio | Yes | Yes (RosterPage) | N/A | OK |
| `costumes` | studio | Yes (sidebar only) | Yes (CostumesPage) | N/A | OK |
| `shows` | NOT DEFINED | Yes (badge) | NO | NO | BROKEN -- missing from TIER_FEATURES |
| `drawn_pathways` | mid | N/A | N/A | NO | BROKEN -- never checked |
| `transition_animations` | mid | N/A | N/A | NO | BROKEN -- never checked |
| `unlimited_pieces` | mid | N/A | Partial (1 button) | NO (store unchecked) | BROKEN -- easily bypassed |

**Additional:** `BETA_ENABLED = true` bypasses ALL checks. Tier stored in localStorage with no server validation (DevTools bypass trivial).

---

## UX Friction Items

1. **PieceDetailPage overwhelm** -- 1131 lines, 13+ modals, 15+ toolbar buttons. Casual users (Anika, Marissa) face a wall of features they don't need.
2. **No keyboard shortcut discovery** -- Arrow keys, Delete, Ctrl+Z work but are never documented in-app.
3. **Dancer assignment flow** -- Two modes (type name vs. pick from dropdown) with tiny toggle text.
4. **`handleRemoveDancer` always removes the LAST dancer** -- Cannot remove a specific dancer.
5. **Sequential saves when adding dancers to all formations** -- Blocks UI with 20+ formations.
6. **No formation reordering** -- Cannot drag formations in thumbnail strip.
7. **No multi-select for dancers** on canvas -- Cannot move groups.
8. **Backstage view missing dancer names and song info** -- Insufficient for actual backstage use.
9. **Competition entry form** -- All fields manual, no auto-suggestions beyond category from group_size.
10. **Export doesn't include paths/pathways** -- Critical choreography info absent from all export formats.

---

## Missing Features (Known Gaps -- Not Bugs)

| Persona Expectation | Current State | Priority | Recommendation |
|---------------------|---------------|----------|----------------|
| Auto age division calculation from birthdates | Manual dropdown only | P1 (key pre-reg value prop) | Calculate from `dancer.birthday` + competition `configured_divisions` |
| Competition scheduling conflict detection | Only show conflict detection exists | P2 | Extend `showConflicts.ts` pattern |
| Multi-user / sharing / roles | Single-user, RLS by user_id | P3 (post-launch) | Add organization/team model |
| Undo/redo for formation positions | Only path undo exists | P2 | Add zundo or zustand-travel |
| Offline support | Requires Supabase connection | P3 | Service worker + local-first sync |
| Mobile-optimized canvas | iPad-first, phone untested | P2 | Pinch-zoom, touch gestures |
| Video integration | No video features | P3 (future phase) | wavesurfer.js or custom |
| Music waveform sync | Basic timeline, no cue auto-advance | P2 | Integrate wavesurfer.js |
| Bulk competition entry operations | One-at-a-time only | P2 | Batch entry modal |
| `dancer_names` field in entries | Exists in type/DB, never populated | P1 | Wire to entry form, auto-populate from piece roster |
| `time_limit_seconds` in entries | Exists in type/DB, never populated | P2 | Add to entry form |
| Show timing/duration estimates | Not tracked | P2 | Add duration per act, total show length |
| Rehearsal scheduling | Not built | P3 | Future feature |
| Duplicate entry detection | Same piece can be entered twice at same competition | P1 | Add unique constraint or warning |

---

## Enhancement Requests

| # | Request | Personas | Priority | Tier |
|---|---------|----------|----------|------|
| 1 | Formation comparison view (side-by-side) | 5 (Derek) | Should-Have | Mid |
| 2 | Batch operations (duplicate piece, assign all dancers) | 1 (Karen), 3 (Brenda) | Should-Have | Studio |
| 3 | Dashboard widgets for upcoming competitions/shows | 1 (Karen), 9 (Sam) | Nice-to-Have | Studio |
| 4 | Quick-access / favorites / pin pieces | 9 (Sam) | Nice-to-Have | All |
| 5 | Audience perspective toggle | 5 (Derek) | Nice-to-Have | Mid |
| 6 | Formation duplication at specific position | 5 (Derek) | Should-Have | All |
| 7 | Competition results import (CSV) | 3 (Brenda) | Nice-to-Have | Studio |
| 8 | Program PDF with dancer names + choreographer | 7 (Patricia) | Must-Have | Studio |
| 9 | Backstage view with dancer names + song info | 7 (Patricia) | Must-Have | Studio |
| 10 | Export paths in PDF | 2 (Jaylen), 5 (Derek) | Should-Have | Mid |
| 11 | Progressive toolbar disclosure (hide advanced tools) | 4 (Marissa), 6 (Anika) | Should-Have | All |
| 12 | In-app keyboard shortcut overlay | 2 (Jaylen), 5 (Derek) | Should-Have | All |

---

## Page-by-Page Summary

| Page | Critical Issues | Status |
|------|----------------|--------|
| **AuthPage** | `initialize()` hangs on network failure | Needs fix |
| **DashboardPage** | Partial tier gate, "New Piece" bypasses limit | Needs fix |
| **PiecesPage** | Piece limit only enforced here (1 of 5 paths) | Needs fix |
| **PieceSetupPage** | No piece limit check | Needs fix |
| **PieceDetailPage** | Zoom disconnect, no error handling, keystroke API calls, export flicker | Needs major fixes |
| **RehearsalPage** | No issues found | OK |
| **RosterPage** | Properly tier-gated | OK |
| **SeasonsPage** | Properly tier-gated | OK |
| **SeasonDetailPage** | No tier gate, orphaned entries on delete | Needs fix |
| **CompetitionsPage** | No tier gate | Needs fix |
| **CostumesPage** | Properly tier-gated (but costume_accessories table issue) | Mostly OK |
| **ShowsPage** | No tier gate, no delete button | Needs fix |
| **ShowDetailPage** | No tier gate, acts not season-filtered | Needs fix |
| **BackstagePage** | No tier gate, missing dancer names/songs | Needs fix |
| **SettingsPage** | No issues found | OK |

---

## Error Handling Summary

| Store | Catches Errors | Shows Toast | Notes |
|-------|---------------|-------------|-------|
| pieceStore | Yes | Yes | OK |
| formationStore | Yes | Yes | OK |
| rosterStore | Yes | Yes | OK |
| costumeStore | Yes | Yes | OK |
| seasonStore | Yes | Yes | OK |
| showStore | Yes | Yes | OK |
| pathStore | Yes | Yes | Only store that rethrows |
| songSectionStore | Yes | Yes | OK |
| bugReportStore | Yes | Yes | OK |
| **authStore** | **Partial** | **No** | signOut no catch, initialize hangs |
| **profileStore** | Bare catch {} | No | Silently swallows parse errors |

---

## Database Cascade Analysis

| Delete Entity | DB Cascades? | Store Cleanup? | Risk |
|---------------|-------------|----------------|------|
| Piece | Yes (full) | No (5 stores stale) | Medium |
| Season | Yes | Partial (entries orphaned) | Medium |
| Dancer | SET NULL (positions) | Soft-delete only | Low |
| Formation | Yes | Partial (paths stale) | Medium |
| Competition | Yes | Yes | Low |
| Show | Unknown (no migration) | Yes | High |
| Costume | Yes | Partial (accessories stale) | Medium |

---

---

# Wave 2: Preview Testing Findings

*5 agents tested the live app via browser automation (screenshots, clicks, form fills, navigation)*

## New Critical Bugs (from Preview Testing)

### BUG-037: BrowserRouter missing `basename="/creator/"`
- **Severity:** Critical
- **Area:** Routing
- **Personas:** All
- **Files:** `src/App.tsx` (line 30), `vite.config.ts`
- **Description:** `vite.config.ts` sets `base: '/creator/'` but `BrowserRouter` has no `basename` prop. All `<Link>` and `<NavLink>` elements generate URLs without the `/creator/` prefix (e.g., `/pieces` instead of `/creator/pieces`). Page refresh on any sub-route shows Vite's base URL error. Direct URL navigation fails. **All 5 Wave 2 agents flagged this independently.**
- **Impact:** App only works via client-side navigation from initial load. Any page refresh breaks. Production deployment under `/creator/` path would be completely broken.
- **Fix:** `<BrowserRouter basename="/creator/">` in App.tsx line 30.

### BUG-038: `costume_accessories` migration never applied to Supabase
- **Severity:** Critical
- **Area:** Database
- **Personas:** 1 (Karen), 9 (Sam)
- **Files:** `supabase/migrations/011_expand_costumes.sql` (exists but unapplied)
- **Description:** Migration file defines the `costume_accessories` table but it was never run against the Supabase database. The UI for accessories is fully built (`CostumeFormModal.tsx` lines 210-301) but every attempt to load accessories produces: "Failed to fetch accessories: Could not find the table 'public.costume_accessories' in the schema cache"
- **Fix:** Apply migration 011 to the Supabase project.

## New High Bugs

### BUG-039: Enter key doesn't submit access code
- **Severity:** High
- **Area:** Auth / UX
- **Personas:** 10 (Riley — first impression)
- **Files:** `src/pages/AuthPage.tsx` (lines 96-135)
- **Description:** Access code input is not wrapped in a `<form>` element. Button is `type="button"` not `type="submit"`. Pressing Enter in the input field does nothing. Every user will instinctively press Enter.
- **Fix:** Wrap in `<form onSubmit>` or add `onKeyDown` handler.

### BUG-040: Mobile nav missing 3 pages — no way to reach them
- **Severity:** High
- **Area:** Navigation / Responsive
- **Personas:** 2 (Jaylen on phone), 4 (Marissa on phone), 9 (Sam on phone)
- **Files:** `src/components/layout/AppLayout.tsx` (line 58), `src/components/layout/BottomTabBar.tsx`
- **Description:** Bottom tab bar (visible below 768px) only has 5 items: Home, Pieces, Roster, Seasons, Settings. Competitions, Costumes, and Shows are sidebar-only. The sidebar has `hidden md:flex` and `onToggleSidebar` is a no-op — no hamburger menu exists. Mobile users are completely locked out of 3 feature areas.
- **Fix:** Either add a hamburger menu to open sidebar on mobile, or add the missing items to the bottom tab bar (perhaps behind a "More" tab).

## New Medium Bugs

### BUG-041: `song_sections` table possibly missing from Supabase
- **Severity:** Medium
- **Area:** Database
- **Files:** `src/services/songSections.ts`
- **Description:** GET request to `song_sections` returns 404 from Supabase. Toast error "Failed to load song sections" appears on PieceDetailPage and bleeds to other pages. The Song Sections tab exists in the UI but the backing table may not exist in the database.
- **Fix:** Verify table exists in Supabase; apply migration if missing.

### BUG-042: Dancer form only has 4 fields — missing measurements, contact, notes
- **Severity:** Medium
- **Area:** Roster
- **Personas:** 1 (Karen), 3 (Brenda)
- **Files:** `src/components/roster/DancerFormModal.tsx`
- **Description:** Form only captures: Full Name, Short Name, Birthday, Color. The `Dancer` type defines 15+ additional fields (height, weight, bust, waist, hips, inseam, shoe_size, tights_size, headpiece_size, parent_name, parent_email, parent_phone, notes) that are all unused in the form. Studio owners (Karen) need measurements for costumes and parent contact for communication.
- **Fix:** Add collapsible sections for Measurements and Contact Info to the form.

### BUG-043: Search bar hidden with fewer than 6 dancers
- **Severity:** Medium
- **Area:** Roster / UX
- **Files:** `src/pages/RosterPage.tsx` (line 101)
- **Description:** Search/filter bar only appears when roster has >5 dancers. With 3-5 dancers, there's no way to search. The threshold is arbitrary — search should always be available.
- **Fix:** Always show search bar, or lower threshold to 2.

## Preview-Confirmed Working Features

| Feature | Status | Notes |
|---------|--------|-------|
| Auth / access code | Working | Clean UI, clear purpose |
| Onboarding (2 steps) | Working | Name + styles, 2 clicks to canvas via Quick Start |
| Dashboard | Working | Good empty state, stat cards, "New Piece" CTA |
| Piece creation (Quick Start) | Working | 2 clicks to canvas |
| Piece creation (Full Setup) | Working | Full form with all fields |
| Canvas rendering | Working | Konva stage, auto-scaling, responsive |
| Toolbar (17 buttons) | Working | Complete feature set |
| Formation management | Working | Add/delete/switch, position copying |
| Thumbnail strip | Working | Mini-SVG previews, active indicator |
| Transition controls | Working | Duration slider, easing selector |
| Grid + snap | Working | 3-tier grid, toggleable snap |
| Path drawing | Working | Freehand + control points + undo |
| Zoom | Working | 50-300%, wheel + toolbar |
| Export modal | Working | PNG/PDF/Print options |
| Season CRUD | Working | Cards, form, detail page |
| Season detail | Working | Stats, pieces, competitions, timeline |
| Competition form | Working | 25 companies with auto-fill |
| Entry form | Working | Dynamic dropdowns, auto-category |
| Shows CRUD | Working | Cards, form, drag-and-drop acts |
| Conflict detection | Working | Buffer-based, expandable panel |
| Auto-arrange | Working | Greedy optimization |
| Backstage view | Working | Full-screen, keyboard nav, intermissions |
| Roster CRUD | Working | Add/edit/delete dancers |
| Costume form | Working | Full fields, order status tracking |
| Responsive (desktop) | Working | Sidebar + full content |
| Responsive (iPad) | Working | Same as desktop at 768px+ |
| Responsive (iPhone) | Working | Bottom tab bar, readable text, 44px+ targets |
| Responsive (iPhone SE) | Working | Compressed but usable |

## Preview-Identified UX Friction

1. **Quick Start lands on empty canvas** — 0 dancers, no inline guidance on what to do next
2. **Onboarding step 1 has no skip** — must click "Continue" even with empty fields
3. **No indication name field is optional** — only studio has "Optional" hint
4. **Tier-gated dashboard cards confuse new users** — "0 Dancers" with lock might seem like dancers aren't supported
5. **Bug report FAB overlaps content at 320px** — minor but noticeable on iPhone SE
6. **"Failed to load song sections" toast bleeds to unrelated pages** — distracting

---

*Generated by QA Testing Sweep*
*Wave 1 (Code Review): Agents A-E*
*Wave 2 (Preview Testing): Agents F-J*
