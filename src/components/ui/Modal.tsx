import { useEffect, useCallback, useRef } from 'react';
import type { ReactNode, MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { overlayVariants, modalVariants, sheetVariants } from '@/lib/motion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
};

export function Modal({ open, onClose, title, children, className, size = 'md' }: ModalProps) {
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
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          onClick={handleOverlayClick}
          variants={overlayVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          {/* Desktop: centered modal with scale animation */}
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'bg-surface-elevated rounded-2xl w-full sm:mx-4',
              'shadow-2xl hidden sm:block border border-border-light',
              sizeClasses[size],
              className,
            )}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
              <h2 className="font-display text-lg font-semibold text-text-primary">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-all min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
          </motion.div>

          {/* Mobile: bottom sheet with slide-up animation */}
          <motion.div
            variants={sheetVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'bg-surface-elevated rounded-t-2xl w-full',
              'shadow-2xl sm:hidden',
              className,
            )}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
              <h2 className="font-display text-lg font-semibold text-text-primary">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-all min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-5 pb-8 max-h-[80vh] overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
