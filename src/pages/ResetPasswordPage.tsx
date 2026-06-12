import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CreatorLogo } from '@/components/branding/CreatorLogo';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from '@/stores/toastStore';

type RecoveryState = 'checking' | 'ready' | 'invalid';

/**
 * Landing page for Supabase password-recovery links. The recovery tokens
 * arrive in the URL hash (which survives the GitHub Pages 404 redirect) and
 * supabase-js consumes them during client init — sometimes before this page
 * mounts, sometimes after. Both legs are covered: an existing session OR a
 * PASSWORD_RECOVERY event means we're ready.
 */
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const updatePassword = useAuthStore((s) => s.updatePassword);

  const [recoveryState, setRecoveryState] = useState<RecoveryState>(() =>
    window.location.hash.includes('error_description') ? 'invalid' : 'checking'
  );
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (recoveryState !== 'checking') return;

    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session) setRecoveryState('ready');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY' || session) setRecoveryState('ready');
    });

    // Grace period for the client to consume the hash; after that, the link
    // is missing/expired/used.
    const timer = setTimeout(() => {
      if (!cancelled) {
        setRecoveryState((s) => (s === 'checking' ? 'invalid' : s));
      }
    }, 2500);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [recoveryState]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsSubmitting(true);
    const { error } = await updatePassword(password);
    setIsSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    toast.success('Password updated');
    // The recovery link signed the user in, so they land straight in the app.
    navigate('/', { replace: true });
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
          <p className="text-sm text-text-secondary">Set a new password</p>
        </div>

        <Card>
          {recoveryState === 'checking' && (
            <p className="text-sm text-text-secondary text-center py-6">
              Checking your reset link…
            </p>
          )}

          {recoveryState === 'invalid' && (
            <div className="text-center py-4 space-y-4">
              <p className="text-sm text-text-primary font-medium">This link has expired</p>
              <p className="text-xs text-text-secondary">
                Reset links only work once. Request a new one from the sign-in screen.
              </p>
              <Button variant="secondary" onClick={() => navigate('/', { replace: true })}>
                Go to Sign In
              </Button>
            </div>
          )}

          {recoveryState === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                autoFocus
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
              />
              {error && (
                <p className="text-sm text-danger-500 bg-danger-50 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}
              <Button type="submit" loading={isSubmitting} className="w-full">
                Save New Password
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
