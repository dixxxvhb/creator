import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInAnonymously: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isInitialized: false,

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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        user: session?.user ?? null,
        isLoading: false,
        isInitialized: true,
      });
    }).catch(() => {
      set({
        isLoading: false,
        isInitialized: true,
      });
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          isLoading: false,
        });
      }
    );

    // Cleanup on unmount isn't needed for a singleton store,
    // but store the subscription reference if needed later
    return subscription;
  },
}));
