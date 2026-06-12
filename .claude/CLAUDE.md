# Creator — Project Context & Memory

> iPad-first choreography and formation tool for dance teachers and choreographers.
> **Last updated:** 2026-06-12 (overhaul branch `overhaul-2026-06`)

## Quick Start
```bash
cd ~/Code/creator        # NOT iCloud / Documents — moved
npm run dev              # Vite dev server (default port 5173; harness uses 5180)
npm run build            # TypeScript check + Vite build (THE verification gate)
npm run icons            # Regenerate PWA/home-screen icons from scripts/icon-source.svg
npm run cap:build        # Build + sync native iOS assets (Capacitor scaffold parked, web-only for now)
```

## Overhaul 2026-06-12 (branch `overhaul-2026-06`) — what changed
- **Distribution decision: native-feel WEB app** (Safari + Add to Home Screen). No TestFlight/App Store this round; Capacitor scaffold stays untouched. **No service worker, ever** (iOS A2HS doesn't need one; sibling-project SW incident).
- **Auth: beta access code now unlocks the real email/password form.** Anonymous sign-in retired (sessions still honored; `signInAnonymously` kept for them only). Forgot Password + `/reset-password` route (outside AuthGuard) shipped. Manual Supabase dashboard steps required before reset works in prod: Site URL + Redirect URLs + confirm-email OFF.
- **Reliability layer:** `lib/withRetry.ts` wraps all 16 store load paths + auth boot (reads only — never wrap mutations); `lib/supabase.ts` has `fetchWithTimeout` (20s REST / 120s storage) + `noopLock`; `getCurrentUserId()` reads the local session. RootErrorBoundary above the router; Toaster lives in App.tsx (Backstage/Viewer covered).
- **Autosave rewritten** (`useFormationEditor` + `formationStore`): serialized save queue with synchronous snapshots, `editGeneration` guard (mid-save edits never marked clean), echo guard in `savePositions`, flush on visibilitychange/pagehide/unmount AND before the navigation `reset()`, one quiet retry then a single toast, SaveStatusIndicator pill. Undo/redo mark dirty (undone layouts persist). Thumbnail delete X deletes the clicked formation.
- **iOS feel:** viewport-fit=cover, apple metas (status bar `default` — deliberate, keeps top inset 0), dual theme-color synced by `applyTheme()`, early-theme inline script in index.html (**default is DARK**; honors legacy `creator-theme` key), all form controls ≥16px (un-layered CSS guard kills zoom-on-focus), overscroll/tap-highlight suppression, safe-area on Modal/Backstage/Viewer, BottomTabBar slides under the keyboard (`useKeyboardVisible`).
- **PWA:** `public/manifest.webmanifest` (standalone, `/creator/` scope), icons via `scripts/generate-icons.mjs` (sharp; render 1024 → downscale; ivory-flattened, never alpha), InstallPromptCard in Settings.
- **Pinch-zoom + two-finger pan** on FormationCanvas (midpoint-anchored; `Konva.hitOnDragEnabled` global; pinch cancels partial draws, drops in-flight drags in place, swallows stray taps for 350ms).
- **Structure:** PieceDetailPage decomposed → `pieces/PieceDetailHeader|PieceDetailModals|DeletePieceDialog`. The four `display:none` tab wrappers in the page are LOAD-BEARING for canvas state — never convert to conditional rendering. ThumbnailStrip memoized via the handlersRef pattern.
- **Onboarding:** WelcomeFlow step 2 = "Open a sample piece / Start fresh" (`lib/sampleData.ts` — 8 dancers, 3 template formations, a path, 3 music cues; creates NO roster dancers). Also on the empty Dashboard.
- **Copy:** "Music Cues" tab (id `sections` unchanged), no em dashes in user-facing text, tap-not-click.

## Stack
- **Frontend:** React 19, TypeScript ~5.9, Vite 8, Tailwind CSS v4 (CSS-first)
- **State:** Zustand 5 (14 stores wrapping service files)
- **Canvas:** react-konva 19 (formation visualization)
- **Database:** Supabase Postgres (project: `adfqiknbtpzbyxwhrrmc`, org: Dance With Dixon)
- **Auth:** Supabase Auth (email/password)
- **Animations:** Framer Motion 12
- **Icons:** Lucide React
- **Toasts:** Sonner 2
- **PDF Export:** jsPDF 4
- **iOS:** Capacitor 8 (app ID: `com.dancewithdixon.creator`)

## Architecture

### Data Flow
```
Zustand Store → Service File → Supabase (PostgreSQL)
     ↑              ↓
  Components    Real-time listeners (onSnapshot)
```

### Store → Service Map
| Store | Service | Tables |
|-------|---------|--------|
| `pieceStore` | `pieces.ts` | pieces |
| `formationStore` | `formations.ts`, `dancerPositions.ts` | formations, dancer_positions |
| `pathStore` | `dancerPaths.ts` | dancer_paths |
| `rosterStore` | `dancers.ts` | dancers |
| `seasonStore` | `seasons.ts`, `competitions.ts` | seasons, competitions, competition_entries, piece_seasons |
| `costumeStore` | `costumes.ts`, `costumeAccessories.ts`, `props.ts` | costumes, costume_assignments, costume_accessories, props |
| `songSectionStore` | `songSections.ts` | song_sections |
| `audioStore` | `audioStorage.ts` | (Supabase Storage) |
| `authStore` | (Supabase Auth) | — |
| `profileStore` | (localStorage) | — |
| `tierStore` | (localStorage) | user_purchases |
| `playbackStore` | (in-memory) | — |
| `uiStore` | (in-memory) | — |
| `toastStore` | (in-memory) | — |

### RLS Security
All tables scoped by `auth.uid()`. Indirect tables (formations, positions, etc.) resolve ownership via JOINs to pieces.user_id. Migration 012 tightened all policies.

### Entity Hierarchy
```
UserProfile
├── Piece
│   ├── Formation → DancerPosition[], DancerPath[], SongSection[]
│   ├── Costume → CostumeAssignment[], CostumeAccessory[]
│   └── Prop
├── Dancer (global roster)
└── Season
    ├── PieceSeason (junction)
    └── Competition → CompetitionEntry
```

## Design System (as of 2026-03-24)

### Palette
- **Light surfaces:** Warm ivory (#FDFBF7, #F5F0E8, #FFFFFF)
- **Dark surfaces:** Rich charcoal (#171412, #201C19, #2A2521)
- **Text:** Warm charcoal light (#1C1917) / cream dark (#F5F0E8)
- **Default accent:** Rose (#B4838D) — runtime-configurable

### Typography
- **Display:** Cormorant Garamond (headers, page titles, brand)
- **Body:** Inter (all body text, labels, buttons)
- **Code:** SF Mono

### Components (src/components/ui/)
Button, Card, Input, Textarea, Select, Modal, Badge, Spinner, Toggle, TierGate, ToastContainer

### Shared Components (src/components/shared/)
EmptyState, ConfirmDialog, SearchInput

### Design Principles
- 44px minimum touch targets
- Warm, not techy — feels like a dance studio, not a code editor
- No emojis ever in UI
- Card `interactive` prop for hover lift
- Modal bottom-sheet on mobile, centered on desktop
- font-display for all headings

## Pages (11)
| Route | Page | Status |
|-------|------|--------|
| `/` | DashboardPage | Polished |
| `/pieces` | PiecesPage | Polished (search, filter) |
| `/pieces/new` | PieceSetupPage | Polished |
| `/pieces/:id` | PieceDetailPage | Functional (needs decomposition) |
| `/pieces/:id/rehearse` | RehearsalPage | NEW — keyboard nav, notes overlay |
| `/roster` | RosterPage | Polished (search, confirm dialog) |
| `/seasons` | SeasonsPage | Polished (confirm dialog) |
| `/seasons/:id` | SeasonDetailPage | Polished |
| `/costumes` | CostumesPage | Polished |
| `/settings` | SettingsPage | Polished |
| (AuthGuard) | AuthPage + WelcomeFlow | Polished |

## Competitive Landscape

**Creator has NO real competition.** This is the key insight.

| Competitor | Status | Creator's Advantage |
|-----------|--------|-------------------|
| iDanceForms | Web-only, dated, $10-15/mo | Native iPad, modern UI, offline-capable |
| Stage Write | Dormant iPad app | Active development, cloud sync, music |
| PowerPoint/Slides | DIY circles | Purpose-built, transitions, roster, costumes |
| Studio mgmt tools (Jackrabbit, DSP) | Business-only | Creator fills the creative gap they don't touch |

**The creative workflow of choreography has zero purpose-built software.** Most dance teachers use PowerPoint with colored circles or paper whiteboards. Creator is first-to-market for a modern, mobile-first creative IDE for choreographers.

### Killer Feature Opportunities
1. Music timeline with formation cue points (no one has this)
2. Dancer-facing read-only viewer (viral adoption driver)
3. Video + formation overlay (longer-term)
4. Animated formation transitions
5. Offline-first with sync

## Phase Tracker

### Completed
- **Phase 1** (Mar 19): Core tables — pieces, formations, dancers, positions
- **Phase 2** (Mar 19): User profiles, settings, themes
- **Phase 3** (Mar 19-20): Seasons, competitions, costumes, props
- **Phase 4** (Mar 20): Competition company system (15 companies, smart defaults)
- **Phase 5** (Mar 24): Auth, RLS, Capacitor iOS config, song sections, tier gating
- **Design Overhaul** (Mar 24): Warm palette, Cormorant+Inter typography, polished UI components, EmptyState, ConfirmDialog, SearchInput
- **Onboarding** (Mar 24): 2-step welcome flow (name/studio + dance styles)
- **Piece Duplication** (Mar 24): Deep copy of piece + formations + positions
- **Rehearsal Mode** (Mar 24): Full-screen rehearsal view with keyboard nav

### In Progress / Next Up
- **PieceDetailPage Decomposition** — Split monolithic 13-modal page into FormationEditor, AudioSection, PieceNotesSection, PieceRosterSection
- **Dancer-Facing Viewer** — Shareable read-only link for dancers to see their formations
- **iOS Build Pipeline** — Generate Xcode project, app icon, test in simulator

### Future
- Music timeline with formation cue points (wavesurfer.js integration)
- Undo/redo for formations (zundo or zustand-travel)
- Contextual help tooltips
- Video review with formation overlay
- Offline-first strategy
- App Store submission

## Database Migrations (12)
1. Phase 1 core tables
2. User profiles
3. Seasons + competitions
4. Costumes + props
5. Dancer paths
6. Formation transition columns
7. Dancer measurements + contacts
8. User purchases (tier system)
9. Song sections
10. Expand competitions (company config)
11. Expand costumes (vendor, accessories)
12. Tighten RLS (user-scoped everything)

## Decisions Log
- (2026-03-24) Default accent changed from Electric Blue (#3B82F6) to Rose (#B4838D)
- (2026-03-24) Typography: Cormorant Garamond (display) + Inter (body) replaces Plus Jakarta Sans
- (2026-03-24) Competition companies stored as static JSON (not Supabase table) — zero network calls
- (2026-03-24) Onboarding stores completion in localStorage (`creator-onboarding-complete`)
- (2026-03-24) Piece duplication copies formations + positions but NOT audio, costumes, or competition entries
- (2026-03-24) Rehearsal mode is a separate route, not a modal — gives full screen real estate
- (2026-03-20) All 12 Supabase migrations applied. RLS scopes all data to authenticated user.

## Known Issues (refreshed 2026-06-12)
1. Audio timeline not yet synced to formation cue points (music cues exist; playback link is the gap)
2. No offline-first strategy — writes need a connection (autosave now retries + flushes, but no queue-and-sync)
3. No test coverage — `npm run build` + manual checklists are the gates
4. profileStore (name/studio/theme/stage defaults) is localStorage-only; `user_profiles` table exists but unused — matters once teachers use two devices
5. Lead-dancer star meaning is tooltip-only (invisible on iPad) — needs an inline affordance
6. ShowDetailPage (762 lines) / SeasonDetailPage (691) deferred decomposition; modals already extracted
7. Tier/monetization disabled for beta (all features unlocked); `signInAnonymously` kept only for legacy beta sessions — remove once everyone's on email
8. Resolved 2026-06-12: PieceDetailPage decomposition, formation undo persistence, ThumbnailStrip lag, autosave data loss, anonymous-only auth

## File Map
```
src/
├── App.tsx                    # Routes (11)
├── main.tsx                   # Entry
├── index.css                  # Design tokens, Tailwind v4
├── pages/                     # 11 page components
├── components/
│   ├── ui/                    # 11 base components
│   ├── shared/                # EmptyState, ConfirmDialog, SearchInput
│   ├── layout/                # AppLayout, Sidebar, TopBar, BottomTabBar, PageContainer, AuthGuard
│   ├── canvas/                # FormationCanvas, DancerDot, PathLayer, etc.
│   ├── pieces/                # PieceCard, PieceTabs, PieceNotesPanel, etc.
│   ├── audio/                 # AudioPlayer, AudioTimeline, AudioUploader
│   ├── seasons/               # SeasonFormModal, CompetitionFormModal, EntryFormModal
│   ├── costumes/              # CostumeFormModal, PropFormModal, AssignDancersModal
│   ├── roster/                # DancerCard, DancerFormModal
│   ├── onboarding/            # WelcomeFlow
│   ├── branding/              # CreatorLogo
│   └── export/                # ExportModal, PrintView
├── stores/                    # 14 Zustand stores
├── services/                  # 14 Supabase CRUD services
├── hooks/                     # usePlayback, useAudioPlayer
├── lib/                       # utils, motion, supabase, export helpers
├── types/                     # index.ts (all types + enums)
└── data/                      # competitionCompanies.ts (static reference)
```
