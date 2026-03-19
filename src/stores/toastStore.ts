import { toast as sonnerToast } from 'sonner';

// Re-export sonner toast with the same API our stores expect
export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast(message),
};
