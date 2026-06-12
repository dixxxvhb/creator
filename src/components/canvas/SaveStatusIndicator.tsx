import { Cloud, Check, CloudOff } from 'lucide-react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
}

/**
 * Non-interactive pill that tells the teacher their work is stored.
 * Renders nothing when idle.
 */
export function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  if (status === 'idle') return null;

  const config = {
    saving: { icon: Cloud, label: 'Saving…', extra: 'text-text-secondary' },
    saved: { icon: Check, label: 'Saved', extra: 'text-text-secondary' },
    error: { icon: CloudOff, label: 'Not saved', extra: 'text-red-500' },
  }[status];

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-secondary text-xs font-medium select-none ${config.extra}`}
      aria-live="polite"
    >
      <Icon className={`w-3.5 h-3.5 ${status === 'saving' ? 'animate-pulse' : ''}`} strokeWidth={1.75} />
      {config.label}
    </span>
  );
}
