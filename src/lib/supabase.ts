import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (import.meta.env.DEV && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('Missing Supabase environment variables. Check .env.local');
}

// Bound EVERY Supabase request. Browsers never time out `fetch`, so a stalled
// REST query or auth token-refresh would otherwise hang forever with no way
// for the UI to recover (a save button spinning indefinitely on studio Wi-Fi).
// Aborting is SAFE here: navigator.locks is noop'd (see below), and
// supabase-js maps an aborted fetch to a *retryable* error — it never tears
// down the session, so a timeout can't strand the user logged out.
// Storage gets a much longer budget: a multi-MB audio upload on slow Wi-Fi
// legitimately exceeds the REST budget.
const REST_TIMEOUT_MS = 20_000;
const STORAGE_TIMEOUT_MS = 120_000;

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const timeoutMs = url.includes('/storage/v1/') ? STORAGE_TIMEOUT_MS : REST_TIMEOUT_MS;

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new DOMException('Request timed out', 'TimeoutError')),
    timeoutMs,
  );
  // Preserve any caller-provided signal — abort our controller if theirs
  // fires, so both the caller's intent and our timeout win.
  const callerSignal = init?.signal;
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort(callerSignal.reason);
    else callerSignal.addEventListener('abort', () => controller.abort(callerSignal.reason), { once: true });
  }
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

// supabase-js's default navigatorLock acquires lock:sb-<ref>-auth-token on the
// navigator LockManager. If the underlying getSession() fetch ever aborts, the
// lock can stay held on the origin's LockManager — refreshing, opening new
// tabs, nothing recovers short of quitting the browser. Creator is a
// single-user, effectively single-tab app, so cross-tab token-refresh
// coordination isn't load-bearing. Pass a no-op so supabase-js never touches
// navigator.locks at all.
const noopLock = async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => fn();

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  global: { fetch: fetchWithTimeout },
  auth: { lock: noopLock },
});

// Reads the LOCAL session instead of auth.getUser() — getUser() is a network
// round-trip that used to precede every create call, doubling its failure
// surface. RLS enforces identity server-side regardless, so the local session
// is sufficient here.
export async function getCurrentUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');
  return session.user.id;
}
