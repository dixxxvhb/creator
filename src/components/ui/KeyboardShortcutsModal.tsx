import { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 rounded bg-gray-700 text-gray-200 text-xs font-mono font-medium border border-gray-600">
      {children}
    </kbd>
  );
}

function ShortcutRow({ keys, description }: { keys: React.ReactNode; description: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm text-gray-300">{description}</span>
      <div className="flex items-center gap-1 shrink-0">{keys}</div>
    </div>
  );
}

function ShortcutGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{title}</h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/95 backdrop-blur"
    >
      <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
          <ShortcutGroup title="Canvas">
            <ShortcutRow
              keys={
                <>
                  <KeyBadge>Arrow Keys</KeyBadge>
                </>
              }
              description="Move selected dancer"
            />
            <ShortcutRow
              keys={
                <>
                  <KeyBadge>Delete</KeyBadge>
                  <span className="text-gray-500 text-xs">/</span>
                  <KeyBadge>Backspace</KeyBadge>
                </>
              }
              description="Delete selected formation"
            />
            <ShortcutRow
              keys={
                <>
                  <KeyBadge>Ctrl</KeyBadge>
                  <span className="text-gray-500 text-xs">+</span>
                  <KeyBadge>Z</KeyBadge>
                  <span className="text-gray-500 text-xs">/</span>
                  <KeyBadge>Cmd</KeyBadge>
                  <span className="text-gray-500 text-xs">+</span>
                  <KeyBadge>Z</KeyBadge>
                </>
              }
              description="Undo (paths)"
            />
            <ShortcutRow
              keys={
                <>
                  <KeyBadge>Ctrl</KeyBadge>
                  <span className="text-gray-500 text-xs">+</span>
                  <KeyBadge>Scroll</KeyBadge>
                  <span className="text-gray-500 text-xs">/</span>
                  <KeyBadge>Cmd</KeyBadge>
                  <span className="text-gray-500 text-xs">+</span>
                  <KeyBadge>Scroll</KeyBadge>
                </>
              }
              description="Zoom canvas"
            />
          </ShortcutGroup>

          <ShortcutGroup title="Navigation">
            <ShortcutRow
              keys={
                <>
                  <KeyBadge>Space</KeyBadge>
                  <span className="text-gray-500 text-xs">/</span>
                  <KeyBadge>Arrow Right</KeyBadge>
                </>
              }
              description="Next act (backstage view)"
            />
            <ShortcutRow
              keys={<KeyBadge>Arrow Left</KeyBadge>}
              description="Previous act (backstage view)"
            />
          </ShortcutGroup>

          <ShortcutGroup title="General">
            <ShortcutRow
              keys={<KeyBadge>?</KeyBadge>}
              description="Show keyboard shortcuts"
            />
            <ShortcutRow
              keys={<KeyBadge>Esc</KeyBadge>}
              description="Close modals and panels"
            />
          </ShortcutGroup>
        </div>
      </div>
    </div>,
    document.body,
  );
}
