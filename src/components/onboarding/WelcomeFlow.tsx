import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { CreatorLogo } from '@/components/branding/CreatorLogo';
import { useProfileStore } from '@/stores/profileStore';
import { DANCE_STYLES } from '@/types';
import { cn } from '@/lib/utils';

const ONBOARDING_KEY = 'creator-onboarding-complete';

export function useOnboardingComplete() {
  const displayName = useProfileStore((s) => s.displayName);
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(ONBOARDING_KEY) === 'true' || displayName !== '';
}

export function markOnboardingComplete() {
  localStorage.setItem(ONBOARDING_KEY, 'true');
}

interface WelcomeFlowProps {
  onComplete: () => void;
}

export function WelcomeFlow({ onComplete }: WelcomeFlowProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [studio, setStudio] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  const setDisplayName = useProfileStore((s) => s.setDisplayName);
  const setStudioName = useProfileStore((s) => s.setStudioName);

  function toggleStyle(style: string) {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style],
    );
  }

  function handleFinish() {
    if (name.trim()) setDisplayName(name.trim());
    if (studio.trim()) setStudioName(studio.trim());
    markOnboardingComplete();
    onComplete();
  }

  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="welcome"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <div className="text-center mb-8">
                <CreatorLogo size={48} className="accent-text mx-auto mb-4" />
                <h1 className="font-display text-3xl font-semibold text-text-primary mb-2">
                  Welcome to Creator
                </h1>
                <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">
                  The choreography tool built for dance teachers. Let's get you set up in under a minute.
                </p>
              </div>
              <Card>
                <div className="space-y-5">
                  <Input
                    label="What should we call you?"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                  <Input
                    label="Studio or company name"
                    placeholder="e.g. Momentum Dance Company"
                    value={studio}
                    onChange={(e) => setStudio(e.target.value)}
                    hint="Optional — shown on your dashboard"
                  />
                  <Button onClick={() => setStep(1)} className="w-full">
                    Continue
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="styles"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <div className="text-center mb-8">
                <h2 className="font-display text-2xl font-semibold text-text-primary mb-2">
                  What do you teach?
                </h2>
                <p className="text-sm text-text-secondary">
                  Select any styles you work with. This helps us set defaults for new pieces.
                </p>
              </div>
              <Card>
                <div className="flex flex-wrap gap-2 mb-6">
                  {DANCE_STYLES.map((style) => (
                    <button
                      key={style}
                      onClick={() => toggleStyle(style)}
                      className={cn(
                        'px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border min-h-[44px]',
                        selectedStyles.includes(style)
                          ? 'accent-bg text-white border-transparent shadow-sm'
                          : 'bg-surface-secondary text-text-secondary border-border-light hover:text-text-primary hover:border-border',
                      )}
                      style={selectedStyles.includes(style) ? { backgroundColor: 'var(--color-accent)' } : undefined}
                    >
                      {selectedStyles.includes(style) && <Check size={14} className="inline mr-1.5 -mt-0.5" />}
                      {style}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setStep(0)} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={handleFinish} className="flex-1">
                    {selectedStyles.length > 0 ? "Let's go" : 'Skip for now'}
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                step === i ? 'w-6 accent-bg' : 'bg-border',
              )}
              style={step === i ? { backgroundColor: 'var(--color-accent)' } : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
