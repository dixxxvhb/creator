# Dixon Command Center

Personal single-page dashboard for Dixon Van Hoozer-Bowles in Orlando, FL.

Live deploy: https://dixxxvhb.github.io/creator/

## Why GitHub Pages

I picked GitHub Pages because this dashboard is a static app with no server runtime, no private build step, and no API-key requirement. Netlify and Vercel are also good free hosts, but they usually require an authenticated CLI/project setup step. GitHub Pages can publish the static folder directly from the existing GitHub account and repo with the least moving parts.

## Setup

Open `index.html` locally or serve the folder with any static server.

```bash
cd command-center
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Config

All configurable data lives in `config.js` at the project root:

- Owner/location
- Orlando weather coordinates
- DWD ProSeries milestone dates
- Default quick-launch cards
- Instagram account handles
- Social placeholders
- RSS feed URLs
- Comments for future Google Calendar, Instagram, X, and TikTok keys

## What Works Without Keys

- Live time, date, greeting, and Orlando label
- Open-Meteo current weather, high/low, and 5-day forecast
- Daily Log saved privately in browser localStorage
- Local schedule for today and the next 2 days, with add/edit/delete
- DWD ProSeries day counters
- Editable quick-launch cards, including Sunbiz marked OVERDUE
- Scratchpad with local autosave
- Configurable 25/5 focus timer
- Per-widget collapse/expand
- Drag-to-rearrange widgets
- Brand palette theme picker and light mode
- News via public RSS feeds through a CORS proxy, with source-link fallback
- Instagram profile cards with deep links
- X and TikTok placeholder cards

## What Needs Keys Later

- Google Calendar sync needs Google Cloud OAuth credentials and Calendar API access.
- Instagram live media requires Meta app review and Instagram Graph or Basic Display API access. I checked the practical browser options: Instagram profile iframes are blocked, oEmbed requires access-token support, and unofficial RSS mirrors add a paid or fragile dependency. The shipped fallback is profile cards with direct links.
- X and TikTok live cards need official API/OAuth access or a serverless proxy.

## Judgment Calls

- Used vanilla HTML/CSS/JS to keep load time fast and deployment simple.
- Chose GitHub Pages over Netlify/Vercel for static hosting with the lowest authentication friction.
- Built localStorage-backed schedule instead of pretending Google Calendar is connected.
- Used Open-Meteo because it is keyless and reliable for Orlando weather.
- Used RSS feeds for news to avoid NewsAPI key friction. The app filters for items published in the last 24 hours and falls back to source links if feeds or CORS are unavailable.
- Kept the Instagram section honest: attempted web-embeddable feed paths are locked or brittle without API access, so the shipped experience is clean profile cards.
- Included the P2 controls because they were small enough to add after P0/P1: widget collapse, drag order, and a brand theme picker.

## Cut

Nothing from the requested P0/P1 list was intentionally cut. The only functional downgrade is Instagram live posts, because public live feed access is locked behind API approval or third-party services.
