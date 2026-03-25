import { useState } from 'react';
import { Bug } from 'lucide-react';
import { BugReportModal } from './BugReportModal';

export function BugReportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface-secondary border border-border-light text-text-secondary text-sm font-medium shadow-lg hover:bg-border-light hover:text-text-primary transition-all"
        aria-label="Report a bug"
      >
        <Bug size={16} />
        <span className="hidden sm:inline">Report Bug</span>
      </button>
      <BugReportModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
