# Personal Assistant App Brief

## Working concept
Build a deeply personal PWA that feels like a best friend, executive-function coach, and daily operator in one.

It should be:
- Supportive, smart, a little sassy, and emotionally aware
- Designed for an ADHD brain: low friction, low shame, clear next steps, fast capture
- Helpful with medication tracking, reminders, grief support, therapy reflection, and task completion
- Adaptive over time as it learns routines, blockers, preferences, and what actually helps
- Privacy-conscious, explicit about memory, and careful around medical and mental-health boundaries

## Best product framing
This should not be a generic chatbot with extra tabs.

The best version is:
- A daily command center
- A context-aware assistant
- A reminder engine
- A memory system
- A gentle accountability partner

Think: "today, what do I need, what am I avoiding, what will help me move, what should I not forget, and how can this app make the next 10 minutes easier?"

## Product pillars
1. Reduce friction, not add chores
2. Support without guilt
3. Be useful before being impressive
4. Make memory explicit and editable
5. Stay warm and human without pretending to be a therapist or doctor

## Recommended stack
Recommended default:
- `React` + `Vite` + `TypeScript`
- `Firebase Hosting`
- `Firebase Authentication`
- `Cloud Firestore`
- `Cloud Functions` 2nd gen
- `Firebase Cloud Messaging` for push
- `Firebase App Check` with `reCAPTCHA Enterprise`
- `Firebase Storage` for voice notes, attachments, and exports
- `Genkit` for a provider-agnostic AI orchestration layer
- `GitHub` for source control and deployment workflow

Why this stack:
- Firebase Hosting is optimized for static and single-page web apps, which fits a phone-first PWA well.
- Firebase Hosting pairs cleanly with Cloud Functions for dynamic APIs, reminders, and AI orchestration.
- Firebase Cloud Messaging supports web push, and Firebase documents separate foreground and background message handling for web apps.
- Firestore gives realtime sync and offline support, which matters for a phone-first personal tool.
- Genkit is a good fit if you want AI features but do not want to hardwire the whole product to one model vendor on day one.
- This app does not need SSR on day one, so using Firebase Hosting avoids the extra cost and complexity of App Hosting.

## Hosting choice
Use `Firebase Hosting`, not `GitHub Pages`, for the actual app.

Reasons:
- GitHub Pages is a static hosting product and is a poor fit for a sensitive app with authenticated data, AI features, and server-side reminder logic.
- Firebase Hosting gives you CDN-backed hosting while letting you pair the app with Cloud Functions for APIs and orchestration.
- GitHub should still be used for version control and deployment automation, but not as the primary runtime platform for this product.

## Hard constraints to design around
1. iPhone push for a PWA is real, but only after the app is added to the Home Screen and the user grants permission from a direct interaction.
2. Reminder delivery should be server-driven, not dependent on client timers.
3. Firestore web offline persistence should be opt-in only on trusted devices because cached data persists across sessions.
4. A pure PWA should not assume direct Apple Health integration. Treat Apple Health as a later native-wrapper feature or a manual import/export path.
5. The app should never give medication dosing advice, diagnose, or act like crisis care.
6. This is a one-user app for the owner only, not a general multi-user product.
7. Journals, therapy notes, grief entries, and similar content are AI-readable by design on the server side. They are not end-to-end encrypted from the app's own backend.
8. Medication reminders should be treated as helpful consumer reminders, not as a guaranteed medical device or clinical alerting system.

## Core experience map

### 1. Today screen
The home screen should answer:
- What matters today?
- What am I likely to forget?
- What is the smallest useful next step?
- What do I need right now: structure, comfort, urgency, or rest?

Suggested blocks:
- Morning brief
- Meds due now / next
- Top 3 priorities
- Calendar snapshot
- Rescue mode button
- Mood / grief / energy check-in
- One contextual nudge from the assistant

