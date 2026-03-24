import { create } from 'zustand';
import type { UserProfile } from '@/types';

const STORAGE_KEY = 'creator-profile';
const THEME_KEY = 'creator-theme'; // legacy key, migrate from it

const DEFAULT_PROFILE: UserProfile = {
  displayName: '',
  studioName: '',
  accentColor: '#3B82F6',
  themePreference: 'dark',
  customGreeting: '',
  studioLogoUrl: null,
  avatarUrl: null,
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
}

interface ProfileState extends UserProfile {
  setAccentColor: (hex: string) => void;
  setTheme: (pref: 'light' | 'dark' | 'system') => void;
  setStudioName: (name: string) => void;
  setDisplayName: (name: string) => void;
  setCustomGreeting: (greeting: string) => void;
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

    initProfile: () => {
      const profile = loadProfile();
      applyAccentColor(profile.accentColor);
      applyTheme(profile.themePreference);
      set(profile);

      // Listen for system theme changes
      if (profile.themePreference === 'system') {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
          if (get().themePreference === 'system') {
            applyTheme('system');
          }
        };
        mq.addEventListener('change', handler);
      }
    },
  };
});
