/**
 * True when the app is running as an installed home-screen app rather than
 * in a browser tab. Checks the standard display-mode media query plus the
 * legacy iOS Safari `navigator.standalone` flag.
 */
export function useIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
