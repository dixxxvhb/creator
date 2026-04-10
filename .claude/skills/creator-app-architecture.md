---
name: creator-app-architecture
description: Enforce choreography studio creator app architecture and tech decisions. Apply to all development work in this project.
---

# Choreography Studio Creator App Architecture

## Stack (do not deviate without discussion)
- React + Vite
- react-konva (canvas rendering)
- Zustand (state management)
- Supabase (backend)
- Targeting iOS App Store via Capacitor
- Three-tier pricing: Free (1-2 dances), Mid (unlimited dances), Premium/Studio (full features incl. season management and costumes)

## Key Decisions
- Supabase is the backend — not Firebase (that's Figgg)
- react-konva handles all stage/formation visualization
- Zustand for state — not Redux, not React context for complex state
- Capacitor wraps for native iOS — keep web-first but test in Capacitor regularly
- Marketing via dedicated Instagram account

## What This App Does
A visual tool for choreographers to design stage formations, block scenes, plan transitions, and manage dance pieces. Think of it like a digital stage blueprint tool.
