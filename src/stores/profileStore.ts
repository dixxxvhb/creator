import { create } from 'zustand';
import type { UserProfile } from '@/types';

const STORAGE_KEY = 'creator-profile';
const THEME_KEY = 'creator-theme'; // legacy key, migrate from it

const DEFAULT_PROFILE: UserProfile = {
  displayName: '',
  studioName: '',
  accentColor: '#B4838D',
  themePreference: 'dark',
  customGreeting: '',
  studioLogoUrl: null,
  avatarUrl: null,
  defaultStageWidth: 1000,
  defaultStageDepth: 600,
  toolbarAdvanced: false,
};

function loadProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
    // Migrate legacy theme preference
    const legacyTheme = localStorage.getItem(THEME_KEY);
    if (legacyTheme === 'dark' || legacyTheme === 'light') {
      return { ...DEFAULT_PROFILE, themePreference: legacyTheme };
    }
    return DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

function saveProfile(profile: UserProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

/** Darken a hex color by a percentage (0-1) */
function darkenHex(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Convert hex to rgba */
function hexToRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgb(hex: string): string {
  const num = parseInt(hex.replace('#', ''), 16);
  return `${(num >> 16) & 0xff}, ${(num >> 8) & 0xff}, ${num & 0xff}`;
}

function applyAccentColor(hex: string) {
  const root = document.documentElement;
  root.style.setProperty('--color-accent', hex);
  root.style.setProperty('--color-accent-hover', darkenHex(hex, 0.15));
  root.style.setProperty('--color-accent-light', hexToRgba(hex, 0.1));
  root.style.setProperty('--accent-rgb', hexToRgb(hex));
}

function applyTheme(pref: 'light' | 'dark' | 'system') {
  const root = document.documentElement;
  let isDark = false;
  if (pref === 'dark') {
    isDark = true;
  } else if (pref === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  root.classList.toggle('dark', isDark);
  // Remove legacy 'light' class if present
  root.classList.remove('light');

  // Keep the iOS status bar / browser chrome tint in sync. The theme is
  // user-overridable, so the static media-scoped metas in index.html can
  // disagree with html.dark — overwrite both with the active surface color.
  const themeColor = isDark ? '#171412' : '#FDFBF7';
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.setAttribute('content', themeColor);
  });
}

// initProfile runs on every AppLayout mount (twice under StrictMode) — the
// system-theme listener must attach exactly once for the app's lifetime.
let systemThemeListenerAttached = false;

interface ProfileState extends UserProfile {
  setAccentColor: (hex: string) => void;
  setTheme: (pref: 'light' | 'dark' | 'system') => void;
  setStudioName: (name: string) => void;
  setDisplayName: (name: string) => void;
  setCustomGreeting: (greeting: string) => void;
  setDefaultStageWidth: (w: number) => void;
  setDefaultStageDepth: (d: number) => void;
  setToolbarAdvanced: (v: boolean) => void;
  initProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => {
  const initial = loadProfile();

  return {
    ...initial,

    setAccentColor: (hex: string) => {
      applyAccentColor(hex);
      set({ accentColor: hex });
      saveProfile({ ...get(), accentColor: hex });
    },

    setTheme: (pref: 'light' | 'dark' | 'system') => {
      applyTheme(pref);
      set({ themePreference: pref });
      saveProfile({ ...get(), themePreference: pref });
    },

    setStudioName: (name: string) => {
      set({ studioName: name });
      saveProfile({ ...get(), studioName: name });
    },

    setDisplayName: (name: string) => {
      set({ displayName: name });
      saveProfile({ ...get(), displayName: name });
    },

    setCustomGreeting: (greeting: string) => {
      set({ customGreeting: greeting });
      saveProfile({ ...get(), customGreeting: greeting });
    },

    setDefaultStageWidth: (w: number) => {
      set({ defaultStageWidth: w });
      saveProfile({ ...get(), defaultStageWidth: w });
    },

    setDefaultStageDepth: (d: number) => {
      set({ defaultStageDepth: d });
      saveProfile({ ...get(), defaultStageDepth: d });
    },

    setToolbarAdvanced: (v: boolean) => {
      set({ toolbarAdvanced: v });
      saveProfile({ ...get(), toolbarAdvanced: v });
    },

    initProfile: () => {
      const profile = loadProfile();
      applyAccentColor(profile.accentColor);
      applyTheme(profile.themePreference);
      set(profile);

      // Listen for system theme changes. Attached unconditionally (the
      // handler checks the preference at fire time) so switching to System
      // later still tracks the OS — and only once, to avoid accumulating
      // listeners across re-mounts.
      if (!systemThemeListenerAttached) {
        systemThemeListenerAttached = true;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        mq.addEventListener('change', () => {
          if (get().themePreference === 'system') {
            applyTheme('system');
          }
        });
      }
    },
  };
});
