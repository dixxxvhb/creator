import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useBugReportStore } from '@/stores/bugReportStore';
import { useAuthStore } from '@/stores/authStore';
import { APP_VERSION } from '@/lib/beta';
import { cn } from '@/lib/utils';
import type { BugSeverity } from '@/types';

const severityOptions: { value: BugSeverity; label: string }[] = [
  { value: 'minor', label: 'Minor' },
  { value: 'major', label: 'Major' },
  { value: 'blocker', label: 'Blocker' },
];

interface BugReportModalProps {
  open: boolean;
  onClose: () => void;
}

export function BugReportModal({ open, onClose }: BugReportModalProps) {
  const [description, setDescription] = useState('');
  const [expected, setExpected] = useState('');
  const [severity, setSeverity] = useState<BugSeverity>('major');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useBugReportStore((s) => s.submit);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  function reset() {
    setDescription('');
    setExpected('');
    setSeverity('major');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    const success = await submit({
      description: description.trim(),
      expected: expected.trim() || null,
      severity,
      user_email: user?.email ?? 'unknown',
      page_url: location.pathname,
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
      user_agent: navigator.userAgent,
      app_version: APP_VERSION,
    });

    setIsSubmitting(false);
    if (success) {
      reset();
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Report a Bug" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          label="What happened?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what went wrong..."
          rows={3}
          required
        />
        <Textarea
          label="What did you expect?"
          value={expected}
          onChange={(e) => setExpected(e.target.value)}
          placeholder="What should have happened? (optional)"
          rows={2}
          hint="Optional"
        />
        <div>
          <label className="text-sm font-medium text-text-secondary block mb-2">
            Severity
          </label>
          <div className="flex gap-2">
            {severityOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSeverity(value)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-all border',
                  severity === value
                    ? 'border-current accent-text accent-bg-light'
                    : 'border-border-light text-text-secondary hover:text-text-primary hover:bg-surface-secondary',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-text-tertiary">
          Page, screen size, and browser info are captured automatically.
        </p>
        <Button type="submit" loading={isSubmitting} className="w-full">
          Submit Report
        </Button>
      </form>
    </Modal>
  );
}
