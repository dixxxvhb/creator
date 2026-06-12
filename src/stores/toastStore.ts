import { toast as sonnerToast } from 'sonner';
import { supabase } from '@/lib/supabase';

const AUTH_ERROR_PATTERNS = [
  'Not authenticated',
  'JWT expired',
  'Auth session missing',
  'Invalid Refresh Token',
  'invalid_grant',
];

export function isAuthError(message: string): boolean {
  return AUTH_ERROR_PATTERNS.some((p) => message.includes(p));
}

let signingOut = false;
function handleExpiredSession() {
  if (signingOut) return;
  signingOut = true;
  supabase.auth.signOut().finally(() => { signingOut = false; });
}

export const toast = {
  success: (message: string) => sonnerToast.success(message, { id: message }),
  error: (message: string) => {
    if (isAuthError(message)) {
      handleExpiredSession();
      sonnerToast.error('Your session expired. Please sign in again.', { id: 'auth-expired' });
      return;
    }
    sonnerToast.error(message, { id: message });
  },
  info: (message: string) => sonnerToast(message, { id: message }),
};
