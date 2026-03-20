import type { DancerPosition } from '@/types';
import { isOffstage } from './offstage';

const SNAP_UNIT = 1.25;
const LINE_SPACING = 5; // 2 stage numbers apart in coordinate units

function snapCoord(v: number): number {
  return Math.round(v / SNAP_UNIT) * SNAP_UNIT;
}

/**
 * Smart snap: distribute on-stage dancers evenly across stage number X-lines
 * (0, 2, 4, 6, 8...) while preserving their relative left-to-right order.
 * Y is snapped to nearest grid point. Offstage dancers are left in place.
 */
export function smartSnapPositions(
  positions: DancerPosition[],
  stageWidth: number,
  stageDepth: number,
): { id: string; x: number; y: number }[] {
  const cx = stageWidth / 2;

  // Build available X-lines radiating from center
  const allLines: number[] = [cx];
  for (let offset = LINE_SPACING; cx - offset >= 0; offset += LINE_SPACING) {
    allLines.push(cx - offset, cx + offset);
  }
  allLines.sort((a, b) => a - b);

  // Separate on-stage vs offstage
  const onStage = positions.filter(
    (p) => !isOffstage(p.x, p.y, stageWidth, stageDepth),
  );
  const offStage = positions.filter((p) =>
    isOffstage(p.x, p.y, stageWidth, stageDepth),
  );

  const results: { id: string; x: number; y: number }[] = [];

  // Offstage dancers keep their positions
  for (const p of offStage) {
    results.push({ id: p.id, x: p.x, y: p.y });
  }

  const N = onStage.length;
  if (N === 0) return results;

  // Pick the N most central lines
  const linesByCenter = [...allLines].sort(
    (a, b) => Math.abs(a - cx) - Math.abs(b - cx),
  );

  // Sort on-stage dancers by current X (preserve relative order)
  const sorted = [...onStage].sort((a, b) => a.x - b.x);

  if (N <= allLines.length) {
    // Each dancer gets their own line
    const selectedLines = linesByCenter.slice(0, N).sort((a, b) => a - b);
    for (let i = 0; i < N; i++) {
      results.push({
        id: sorted[i].id,
        x: selectedLines[i],
        y: snapCoord(sorted[i].y),
      });
    }
  } else {
    // More dancers than lines — distribute across all lines
    const numLines = allLines.length;
    const perLine = Math.floor(N / numLines);
    const remainder = N % numLines;

    // Give center lines the extra dancers
    const bucketsFinal = new Array(numLines).fill(perLine);
    const centerOrder = allLines
      .map((_, i) => i)
      .sort(
        (a, b) =>
          Math.abs(allLines[a] - cx) - Math.abs(allLines[b] - cx),
      );
    for (let r = 0; r < remainder; r++) {
      bucketsFinal[centerOrder[r]]++;
    }

    let dancerIdx = 0;
    for (let lineIdx = 0; lineIdx < numLines; lineIdx++) {
      const count = bucketsFinal[lineIdx];
      if (count === 0) continue;
      const lineX = allLines[lineIdx];
      // Spread Y positions evenly across stage depth
      const margin = stageDepth * 0.15;
      for (let j = 0; j < count; j++) {
        const t = count === 1 ? 0.5 : j / (count - 1);
        const rawY = margin + t * (stageDepth - margin * 2);
        results.push({
          id: sorted[dancerIdx].id,
          x: lineX,
          y: snapCoord(rawY),
        });
        dancerIdx++;
      }
    }
  }

  return results;
}
