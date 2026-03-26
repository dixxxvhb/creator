import { useState, useEffect, useCallback, type RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const TUTORIAL_KEY = 'creator-canvas-tutorial-complete';

export function useCanvasTutorialComplete() {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(TUTORIAL_KEY) === 'true';
}

interface TutorialStep {
  title: string;
  description: string;
  targetRef: RefObject<HTMLElement | null>;
  position: 'below' | 'above';
}

interface CanvasTutorialProps {
  toolbarRef: RefObject<HTMLElement | null>;
  canvasRef: RefObject<HTMLElement | null>;
  thumbnailRef: RefObject<HTMLElement | null>;
}

const STEPS: Omit<TutorialStep, 'targetRef'>[] = [
  {
    title: 'Toolbar',
    description: 'Add dancers, apply formation templates, and switch between Select and Draw modes. On mobile, tap "More" for advanced tools like Grid and Snap.',
    position: 'below',
  },
  {
    title: 'Canvas',
    description: 'Drag dancers to position them on the stage. Pinch or scroll to zoom, two-finger swipe to pan around.',
    position: 'below',
  },
  {
    title: 'Draw Mode',
    description: 'Switch to Draw mode in the toolbar, then drag a dancer to trace their path to the next formation. Draw stays active so you can do multiple dancers in a row.',
    position: 'above',
  },
  {
    title: 'Formations',
    description: 'Each card below is a formation. Tap + to add new ones, drag to reorder. Tap a card to edit that formation.',
    position: 'above',
  },
];

export function CanvasTutorial({ toolbarRef, canvasRef, thumbnailRef }: CanvasTutorialProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const refs = [toolbarRef, canvasRef, canvasRef, thumbnailRef];
  const currentStep = STEPS[step];
  const currentRef = refs[step];

  // Show tutorial after a brief delay so elements are rendered
  useEffect(() => {
    if (useCanvasTutorialComplete()) return;
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  // Track target element position
  const updateRect = useCallback(() => {
    const el = currentRef?.current;
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    }
  }, [currentRef]);

  useEffect(() => {
    if (!visible) return;
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [visible, step, updateRect]);

  function dismiss() {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setVisible(false);
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  }

  if (!visible || !currentStep || !targetRect) return null;

  // Spotlight cutout dimensions with padding
  const pad = 8;
  const cutout = {
    x: targetRect.left - pad,
    y: targetRect.top - pad,
    w: targetRect.width + pad * 2,
    h: targetRect.height + pad * 2,
    r: 12,
  };

  // Tooltip position
  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.max(16, Math.min(cutout.x, window.innerWidth - 340)),
    zIndex: 10001,
  };

  if (currentStep.position === 'below') {
    tooltipStyle.top = cutout.y + cutout.h + 12;
  } else {
    tooltipStyle.bottom = window.innerHeight - cutout.y + 12;
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Dark overlay with spotlight cutout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[10000]"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <mask id="spotlight-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect
                    x={cutout.x}
                    y={cutout.y}
                    width={cutout.w}
                    height={cutout.h}
                    rx={cutout.r}
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.65)"
                mask="url(#spotlight-mask)"
              />
              {/* Highlight border around cutout */}
              <rect
                x={cutout.x}
                y={cutout.y}
                width={cutout.w}
                height={cutout.h}
                rx={cutout.r}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth={2}
                opacity={0.6}
              />
            </svg>
          </motion.div>

          {/* Tooltip card */}
          <motion.div
            key={step}
            initial={{ opacity: 0, y: currentStep.position === 'below' ? -8 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={tooltipStyle}
            className="z-[10001] w-80 max-w-[calc(100vw-32px)]"
          >
            <div className="bg-surface-elevated border border-border rounded-xl p-4 shadow-2xl">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-display text-base font-semibold text-text-primary">
                  {currentStep.title}
                </h3>
                <button
                  onClick={dismiss}
                  className="text-text-tertiary hover:text-text-secondary transition-colors p-0.5 -mr-1 -mt-0.5"
                  title="Skip tutorial"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                {currentStep.description}
              </p>
              <div className="flex items-center justify-between">
                {/* Step dots */}
                <div className="flex gap-1.5">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-1.5 h-1.5 rounded-full transition-colors',
                        i === step ? 'accent-bg' : 'bg-border',
                      )}
                    />
                  ))}
                </div>
                <button
                  onClick={next}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium accent-bg-light accent-text hover:brightness-105 transition-all"
                >
                  {step < STEPS.length - 1 ? (
                    <>
                      Next
                      <ArrowRight size={14} />
                    </>
                  ) : (
                    'Got it'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
