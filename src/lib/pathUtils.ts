import type { PathPoint } from '@/types';

// ─── Distance ───────────────────────────────────────────────────────────────

export function distance(a: PathPoint, b: PathPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ─── Path Length ─────────────────────────────────────────────────────────────

export function getPathLength(points: PathPoint[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += distance(points[i - 1], points[i]);
  }
  return total;
}

// ─── Point at T along Polyline ───────────────────────────────────────────────

/**
 * Get the position at normalized t (0–1) along a polyline (straight segments).
 * t=0 returns the first point, t=1 returns the last.
 */
export function getPointAtT(points: PathPoint[], t: number): PathPoint {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return { ...points[0] };
  if (t <= 0) return { ...points[0] };
  if (t >= 1) return { ...points[points.length - 1] };

  const totalLength = getPathLength(points);
  const target = t * totalLength;

  let accumulated = 0;
  for (let i = 1; i < points.length; i++) {
    const segLen = distance(points[i - 1], points[i]);
    if (accumulated + segLen >= target) {
      const segT = segLen === 0 ? 0 : (target - accumulated) / segLen;
      return {
        x: points[i - 1].x + segT * (points[i].x - points[i - 1].x),
        y: points[i - 1].y + segT * (points[i].y - points[i - 1].y),
      };
    }
    accumulated += segLen;
  }

  return { ...points[points.length - 1] };
}

// ─── Catmull-Rom Spline ───────────────────────────────────────────────────────

/**
 * Evaluate a single Catmull-Rom segment at parameter u (0–1).
 * p0, p1, p2, p3 are the four control points for the segment.
 * tension controls the tightness (0.5 is standard Catmull-Rom).
 */
function catmullRomPoint(
  p0: PathPoint,
  p1: PathPoint,
  p2: PathPoint,
  p3: PathPoint,
  u: number,
  tension: number
): PathPoint {
  const t = tension;
  const u2 = u * u;
  const u3 = u2 * u;

  // Catmull-Rom basis
  const b0 = -t * u3 + 2 * t * u2 - t * u;
  const b1 = (2 - t) * u3 + (t - 3) * u2 + 1;
  const b2 = (t - 2) * u3 + (3 - 2 * t) * u2 + t * u;
  const b3 = t * u3 - t * u2;

  return {
    x: b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x,
    y: b0 * p0.y + b1 * p1.y + b2 * p2.y + b3 * p3.y,
  };
}

/**
 * Sample a Catmull-Rom spline at numSamples evenly spaced parameter values.
 * Endpoints are duplicated to handle edge cases.
 * Returns an array of PathPoints approximating the smooth curve.
 */
export function sampleCatmullRom(
  points: PathPoint[],
  tension: number,
  numSamples: number
): PathPoint[] {
  if (points.length < 2) return points.length === 1 ? [{ ...points[0] }] : [];
  if (numSamples < 2) return [{ ...points[0] }, { ...points[points.length - 1] }];

  // Pad endpoints by duplicating first and last
  const pts = [points[0], ...points, points[points.length - 1]];
  const numSegments = pts.length - 3; // number of Catmull-Rom segments

  const sampled: PathPoint[] = [];

  for (let i = 0; i < numSamples; i++) {
    const globalT = (i / (numSamples - 1)) * numSegments;
    const segIndex = Math.min(Math.floor(globalT), numSegments - 1);
    const u = globalT - segIndex;

    const p0 = pts[segIndex];
    const p1 = pts[segIndex + 1];
    const p2 = pts[segIndex + 2];
    const p3 = pts[segIndex + 3];

    sampled.push(catmullRomPoint(p0, p1, p2, p3, u, tension));
  }

  return sampled;
}

/**
 * Get the position along a Catmull-Rom spline at normalized t (0–1).
 * Samples the spline into a polyline, computes arc lengths, then interpolates.
 */
export function getSplinePointAtT(
  points: PathPoint[],
  tension: number,
  t: number
): PathPoint {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return { ...points[0] };
  if (t <= 0) return { ...points[0] };
  if (t >= 1) return { ...points[points.length - 1] };

  const sampled = sampleCatmullRom(points, tension, 100);
  return getPointAtT(sampled, t);
}

// ─── Ramer-Douglas-Peucker ────────────────────────────────────────────────────

/**
 * Perpendicular distance from point p to the line segment defined by a and b.
 */
function perpendicularDistance(p: PathPoint, a: PathPoint, b: PathPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  // Degenerate segment — a and b are the same point
  if (dx === 0 && dy === 0) {
    return distance(p, a);
  }

  const lengthSq = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  const closest: PathPoint = {
    x: a.x + t * dx,
    y: a.y + t * dy,
  };
  return distance(p, closest);
}

function rdpRecursive(
  points: PathPoint[],
  start: number,
  end: number,
  tolerance: number,
  result: boolean[]
): void {
  if (end <= start + 1) return;

  let maxDist = 0;
  let maxIndex = start;

  for (let i = start + 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[start], points[end]);
    if (d > maxDist) {
      maxDist = d;
      maxIndex = i;
    }
  }

  if (maxDist > tolerance) {
    result[maxIndex] = true;
    rdpRecursive(points, start, maxIndex, tolerance, result);
    rdpRecursive(points, maxIndex, end, tolerance, result);
  }
}

/**
 * Simplify a polyline using the Ramer-Douglas-Peucker algorithm.
 * Points further than tolerance from the simplified line are kept.
 */
export function simplifyPath(points: PathPoint[], tolerance: number): PathPoint[] {
  if (points.length <= 2) return [...points];

  const keep = new Array<boolean>(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;

  rdpRecursive(points, 0, points.length - 1, tolerance, keep);

  return points.filter((_, i) => keep[i]);
}
