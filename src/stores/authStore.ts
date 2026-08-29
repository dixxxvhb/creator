import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { withRetry } from '@/lib/withRetry';
import { DEV_AUTOLOGIN, DEV_ACCOUNT } from '@/lib/beta';
import type { User, Session } from '@supabase/supabase-js';

// Dev-only: provision (once) and sign in a throwaway account so `npm run dev`
// drops straight into the app without the access code / login. import.meta.env.DEV
// is false in production, so every caller is tree-shaken out of prod builds.
async function devAutoLogin(): Promise<Session | null> {
  const { email, password } = DEV_ACCOUNT;
  let res = await supabase.auth.signInWithPassword({ email, password });
  if (res.error) {
    // First run against this project — create the dev user. Beta has email
    // confirmation off, so sign-up returns a usable session immediately.
    await supabase.auth.signUp({ email, password });
    res = await supabase.auth.signInWithPassword({ email, password });
  }
  return res.data.session ?? null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  initError: string | null;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInAnonymously: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  initialize: () => void;
}

// The auth listener must be bound exactly once for the app's lifetime.
// initialize() is re-callable (StrictMode double-fires the mount effect, and
// the AuthGuard reconnect card re-invokes it), so guard at module level.
let authListenerBound = false;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isInitialized: false,
  initError: null,

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    // If email confirmation is enabled, auto-sign-in immediately
    if (data.user && !data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        return { error: 'Account created but confirmation may be required. Try logging in.' };
      }
    }
    return { error: null };
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  },

  signInAnonymously: async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) return { error: error.message };
    return { error: null };
  },

  resetPassword: async (email) => {
    // BASE_URL is '/creator/' in dev and prod, so this resolves to the
    // /reset-password route on whichever origin is running.
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) return { error: error.message };
    return { error: null };
  },

  updatePassword: async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
    return { error: null };
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Sign out failed — clear local state anyway
    }
    set({ user: null, session: null });
  },

  initialize: () => {
    set({ initError: null, isLoading: true });

    // Get initial session, retrying transient network failures (flaky Wi-Fi
    // at launch should not strand a logged-in teacher on the login page).
    withRetry(() => supabase.auth.getSession())
      .then(async ({ data: { session } }) => {
        // Dev-only login bypass (stripped from prod builds).
        if (!session && import.meta.env.DEV && DEV_AUTOLOGIN) {
          try {
            session = await devAutoLogin();
          } catch {
            // Dev login failed — fall through to the normal login page.
          }
        }
        set({
          session,
          user: session?.user ?? null,
          isLoading: false,
          isInitialized: true,
        });
      })
      .catch((e: unknown) => {
        set({
          isLoading: false,
          isInitialized: true,
          initError: e instanceof Error ? e.message : 'Could not reach the server',
        });
      });

    // Listen for auth changes — bound once for the app's lifetime.
    if (!authListenerBound) {
      authListenerBound = true;
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          isLoading: false,
        });
      });
    }
  },
}));
