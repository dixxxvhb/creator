import { create } from 'zustand';
import type { Tier, TierFeature } from '@/types';
import { TIER_FEATURES } from '@/types';
import { BETA_ENABLED } from '@/lib/beta';

const STORAGE_KEY = 'creator-tier';
const TIER_ORDER: Record<Tier, number> = { free: 0, mid: 1, studio: 2 };

function loadTier(): Tier {
  // Beta testers get full access to all features
  if (BETA_ENABLED) return 'studio';
  if (typeof window === 'undefined') return 'free';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'mid' || stored === 'studio') return stored;
  return 'free';
}

interface TierState {
  tier: Tier;
  hasFeature: (feature: TierFeature) => boolean;
  setTier: (tier: Tier) => void;
}

export const useTierStore = create<TierState>((set, get) => ({
  tier: loadTier(),

  hasFeature: (feature: TierFeature) => {
    const required = TIER_FEATURES[feature];
    return TIER_ORDER[get().tier] >= TIER_ORDER[required];
  },

  setTier: (tier: Tier) => {
    localStorage.setItem(STORAGE_KEY, tier);
    set({ tier });
  },
}));