### 2. Medication companion
Should include:
- Medication list with schedule
- "Taken", "skip", "snooze", and "remind again"
- Missed-med tracking
- Refill countdown
- Side-effect and symptom notes
- Optional adherence streaks that feel encouraging, not punishing

Should not include:
- Dosing changes
- Medical recommendations
- Advice that overrides doctor instructions

Important product rule:
- The app can help track, remind, and log.
- The app cannot recommend dose changes, timing overrides, or clinical action beyond generic "contact your clinician / pharmacy / emergency services" safety routing.

### 3. ADHD task engine
Should include:
- Brain-dump inbox
- "Make this smaller" button
- "Start with me" body-double timer
- Focus sprint / reset / rescue mode
- Adaptive reminders that escalate in tone only with permission
- Fast wins and visible progress

### 4. Therapy and grief support
Should include:
- Journal and reflection space
- Therapy prep and post-session notes
- Grief check-ins
- Comfort kit: grounding prompts, rituals, voice notes, memory vault
- "What do you need right now?" mode
- Trusted-contact and crisis-resource surface

Should not include:
- Claims of therapy
- High-confidence mental-health conclusions
- Manipulative tough-love behavior

## Safety behavior
The assistant must hard-switch into a safety-first mode for content about:
- self-harm
- suicide
- overdose
- immediate danger
- severe panic or loss of control
- medical emergency concerns

In safety-first mode:
- no sass
- no playful tone
- no speculative advice
- no "coachy" escalation
- provide short grounding support if appropriate
- direct the user to emergency or crisis resources
- encourage contacting a trusted person when relevant
- avoid storing a flashy "insight" derived from the crisis message

### 5. Personal memory and insight layer
The assistant should remember:
- Stable preferences
- Tone and accountability preferences
- Medication schedule and habits
- Recurring tasks and routines
- Active projects
- Patterns: what helps, what stalls you, what times of day work best

The user should always be able to:
- Inspect memory
- Edit memory
- Delete memory
- Ask "why are you suggesting this?"

## Recommended tone system
Create explicit modes instead of one fixed personality:
- `soft`: calm, warm, low-pressure
- `sassy`: witty, clever, energizing
- `firm`: direct, structured, no spiraling
- `grief-gentle`: slower, more spacious, tender

Rules:
- Never shame
- Never mock vulnerability
- Ask consent before increasing intensity
- Keep humor supportive, never mean

## Best V1 scope
Do not try to build the full life-operating-system on day one.

V1 should include:
- Auth
- Onboarding
- Today dashboard
- Medication tracking
- Tasks and routines
- Mood / grief / energy check-in
- Journal / therapy notes
- Push notifications
- Assistant chat with bounded memory and clear safety rules
- Device registration
- Settings and memory controls

V1.1 can add:
- Google Calendar integration
- Weather
- richer daily brief generation

V1 should not include yet:
- Apple Health
- Complex clinician workflows
- Multi-user sharing
- Full email ingestion
- Overly autonomous agents
- Deep GitHub product integration

## Good V2 additions
- Gmail or inbox summary
- Todoist or Google Tasks sync
- Oura or Fitbit signals
- More advanced routine coaching
- Voice capture
- AI-generated daily recap
- Refill automation helpers
- Location-aware reminders

## Suggested integrations
Highest priority:
- GitHub for source control and deployment workflow
- Google Calendar
- Weather

Strong second wave:
- Google Tasks or Todoist
- Oura or Fitbit
- Spotify or Apple Music for focus / comfort rituals

Important GitHub note:
- In this project, "GitHub" primarily means repository hosting, version control, and automated deployment workflow.
- Do not treat GitHub as a required in-app user-facing integration in V1.
- If login is needed, prefer a simpler auth method that fits a single-owner app better than a broad GitHub OAuth flow.

## Recommended architecture

### Frontend
- Phone-first responsive UI
- Installable PWA
- Service worker for caching and push handling
- Big tap targets, high contrast, low clutter
- One obvious primary action per screen
- Static-first SPA deployed to Firebase Hosting
- No SSR requirement in V1

