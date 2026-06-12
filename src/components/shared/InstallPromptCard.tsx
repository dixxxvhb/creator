import { Share, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useIsStandalone } from '@/hooks/useIsStandalone';

const steps = [
  { text: 'Open this site in Safari on your iPad', icon: null },
  { text: 'Tap the Share button (the square with the up arrow)', icon: Share },
  { text: 'Scroll down and tap "Add to Home Screen"', icon: Plus },
  { text: 'Tap Add. CREATOR opens like a regular app from then on', icon: null },
];

/**
 * Add-to-Home-Screen walkthrough for teachers. Hidden when already running
 * as an installed app, or on non-touch devices where it doesn't apply.
 */
export function InstallPromptCard() {
  const isStandalone = useIsStandalone();
  const isTouchDevice = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;

  if (isStandalone || !isTouchDevice) return null;

  return (
    <Card className="p-5">
      <h3 className="font-display text-lg font-semibold text-text-primary mb-1">
        Install on your iPad
      </h3>
      <p className="text-sm text-text-secondary mb-4">
        Put CREATOR on your home screen and it opens full screen, like any other app.
      </p>
      <ol className="space-y-2.5">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-text-primary">
            <span className="shrink-0 w-6 h-6 rounded-full bg-surface-secondary text-text-secondary text-xs font-semibold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span className="leading-6">
              {step.text}
              {step.icon && (
                <step.icon size={14} className="inline-block ml-1.5 align-[-2px] text-text-secondary" strokeWidth={1.75} />
              )}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
