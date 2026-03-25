/**
 * Greedy algorithm to reorder show acts and minimize dancer conflicts.
 *
 * Strategy:
 * 1. Start with the piece that has the most dancers (hardest to schedule).
 * 2. For each remaining slot, pick the piece with the fewest conflicts
 *    against the last N placed pieces (N = bufferActs).
 * 3. Break ties by choosing the piece with more dancers (greedier spacing).
 * 4. If all remaining pieces conflict, pick the one with smallest overlap.
 */

function getOverlap(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const id of a) {
    if (b.has(id)) count++;
  }
  return count;
}

export function optimizeShowOrder(
  pieceIds: string[],
  pieceDancerMap: Map<string, Set<string>>,
  bufferActs: number,
): string[] {
  if (pieceIds.length <= 1) return [...pieceIds];

  const remaining = new Set(pieceIds);
  const result: string[] = [];

  const dancerCount = (id: string) => pieceDancerMap.get(id)?.size ?? 0;

  // Pick the piece with the most dancers to start
  let first = pieceIds[0];
  let maxDancers = -1;
  for (const id of pieceIds) {
    const count = dancerCount(id);
    if (count > maxDancers) {
      maxDancers = count;
      first = id;
    }
  }

  result.push(first);
  remaining.delete(first);

  // Greedily fill the rest
  while (remaining.size > 0) {
    // Gather the "window" of recent pieces to check conflicts against
    const windowStart = Math.max(0, result.length - bufferActs);
    const window = result.slice(windowStart);

    let bestId: string | null = null;
    let bestConflict = Infinity;
    let bestDancerCount = -1;

    for (const candidateId of remaining) {
      const candidateDancers = pieceDancerMap.get(candidateId) ?? new Set<string>();

      // Sum of overlaps with each piece in the window
      let totalOverlap = 0;
      for (const windowPieceId of window) {
        const windowDancers = pieceDancerMap.get(windowPieceId) ?? new Set<string>();
        totalOverlap += getOverlap(candidateDancers, windowDancers);
      }

      const count = candidateDancers.size;

      if (
        totalOverlap < bestConflict ||
        (totalOverlap === bestConflict && count > bestDancerCount)
      ) {
        bestConflict = totalOverlap;
        bestDancerCount = count;
        bestId = candidateId;
      }
    }

    // bestId is guaranteed non-null since remaining.size > 0
    result.push(bestId!);
    remaining.delete(bestId!);
  }

  return result;
}
