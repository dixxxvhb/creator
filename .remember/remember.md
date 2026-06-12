# Handoff

## State
Share viewer flow hardened and shipped. Commit `f96a0ed` on `main`, GH Pages deploy 24703648630 succeeded. Migration 019 (`supabase/migrations/019_public_share_payload.sql`) applied to Supabase `adfqiknbtpzbyxwhrrmc`. Function `get_shared_piece_payload(text)` is SECURITY DEFINER, owner=postgres, search_path=public, grants on anon+authenticated. Payload whitelisted — no owner `user_id`/timestamps leak. End-to-end anon RPC smoke test passed.

## Next
1. If a real DWD-branded public origin replaces `dixxxvhb.github.io/creator/`, set `VITE_PUBLIC_APP_URL` in whatever host env the viewer uses and update the hardcoded fallback in `src/services/pieceShares.ts:4`.
2. Consider rate-limiting `get_shared_piece_payload` (pg_cron + throttle table, or Supabase edge rate limit) if share tokens ever leak publicly — currently unbounded.

## Context
- `piece_shares` table was empty when I shipped, so zero user-facing breakage window despite Codex's frontend going live before the migration.
- Old policy `"Anyone can read shares by token"` is permanently gone; only `"Users can CRUD shares of own pieces"` remains on `piece_shares`. Any future anon read must go through the RPC.
- `getShareByToken` was deleted (dead code). If you see callers in branches, they're stale.
- Preexisting Supabase advisor warnings (anonymous RLS, a few mutable search_paths on `handle_updated_at` etc.) are NOT from this change — they were already there.
