interface CreatorLogoProps {
  size?: number;
  className?: string;
}

/**
 * Formation Dots logo mark — 5 dots in a staggered V formation,
 * evoking dancers on stage seen from above.
 * Always uses currentColor (neutral, not accent-tinted).
 */
export function CreatorLogo({ size = 28, className }: CreatorLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="32" cy="14" r="5.5" fill="currentColor" />
      <circle cx="20" cy="26" r="5.5" fill="currentColor" />
      <circle cx="44" cy="26" r="5.5" fill="currentColor" />
      <circle cx="12" cy="40" r="5" fill="currentColor" />
      <circle cx="52" cy="40" r="5" fill="currentColor" />
    </svg>
  );
}
