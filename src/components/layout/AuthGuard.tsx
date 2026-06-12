import { useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { AuthPage } from '@/pages/AuthPage';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { WelcomeFlow, useOnboardingComplete } from '@/components/onboarding/WelcomeFlow';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const initError = useAuthStore((s) => s.initError);
  const onboardingComplete = useOnboardingComplete();
  const [showOnboarding, setShowOnboarding] = useState(!onboardingComplete);

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Session check failed on the network, not because the user is signed out.
  // Don't dump a logged-in teacher onto the login page — let them retry.
  if (initError && !user) {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center p-6">
        <div className="bg-surface-elevated border border-border rounded-2xl p-8 max-w-md text-center space-y-4">
          <WifiOff className="w-8 h-8 mx-auto text-text-tertiary" strokeWidth={1.75} />
          <h2 className="text-lg font-semibold text-text-primary">Can't reach the server</h2>
          <p className="text-sm text-text-secondary">
            Check your connection, then try again. Your work is safe.
          </p>
          <Button onClick={() => useAuthStore.getState().initialize()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (showOnboarding) {
    return <WelcomeFlow onComplete={() => setShowOnboarding(false)} />;
  }

  return <>{children}</>;
}
