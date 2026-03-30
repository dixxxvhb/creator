import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { AuthPage } from '@/pages/AuthPage';
import { Spinner } from '@/components/ui/Spinner';
import { WelcomeFlow, useOnboardingComplete } from '@/components/onboarding/WelcomeFlow';
import { BETA_ENABLED, hasBetaAccess } from '@/lib/beta';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const onboardingComplete = useOnboardingComplete();
  const [showOnboarding, setShowOnboarding] = useState(!onboardingComplete);

  const betaBypass = BETA_ENABLED && hasBetaAccess();

  if (!betaBypass && (!isInitialized || isLoading)) {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user && !betaBypass) {
    return <AuthPage />;
  }

  if (showOnboarding) {
    return <WelcomeFlow onComplete={() => setShowOnboarding(false)} />;
  }

  return <>{children}</>;
}