### Backend
- Firestore for structured app data
- Cloud Functions for:
  - reminder scheduling
  - notification fanout
  - integration sync jobs
  - AI orchestration
  - daily brief generation
- Scheduled functions for recurring jobs

### AI layer
Use Genkit or another server-side orchestration layer so the assistant can:
- assemble context from Firestore and integrations
- switch or compare model providers later
- enforce safety and formatting rules
- keep prompts and keys off the client

## Suggested Firestore structure
Use owner-scoped data, not a flat multi-tenant schema.

Recommended shape:
- `users/{uid}`
- `users/{uid}/settings/{doc}`
- `users/{uid}/tasks/{taskId}`
- `users/{uid}/routines/{routineId}`
- `users/{uid}/medications/{medId}`
- `users/{uid}/med_logs/{logId}`
- `users/{uid}/journal_entries/{entryId}`
- `users/{uid}/therapy_notes/{noteId}`
- `users/{uid}/checkins/{checkinId}`
- `users/{uid}/memories/{memoryId}`
- `users/{uid}/insights/{insightId}`
- `users/{uid}/assistant_threads/{threadId}`
- `users/{uid}/assistant_threads/{threadId}/messages/{messageId}`
- `users/{uid}/devices/{deviceId}`
- `users/{uid}/notification_jobs/{jobId}`
- `users/{uid}/daily_briefs/{briefId}`
- `users/{uid}/integrations/{integrationId}`
- `users/{uid}/audit_events/{eventId}`

Single-user rule:
- the system is architected for one owner account
- data should still be scoped by `uid`
- Firebase rules should allow only the owner account

## Security and trust requirements
- Use Firebase Auth for identity
- Use Firestore Security Rules aggressively
- Use App Check for web clients
- Gate offline persistence behind a trusted-device choice
- Make onboarding disclosure explicit that sensitive notes are readable by server-side AI by design
- Do not claim end-to-end encryption
- Keep raw sensitive content out of logs, traces, and analytics
- Redact prompt payloads and model responses in operational logging wherever possible
- Store only the minimum derived memory needed for the product to be useful
- Every memory record should track source, timestamp, and whether it came from explicit user input or model inference
- Give the owner the ability to review, edit, and delete all persistent memory
- Add export and delete-my-data flows early
- Keep an auditable log of assistant-generated reminders and summaries
- Add a short retention policy for derived insights and temporary AI working memory

## Auth model
This is a one-user app.

Recommended V1 auth approach:
- one owner account only
- allowlist the owner's email or UID
- block all non-owner sign-ins in backend rules and app logic
- do not build sign-up, invitations, teams, or sharing

## Notification strategy
Use this shape:
- FCM token registration per device
- Service worker handles background notifications
- One scheduled Cloud Function runs on a frequent interval and scans for due reminder jobs
- Reminder jobs are stored in Firestore with idempotency fields so notifications are not duplicated
- Cloud Functions send reminders, mark delivery attempts, and schedule the next occurrence
- Scheduled functions also generate daily briefing notifications and refill nudges
- Notifications should support snooze, open-app action, and contextual deep links

Notification philosophy:
- helpful, not naggy
- adaptive cadence
- fewer but better reminders
- support "rescue mode" bursts only when requested
- respect quiet hours
- respect timezone changes
- clearly communicate that delivery can be affected by device settings, Focus modes, connectivity, and browser behavior

Reminder reliability rules:
- never rely on client-side timers for due reminders
- use server-side time as source of truth
- make sends idempotent
- track `scheduled_at`, `due_at`, `sent_at`, `acknowledged_at`, and `next_due_at`
- support snooze without creating duplicate active jobs

## Design direction
Avoid making this feel like a hospital portal or corporate productivity dashboard.

Better direction:
- emotionally warm
- playful but mature
- high legibility
- calm visual rhythm
- strong hierarchy
- subtle delight

