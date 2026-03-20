export type OffstageDirection = 'left' | 'right' | 'back' | 'front' | null;

/**
 * Returns true if a position is outside the stage bounds.
 */
export function isOffstage(
  x: number,
  y: number,
  stageWidth: number,
  stageDepth: number,
): boolean {
  return x < 0 || x > stageWidth || y < 0 || y > stageDepth;
}

/**
 * Determines which direction a dancer exited the stage.
 * If offstage on multiple axes, picks the dominant one (furthest out).
 * Returns null if on-stage.
 */
export function getOffstageDirection(
  x: number,
  y: number,
  stageWidth: number,
  stageDepth: number,
): OffstageDirection {
  if (!isOffstage(x, y, stageWidth, stageDepth)) return null;

  // How far past each edge
  const dLeft = x < 0 ? -x : 0;
  const dRight = x > stageWidth ? x - stageWidth : 0;
  const dBack = y < 0 ? -y : 0;
  const dFront = y > stageDepth ? y - stageDepth : 0;

  const max = Math.max(dLeft, dRight, dBack, dFront);
  if (max === dLeft) return 'left';
  if (max === dRight) return 'right';
  if (max === dBack) return 'back';
  return 'front';
}

/**
 * Clamps an offstage position to the nearest point on the stage edge.
 * Used for rendering ghost indicators at the boundary.
 */
export function clampToEdge(
  x: number,
  y: number,
  stageWidth: number,
  stageDepth: number,
): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(stageWidth, x)),
    y: Math.max(0, Math.min(stageDepth, y)),
  };
}
