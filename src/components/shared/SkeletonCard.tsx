/**
 * Loading placeholder shaped like a PieceCard, using the design system's
 * existing .skeleton shimmer. Perceived-speed win on first-paint surfaces.
 */
export function SkeletonCard() {
  return (
    <div className="bg-surface-elevated border border-border-light rounded-2xl p-5 space-y-3">
      <div className="skeleton h-5 w-2/3" />
      <div className="skeleton h-3.5 w-1/2" />
      <div className="skeleton h-3.5 w-1/3" />
      <div className="flex gap-2 pt-1">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
