import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CreatorLogo } from '@/components/branding/CreatorLogo';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { BETA_ENABLED, ACCESS_CODE } from '@/lib/beta';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [accessGranted, setAccessGranted] = useState(false);

  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signInAnonymously = useAuthStore((s) => s.signInAnonymously);

  async function handleAccessCode() {
    if (accessCode.toUpperCase().trim() !== ACCESS_CODE) {
      setError('Invalid access code');
      return;
    }
    setError(null);

    if (BETA_ENABLED) {
      // Beta: skip email/password, sign in anonymously
      setIsSubmitting(true);
      const { error } = await signInAnonymously();
      setIsSubmitting(false);
      if (error) {
        setError('Anonymous sign-in failed. Please enable anonymous auth in Supabase dashboard (Auth > Settings), then try again.');
        return;
      }
      // Auth state change listener in authStore will set user, AuthGuard will pass
      return;
    }

    setAccessGranted(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error);
      } else {
        setSignupSuccess(true);
      }
    }

    setIsSubmitting(false);
  }

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <CreatorLogo size={32} className="accent-text" />
            <span className="font-display text-text-primary text-2xl font-semibold tracking-wide">
              Creator
            </span>
          </div>
          <p className="text-sm text-text-secondary">Choreography, visualized.</p>
        </div>

        {BETA_ENABLED && !accessGranted ? (
          /* Beta mode: access code gate */
          <Card>
            <form onSubmit={(e) => { e.preventDefault(); handleAccessCode(); }} className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-sm text-text-secondary">
                  Enter your access code to start testing
                </p>
              </div>
              <Input
                label="Access Code"
                type="text"
                value={accessCode}
                onChange={(e) => { setAccessCode(e.target.value); setError(null); }}
                placeholder="Enter your beta access code"
                required
                autoFocus
                disabled={isSubmitting}
              />
              {error && (
                <p className="text-sm text-danger-500 bg-danger-50 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                loading={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Setting up...' : 'Enter'}
              </Button>
            </form>
          </Card>
        ) : signupSuccess ? (
          <Card>
            <div className="text-center py-4">
              <p className="text-sm text-text-primary font-medium mb-2">Check your email</p>
              <p className="text-xs text-text-secondary">
                We sent a confirmation link to <strong>{email}</strong>.
                Click it to activate your account.
              </p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => { setSignupSuccess(false); setMode('login'); }}
              >
                Back to Login
              </Button>
            </div>
          </Card>
        ) : (
          /* Login/signup form (shown after access code validated, or when beta is off) */
          <Card>
            {BETA_ENABLED && (
              <div className="text-center mb-4">
                <p className="text-xs text-accent-600 font-medium">
                  Access granted — create your account or log in
                </p>
              </div>
            )}
            <div className="flex gap-1 bg-surface-secondary rounded-lg p-1 mb-4">
              <button
                onClick={() => { setMode('login'); setError(null); }}
                className={cn(
                  'flex-1 text-sm py-2 rounded-md transition-colors font-medium',
                  mode === 'login'
                    ? 'bg-surface-elevated text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                Log In
              </button>
              <button
                onClick={() => { setMode('signup'); setError(null); }}
                className={cn(
                  'flex-1 text-sm py-2 rounded-md transition-colors font-medium',
                  mode === 'signup'
                    ? 'bg-surface-elevated text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />
              {mode === 'signup' && (
                <Input
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  required
                />
              )}

              {error && (
                <p className="text-sm text-danger-500 bg-danger-50 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <Button type="submit" loading={isSubmitting} className="w-full">
                {mode === 'login' ? 'Log In' : 'Create Account'}
              </Button>

              {BETA_ENABLED && (
                <button
                  type="button"
                  onClick={() => { setAccessGranted(false); setError(null); }}
                  className="w-full text-xs text-text-tertiary hover:text-text-secondary transition-colors pt-1"
                >
                  Enter a different access code
                </button>
              )}
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