UX rules for ADHD:
- reduce decisions
- break actions into one next step
- keep forms short
- preserve drafts automatically
- let the app rescue unfinished flows

## Biggest risks
1. Overbuilding the AI before the daily utility is solid
2. Making reminders noisy instead of trustworthy
3. Treating therapy/grief like a content feature instead of a safety-sensitive area
4. Stuffing too many integrations into V1
5. Creating creepy hidden memory instead of user-visible memory

## Opinionated recommendation
Start with a standalone new app in a new folder, not inside the current product codebase.

Suggested folder:
- `personal-assistant-pwa`

That keeps this project clean, focused, and easier for Claude Code to scaffold safely.

## Delivery recommendation
Use:
- `Firebase Hosting` for the frontend
- `Cloud Functions` for APIs, reminders, AI orchestration, and integration sync
- `GitHub` for the repo and automated deploy workflow

Avoid for V1:
- GitHub Pages as the production host
- Firebase App Hosting
- SSR unless a later product need clearly justifies it

---

## Claude Code Prompt 1: Product Spec + Architecture

```text
You are building a new project called `personal-assistant-pwa` in a new folder. Do not modify any existing app in this repository unless explicitly told to.

I want you to act as a senior product engineer and architect first, not just a coder.

Build a product spec and technical implementation plan for a highly personal PWA that feels like a best friend + executive-function coach + personal assistant for one user.

Core product goals:
- Help me run my day
- Help me remember and complete tasks
- Help me track medications
- Help me process therapy and grief gently
- Feel designed for an ADHD brain
- Be supportive, helpful, smart, and a little sassy
- Be adaptive over time
- Connect to outside services to build helpful context about me
- Use Firebase and a GitHub-based deployment workflow
- Work as a PWA with mobile notifications

Non-negotiable product principles:
- Reduce friction, not add chores
- No guilt, no shame
- Never pretend to be a doctor or therapist
- Never give medication dosing advice
- Memory must be inspectable, editable, and deletable
- Use explicit tone modes like soft, sassy, firm, and grief-gentle
- Phone-first design
- Notifications should feel helpful, not harassing

Technical preferences:
- React + Vite + TypeScript
- Firebase Hosting
- Firebase Auth
- Firestore
- Cloud Functions 2nd gen
- Firebase Cloud Messaging
- Firebase App Check
- Firebase Storage
- A server-side AI orchestration layer such as Genkit

Important constraints:
- iPhone PWA notifications require Home Screen install and opt-in
- Reminder delivery should be server-driven
- Apple Health should not be assumed in a pure PWA
- Sensitive offline persistence must be handled carefully
- This is a one-user owner-only app
- Sensitive notes are AI-readable by design on the server side
- Do not design this as a generic multi-user SaaS product

Your tasks:
1. Create a concise product spec.
2. Propose the route map and main screens.
3. Define the Firestore data model.
4. Define Firebase security requirements.
5. Propose the integration strategy for Google Calendar, GitHub, and future adapters.
   GitHub here primarily means repo/deployment workflow, not a deep in-app integration requirement.
6. Define the notification architecture.
7. Define the AI memory model and safety guardrails.
8. Define a phased roadmap: V1, V2, later.
9. List open risks and assumptions.

Create these docs:
- `personal-assistant-pwa/docs/product-spec.md`
- `personal-assistant-pwa/docs/architecture.md`
- `personal-assistant-pwa/docs/data-model.md`
- `personal-assistant-pwa/docs/integrations.md`
- `personal-assistant-pwa/docs/roadmap.md`

Do not start implementing the full app yet beyond minimal scaffolding if needed for structure. Think clearly, make decisions, and write with strong product taste.
```

## Claude Code Prompt 2: Build the V1 foundation

