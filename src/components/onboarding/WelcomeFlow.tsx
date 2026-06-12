import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { CreatorLogo } from '@/components/branding/CreatorLogo';
import { useProfileStore } from '@/stores/profileStore';
import { usePieceStore } from '@/stores/pieceStore';
import { createSamplePiece } from '@/lib/sampleData';
import { toast } from '@/stores/toastStore';
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
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [studio, setStudio] = useState('');
  const [creatingSample, setCreatingSample] = useState(false);

  const setDisplayName = useProfileStore((s) => s.setDisplayName);
  const setStudioName = useProfileStore((s) => s.setStudioName);

  function finish() {
    if (name.trim()) setDisplayName(name.trim());
    if (studio.trim()) setStudioName(studio.trim());
    markOnboardingComplete();
    // Must run before any navigation: AuthGuard renders WelcomeFlow INSTEAD
    // of the app until this flips its local state.
    onComplete();
  }

  async function handleSamplePiece() {
    setCreatingSample(true);
    const { defaultStageWidth, defaultStageDepth } = useProfileStore.getState();
    try {
      const piece = await createSamplePiece(defaultStageWidth, defaultStageDepth);
      await usePieceStore.getState().load();
      finish();
      navigate(`/pieces/${piece.id}`);
    } catch {
      toast.error('Could not set up the sample piece. You can still create one from scratch.');
      finish();
    }
  }

  function handleStartFresh() {
    finish();
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
                    hint="Optional. Shown on your dashboard."
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
              key="start"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <div className="text-center mb-8">
                <h2 className="font-display text-2xl font-semibold text-text-primary mb-2">
                  How would you like to start?
                </h2>
                <p className="text-sm text-text-secondary">
                  You can always do the other one later.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleSamplePiece}
                  disabled={creatingSample}
                  className={cn(
                    'w-full text-left bg-surface-elevated border border-border-light rounded-2xl p-5',
                    'hover:border-border transition-all card-interactive',
                    creatingSample && 'opacity-70 pointer-events-none',
                  )}
                >
                  <div className="flex items-start gap-3">
                    {creatingSample ? (
                      <Spinner size="sm" />
                    ) : (
                      <Sparkles size={20} className="accent-text mt-0.5 shrink-0" strokeWidth={1.75} />
                    )}
                    <div>
                      <p className="font-semibold text-text-primary mb-0.5">
                        {creatingSample ? 'Setting up your sample piece…' : 'Open a sample piece'}
                      </p>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        See 8 dancers and 3 formations already set up. Play with everything, delete it anytime.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleStartFresh}
                  disabled={creatingSample}
                  className="w-full text-left bg-surface-elevated border border-border-light rounded-2xl p-5 hover:border-border transition-all card-interactive"
                >
                  <div className="flex items-start gap-3">
                    <PenLine size={20} className="text-text-secondary mt-0.5 shrink-0" strokeWidth={1.75} />
                    <div>
                      <p className="font-semibold text-text-primary mb-0.5">Start fresh</p>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        Go to your studio and build your first piece from scratch.
                      </p>
                    </div>
                  </div>
                </button>

                <Button
                  variant="secondary"
                  onClick={() => setStep(0)}
                  disabled={creatingSample}
                  className="w-full"
                >
                  Back
                </Button>
              </div>
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
