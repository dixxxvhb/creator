import { create } from 'zustand';
import type { Tier, TierFeature } from '@/types';

// All tier gates are disabled during teacher beta. Every feature is unlocked.
// To re-enable monetization later, restore the TIER_ORDER / localStorage logic
// and let setTier actually persist a tier.

interface TierState {
  tier: Tier;
  hasFeature: (feature: TierFeature) => boolean;
  setTier: (tier: Tier) => void;
}

export const useTierStore = create<TierState>((set) => ({
  tier: 'studio',
  hasFeature: () => true,
  setTier: (tier: Tier) => set({ tier }),
}));