```text
Use the docs in `personal-assistant-pwa/docs` as the source of truth and build V1 of the app.

Project requirements:
- Create a new React + Vite + TypeScript app in `personal-assistant-pwa`
- Make it a real installable PWA
- Configure Firebase Hosting deployment
- Use Firebase Auth, Firestore, Cloud Functions, Storage, App Check, and Cloud Messaging
- Keep secrets out of the client
- Build for exactly one owner account first, while still keeping the data model and code organized

V1 feature scope:
- onboarding
- Today dashboard
- medication list and medication log
- tasks and routines
- mood / grief / energy check-in
- therapy notes / journal
- assistant chat
- settings
- notification permissions and device registration

V1.1 scope:
- Google Calendar integration
- weather-aware daily context

Design requirements:
- phone-first
- emotionally warm, not corporate
- ADHD-friendly
- one strong primary action per screen
- fast add flows
- supportive, sassy, smart tone
- high readability

Implementation requirements:
- create a clean route structure
- create reusable UI primitives
- create Firestore schema helpers and typed domain models
- create Firebase Security Rules
- create Cloud Functions for reminder scheduling, notification sending, and daily brief generation
- create a service worker for push handling
- create adapter interfaces for future integrations so Google Calendar and other external services are not hardcoded everywhere
- add empty states, loading states, and failure states
- document all setup steps

Safety requirements:
- no medication advice
- no diagnosis language
- clear crisis / support disclaimer surfaces
- visible memory settings
- ability to review and delete stored personal memory
- explicit disclosure that journal and therapy content can be read by server-side AI features
- no raw sensitive text in logs
- crisis mode must disable sass and switch to safety-first language

At the end:
- summarize architecture
- summarize what is implemented
- list what still needs credentials or manual console setup
- list the exact files changed
```

## Claude Code Prompt 3: Build the assistant personality and memory layer

```text
Extend `personal-assistant-pwa` with a strong but safe assistant layer.

I want the assistant to feel like:
- supportive
- smart
- funny in a sharp but loving way
- emotionally aware
- good at getting me unstuck

I do not want:
- shame
- fake therapy language
- manipulative urgency
- overconfident medical advice

Build:
1. tone profiles: soft, sassy, firm, grief-gentle
2. a memory model split into:
   - stable profile
   - routines and preferences
   - current day context
   - active projects
   - helpful patterns and insights
3. a "why am I seeing this?" explanation path for assistant suggestions
4. memory review, edit, and delete UI
5. daily brief generation using calendar, tasks, meds, and recent check-ins
6. rescue mode suggestions for overwhelm moments
7. post-therapy reflection prompts
8. grief support prompts that stay gentle and bounded

Technical constraints:
- run orchestration server-side
- use structured outputs where possible
- keep prompts versioned in code
- log only redacted assistant execution metadata needed for debugging
- keep model-provider wiring swappable
- distinguish user-stated memory from model-inferred memory
- require source metadata and timestamps on persisted memory

At the end:
- explain the memory architecture
- explain the safety guardrails
- explain how the assistant tone system works
- list remaining gaps
```

---

## Research notes and source links
- Firebase Hosting overview: https://firebase.google.com/docs/hosting
- Firebase Hosting with Cloud Functions: https://firebase.google.com/docs/hosting/functions
- Firebase Cloud Messaging for web receive/background behavior: https://firebase.google.com/docs/cloud-messaging/web/receive-messages
- Firestore offline persistence caveats: https://firebase.google.com/docs/firestore/manage-data/enable-offline
- Firebase App Check overview: https://firebase.google.com/docs/app-check
- Firebase App Check web guidance for new integrations: https://firebase.google.com/docs/app-check/web/recaptcha-provider
- Firebase scheduled functions: https://firebase.google.com/docs/functions/schedule-functions
- Firebase pricing plans: https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- GitHub Pages overview: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- GitHub Pages limits: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- Web Push on iOS Home Screen web apps: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- PWA install behavior and expectations: https://web.dev/learn/pwa/installation
- Genkit overview: https://genkit.dev/
