import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { useTierStore } from '@/stores/tierStore';
import { TIER_LABELS, TIER_FEATURES } from '@/types';
import type { TierFeature } from '@/types';

interface TierGateProps {
  feature: TierFeature;
  children: ReactNode;
  /** If true, shows children with a locked overlay instead of replacing them */
  overlay?: boolean;
}

export function TierGate({ feature, children, overlay }: TierGateProps) {
  const hasFeature = useTierStore((s) => s.hasFeature);

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  const requiredTier = TIER_FEATURES[feature];
  const label = TIER_LABELS[requiredTier];

  if (overlay) {
    return (
      <div className="relative">
        <div className="opacity-40 pointer-events-none select-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-elevated border border-border shadow-lg">
            <Lock size={14} className="text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">{label}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-surface-secondary flex items-center justify-center mb-4">
        <Lock size={24} className="text-text-tertiary" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-1">{label} Feature</h3>
      <p className="text-sm text-text-secondary max-w-sm">
        Upgrade to the {label} tier to unlock this feature.
      </p>
    </div>
  );
}
