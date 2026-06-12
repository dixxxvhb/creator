import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { withRetry } from '@/lib/withRetry';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  initError: string | null;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInAnonymously: () => Promise<{ error: string | null }>;
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
      .then(({ data: { session } }) => {
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
