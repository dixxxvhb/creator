import { DANCER_COLORS } from '@/types';
import type { DancerPositionInsert } from '@/types';

// ─── Label Generator (A, B, ... Z, AA, AB...) ───

export function generateLabel(i: number): string {
  if (i < 26) return String.fromCharCode(65 + i);
  return (
    String.fromCharCode(65 + Math.floor(i / 26) - 1) +
    String.fromCharCode(65 + (i % 26))
  );
}

// ─── Template Definitions ───

export type TemplateCategory = 'symmetric' | 'asymmetric' | 'soloist' | 'featured';

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  minDancers: number;
  featuredCount?: number;
  generate: (count: number, w: number, h: number) => { x: number; y: number }[];
}

export interface RoleAssignment {
  positionIndex: number;
  dancerLabel: string;
}

function distribute(count: number, w: number, h: number, fn: (i: number, n: number, w: number, h: number) => { x: number; y: number }): { x: number; y: number }[] {
  return Array.from({ length: count }, (_, i) => fn(i, count, w, h));
}

// Snap a coordinate to the nearest 0.5 stage number (1.25 coordinate units)
const SNAP_UNIT = 1.25;
function snapCoord(v: number): number {
  return Math.round(v / SNAP_UNIT) * SNAP_UNIT;
}

// Margin factor — keep dots away from edges
const M = 0.1;

export const TEMPLATES: TemplateInfo[] = [
  {
    id: 'line',
    name: 'Line',
    description: 'Single horizontal line',
    category: 'symmetric',
    minDancers: 1,
    generate: (n, w, h) =>
      distribute(n, w, h, (i, count, w, h) => ({
        x: count === 1 ? w / 2 : w * M + (i / (count - 1)) * w * (1 - 2 * M),
        y: h / 2,
      })),
  },
  {
    id: 'two-lines',
    name: 'Two Lines',
    description: 'Two horizontal rows',
    category: 'symmetric',
    minDancers: 2,
    generate: (n, w, h) => {
      const frontCount = Math.ceil(n / 2);
      const backCount = n - frontCount;
      const positions: { x: number; y: number }[] = [];
      const rowGap = h * 0.2;

      for (let i = 0; i < frontCount; i++) {
        positions.push({
          x: frontCount === 1 ? w / 2 : w * M + (i / (frontCount - 1)) * w * (1 - 2 * M),
          y: h / 2 + rowGap / 2,
        });
      }
      for (let i = 0; i < backCount; i++) {
        positions.push({
          x: backCount === 1 ? w / 2 : w * M + (i / (backCount - 1)) * w * (1 - 2 * M),
          y: h / 2 - rowGap / 2,
        });
      }
      return positions;
    },
  },
  {
    id: 'three-lines',
    name: 'Three Lines',
    description: 'Three horizontal rows',
    category: 'symmetric',
    minDancers: 3,
    generate: (n, w, h) => {
      const rows = 3;
      const perRow: number[] = [];
      const base = Math.floor(n / rows);
      let remainder = n % rows;
      for (let r = 0; r < rows; r++) {
        perRow.push(base + (remainder > 0 ? 1 : 0));
        if (remainder > 0) remainder--;
      }
      const positions: { x: number; y: number }[] = [];
      const totalHeight = h * (1 - 2 * M);
      for (let r = 0; r < rows; r++) {
        const count = perRow[r];
        const rowY = h * M + (r / (rows - 1)) * totalHeight;
        for (let i = 0; i < count; i++) {
          positions.push({
            x: count === 1 ? w / 2 : w * M + (i / (count - 1)) * w * (1 - 2 * M),
            y: rowY,
          });
        }
      }
      return positions;
    },
  },
  {
    id: 'v-formation',
    name: 'V Shape',
    description: 'V pointing toward audience',
    category: 'symmetric',
    minDancers: 3,
    generate: (n, w, h) => {
      const cx = w / 2;
      const positions: { x: number; y: number }[] = [];
      // Point at front-center, arms spread upstage
      const spreadX = w * (1 - 2 * M) / 2;
      const spreadY = h * (1 - 2 * M) / 2;
      for (let i = 0; i < n; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const depth = Math.ceil((i + 1) / 2) / Math.ceil(n / 2);
        positions.push({
          x: cx + side * depth * spreadX * (n === 1 ? 0 : 1),
          y: h / 2 + spreadY - depth * spreadY * 2 * (n === 1 ? 0 : 1),
        });
      }
      // Sort so tip is first
      return positions;
    },
  },
  {
    id: 'inverted-v',
    name: 'Inverted V',
    description: 'V pointing upstage',
    category: 'symmetric',
    minDancers: 3,
    generate: (n, w, h) => {
      const cx = w / 2;
      const positions: { x: number; y: number }[] = [];
      const spreadX = w * (1 - 2 * M) / 2;
      const spreadY = h * (1 - 2 * M) / 2;
      for (let i = 0; i < n; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const depth = Math.ceil((i + 1) / 2) / Math.ceil(n / 2);
        positions.push({
          x: cx + side * depth * spreadX * (n === 1 ? 0 : 1),
          y: h / 2 - spreadY + depth * spreadY * 2 * (n === 1 ? 0 : 1),
        });
      }
      return positions;
    },
  },
  {
    id: 'diamond',
    name: 'Diamond',
    description: 'Diamond / rhombus shape',
    category: 'symmetric',
    minDancers: 4,
    generate: (n, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      const rx = w * (1 - 2 * M) / 2;
      const ry = h * (1 - 2 * M) / 2;
      return distribute(n, w, h, (i, count) => {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        return {
          x: cx + Math.cos(angle) * rx * 0.7,
          y: cy + Math.sin(angle) * ry * 0.7,
        };
      });
    },
  },
  {
    id: 'circle',
    name: 'Circle',
    description: 'Circular arrangement',
    category: 'symmetric',
    minDancers: 3,
    generate: (n, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * (1 - 2 * M) / 2 * 0.8;
      return distribute(n, w, h, (i, count) => {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        return {
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
        };
      });
    },
  },
  {
    id: 'semicircle',
    name: 'Semicircle',
    description: 'Arc facing audience',
    category: 'symmetric',
    minDancers: 3,
    generate: (n, w, h) => {
      const cx = w / 2;
      const r = Math.min(w, h) * (1 - 2 * M) / 2 * 0.85;
      return distribute(n, w, h, (i, count) => {
        const angle = Math.PI + (i / (count - 1 || 1)) * Math.PI;
        return {
          x: cx + Math.cos(angle) * r,
          y: h * 0.55 + Math.sin(angle) * r * 0.8,
        };
      });
    },
  },
  {
    id: 'diagonal-left',
    name: 'Diagonal \\',
    description: 'Upstage-left to downstage-right',
    category: 'asymmetric',
    minDancers: 2,
    generate: (n, w, h) =>
      distribute(n, w, h, (i, count) => {
        const t = count === 1 ? 0.5 : i / (count - 1);
        return {
          x: w * M + t * w * (1 - 2 * M),
          y: h * M + t * h * (1 - 2 * M),
        };
      }),
  },
  {
    id: 'diagonal-right',
    name: 'Diagonal /',
    description: 'Upstage-right to downstage-left',
    category: 'asymmetric',
    minDancers: 2,
    generate: (n, w, h) =>
      distribute(n, w, h, (i, count) => {
        const t = count === 1 ? 0.5 : i / (count - 1);
        return {
          x: w * (1 - M) - t * w * (1 - 2 * M),
          y: h * M + t * h * (1 - 2 * M),
        };
      }),
  },
  {
    id: 'stagger',
    name: 'Stagger',
    description: 'Two offset rows (checkerboard)',
    category: 'symmetric',
    minDancers: 3,
    generate: (n, w, h) => {
      const frontCount = Math.ceil(n / 2);
      const backCount = n - frontCount;
      const positions: { x: number; y: number }[] = [];
      const rowGap = h * 0.2;

      // Front row
      for (let i = 0; i < frontCount; i++) {
        positions.push({
          x: frontCount === 1 ? w / 2 : w * M + (i / (frontCount - 1)) * w * (1 - 2 * M),
          y: h / 2 + rowGap / 2,
        });
      }
      // Back row — offset by half spacing
      const frontSpacing = frontCount > 1 ? w * (1 - 2 * M) / (frontCount - 1) : 0;
      const backStartX = backCount === 1 ? w / 2 : w * M + frontSpacing / 2;
      for (let i = 0; i < backCount; i++) {
        positions.push({
          x: backCount === 1 ? w / 2 : backStartX + (i / (backCount - 1)) * (w * (1 - 2 * M) - frontSpacing),
          y: h / 2 - rowGap / 2,
        });
      }
      return positions;
    },
  },
  {
    id: 'cluster',
    name: 'Cluster',
    description: 'Tight center grouping',
    category: 'symmetric',
    minDancers: 2,
    generate: (n, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      if (n === 1) return [{ x: cx, y: cy }];
      // Concentric rings — tight spacing
      const positions: { x: number; y: number }[] = [{ x: cx, y: cy }];
      let placed = 1;
      let ring = 1;
      const spacing = Math.min(w, h) * 0.06;
      while (placed < n) {
        const ringCount = Math.min(n - placed, ring * 6);
        for (let i = 0; i < ringCount && placed < n; i++) {
          const angle = (i / ringCount) * Math.PI * 2 - Math.PI / 2;
          positions.push({
            x: cx + Math.cos(angle) * spacing * ring,
            y: cy + Math.sin(angle) * spacing * ring,
          });
          placed++;
        }
        ring++;
      }
      return positions;
    },
  },
  {
    id: 'x-formation',
    name: 'X Shape',
    description: 'X / cross pattern',
    category: 'symmetric',
    minDancers: 5,
    generate: (n, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      const positions: { x: number; y: number }[] = [];
      // Center dancer
      positions.push({ x: cx, y: cy });
      // Distribute remaining along 4 arms
      const armCount = n - 1;
      const perArm = Math.ceil(armCount / 4);
      const armLength = Math.min(w, h) * (1 - 2 * M) / 2 * 0.85;
      const arms = [
        { dx: -1, dy: -1 }, // top-left
        { dx: 1, dy: -1 },  // top-right
        { dx: -1, dy: 1 },  // bottom-left
        { dx: 1, dy: 1 },   // bottom-right
      ];
      let placed = 0;
      for (const arm of arms) {
        const count = Math.min(perArm, armCount - placed);
        for (let i = 0; i < count; i++) {
          const t = (i + 1) / perArm;
          positions.push({
            x: cx + arm.dx * t * armLength,
            y: cy + arm.dy * t * armLength * (h / w),
          });
          placed++;
        }
      }
      return positions;
    },
  },
  {
    id: 'triangle',
    name: 'Triangle',
    description: 'Equilateral triangle',
    category: 'symmetric',
    minDancers: 3,
    generate: (n, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * (1 - 2 * M) / 2 * 0.8;
      // Three vertices, distribute dancers along the edges
      const vertices = [
        { x: cx, y: cy - r },                          // top
        { x: cx - r * Math.cos(Math.PI / 6), y: cy + r * Math.sin(Math.PI / 6) }, // bottom-left
        { x: cx + r * Math.cos(Math.PI / 6), y: cy + r * Math.sin(Math.PI / 6) }, // bottom-right
      ];

      if (n <= 3) {
        return vertices.slice(0, n);
      }

      // Distribute along 3 edges
      const positions: { x: number; y: number }[] = [];
      const perEdge = Math.ceil(n / 3);
      let placed = 0;
      for (let e = 0; e < 3 && placed < n; e++) {
        const from = vertices[e];
        const to = vertices[(e + 1) % 3];
        const edgeCount = Math.min(perEdge, n - placed);
        for (let i = 0; i < edgeCount; i++) {
          const t = edgeCount === 1 ? 0 : i / edgeCount; // don't include endpoint (next edge starts there)
          positions.push({
            x: from.x + t * (to.x - from.x),
            y: from.y + t * (to.y - from.y),
          });
          placed++;
        }
      }
      return positions;
    },
  },
  // ─── Asymmetric Templates ───
  {
    id: 'offset-lines',
    name: 'Offset Lines',
    description: 'Two rows, back row shifted right',
    category: 'asymmetric',
    minDancers: 4,
    generate: (n, w, h) => {
      const frontCount = Math.ceil(n / 2);
      const backCount = n - frontCount;
      const positions: { x: number; y: number }[] = [];
      const rowGap = h * 0.22;
      // Front row — left-weighted
      for (let i = 0; i < frontCount; i++) {
        positions.push({
          x: w * 0.1 + (i / Math.max(frontCount - 1, 1)) * w * 0.55,
          y: h / 2 + rowGap / 2,
        });
      }
      // Back row — right-weighted
      for (let i = 0; i < backCount; i++) {
        positions.push({
          x: w * 0.35 + (i / Math.max(backCount - 1, 1)) * w * 0.55,
          y: h / 2 - rowGap / 2,
        });
      }
      return positions;
    },
  },
  {
    id: 'scattered',
    name: 'Scattered',
    description: 'Organic, natural spacing',
    category: 'asymmetric',
    minDancers: 3,
    generate: (n, w, h) => {
      // Use a seeded pseudo-random so same count always gives same layout
      const positions: { x: number; y: number }[] = [];
      const seed = n * 7 + 13;
      for (let i = 0; i < n; i++) {
        const hash = ((seed * (i + 1) * 2654435761) >>> 0) / 4294967296;
        const hash2 = ((seed * (i + 1) * 2246822519) >>> 0) / 4294967296;
        positions.push({
          x: w * 0.12 + hash * w * 0.76,
          y: h * 0.12 + hash2 * h * 0.76,
        });
      }
      return positions;
    },
  },
  {
    id: 'wave',
    name: 'Wave',
    description: 'Flowing S-curve across stage',
    category: 'asymmetric',
    minDancers: 4,
    generate: (n, w, h) =>
      distribute(n, w, h, (i, count) => {
        const t = count === 1 ? 0.5 : i / (count - 1);
        return {
          x: w * M + t * w * (1 - 2 * M),
          y: h / 2 + Math.sin(t * Math.PI * 2) * h * 0.2,
        };
      }),
  },

  // ─── Soloist + Group Templates ───
  {
    id: 'solo-front',
    name: 'Solo Front',
    description: 'Soloist downstage, group behind',
    category: 'soloist',
    featuredCount: 1,
    minDancers: 3,
    generate: (n, w, h) => {
      const positions: { x: number; y: number }[] = [];
      // Soloist at front-center
      positions.push({ x: w / 2, y: h * 0.75 });
      // Group in a line behind
      const groupCount = n - 1;
      for (let i = 0; i < groupCount; i++) {
        positions.push({
          x: groupCount === 1 ? w / 2 : w * 0.15 + (i / (groupCount - 1)) * w * 0.7,
          y: h * 0.3,
        });
      }
      return positions;
    },
  },
  {
    id: 'solo-spotlight',
    name: 'Solo Spotlight',
    description: 'Soloist center, group in arc behind',
    category: 'soloist',
    featuredCount: 1,
    minDancers: 4,
    generate: (n, w, h) => {
      const positions: { x: number; y: number }[] = [];
      // Soloist at center-front
      positions.push({ x: w / 2, y: h * 0.65 });
      // Group in semicircle behind
      const groupCount = n - 1;
      const r = Math.min(w, h) * 0.32;
      for (let i = 0; i < groupCount; i++) {
        const angle = Math.PI + (i / (groupCount - 1 || 1)) * Math.PI;
        positions.push({
          x: w / 2 + Math.cos(angle) * r,
          y: h * 0.35 + Math.sin(angle) * r * 0.5,
        });
      }
      return positions;
    },
  },
  {
    id: 'solo-side',
    name: 'Solo Side',
    description: 'Soloist pulled stage-right, group left',
    category: 'soloist',
    featuredCount: 1,
    minDancers: 3,
    generate: (n, w, h) => {
      const positions: { x: number; y: number }[] = [];
      // Soloist stage-right, slightly forward
      positions.push({ x: w * 0.78, y: h * 0.6 });
      // Group in a cluster stage-left
      const groupCount = n - 1;
      const cx = w * 0.3;
      const cy = h * 0.45;
      if (groupCount === 1) {
        positions.push({ x: cx, y: cy });
      } else {
        for (let i = 0; i < groupCount; i++) {
          const angle = (i / groupCount) * Math.PI * 2 - Math.PI / 2;
          const r = Math.min(w, h) * 0.08 * Math.ceil((i + 1) / 6);
          positions.push({
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r,
          });
        }
      }
      return positions;
    },
  },

  // ─── Featured Group (Duet/Trio) Templates ───
  {
    id: 'duet-center',
    name: 'Duet Center',
    description: 'Duet downstage, group behind',
    category: 'featured',
    featuredCount: 2,
    minDancers: 4,
    generate: (n, w, h) => {
      const positions: { x: number; y: number }[] = [];
      // Duet at front
      positions.push({ x: w * 0.4, y: h * 0.72 });
      positions.push({ x: w * 0.6, y: h * 0.72 });
      // Group in a line behind
      const groupCount = n - 2;
      for (let i = 0; i < groupCount; i++) {
        positions.push({
          x: groupCount === 1 ? w / 2 : w * 0.15 + (i / (groupCount - 1)) * w * 0.7,
          y: h * 0.3,
        });
      }
      return positions;
    },
  },
  {
    id: 'trio-front',
    name: 'Trio Front',
    description: 'Trio downstage triangle, group behind',
    category: 'featured',
    featuredCount: 3,
    minDancers: 5,
    generate: (n, w, h) => {
      const positions: { x: number; y: number }[] = [];
      // Trio in small triangle at front
      positions.push({ x: w / 2, y: h * 0.75 });           // point
      positions.push({ x: w * 0.35, y: h * 0.6 });         // left
      positions.push({ x: w * 0.65, y: h * 0.6 });         // right
      // Group in a line behind
      const groupCount = n - 3;
      for (let i = 0; i < groupCount; i++) {
        positions.push({
          x: groupCount === 1 ? w / 2 : w * 0.15 + (i / (groupCount - 1)) * w * 0.7,
          y: h * 0.28,
        });
      }
      return positions;
    },
  },
  {
    id: 'duet-split',
    name: 'Duet Split',
    description: 'Duet on opposite sides, group center',
    category: 'featured',
    featuredCount: 2,
    minDancers: 4,
    generate: (n, w, h) => {
      const positions: { x: number; y: number }[] = [];
      // Duet on opposite sides
      positions.push({ x: w * 0.15, y: h * 0.5 });
      positions.push({ x: w * 0.85, y: h * 0.5 });
      // Group clustered in center
      const groupCount = n - 2;
      const cx = w / 2;
      const cy = h / 2;
      if (groupCount === 1) {
        positions.push({ x: cx, y: cy });
      } else {
        for (let i = 0; i < groupCount; i++) {
          const t = i / (groupCount - 1);
          positions.push({
            x: w * 0.3 + t * w * 0.4,
            y: cy - h * 0.05 + (i % 2 === 0 ? -1 : 1) * h * 0.08,
          });
        }
      }
      return positions;
    },
  },
];

// ─── Category Labels ───

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  symmetric: 'Symmetric',
  asymmetric: 'Asymmetric',
  soloist: 'Soloist + Group',
  featured: 'Duet / Trio',
};

// ─── Generate Positions ───

export function applyTemplate(
  templateId: string,
  dancerCount: number,
  stageWidth: number,
  stageDepth: number,
  formationId: string,
  options?: {
    roleAssignments?: RoleAssignment[];
    existingPositions?: { dancer_label: string; dancer_id: string | null; color: string }[];
  },
): DancerPositionInsert[] {
  const template = TEMPLATES.find((t) => t.id === templateId);
  if (!template) return [];

  const raw = template.generate(dancerCount, stageWidth, stageDepth);
  const colors = DANCER_COLORS;
  const existing = options?.existingPositions ?? [];
  const assignments = options?.roleAssignments ?? [];

  // Snap all generated positions to the stage number grid
  const result: DancerPositionInsert[] = raw.map((pos, i) => ({
    formation_id: formationId,
    dancer_id: null,
    dancer_label: generateLabel(i),
    x: snapCoord(pos.x),
    y: snapCoord(pos.y),
    color: colors[i % colors.length],
  }));

  if (assignments.length > 0 && existing.length > 0) {
    // Place role-assigned dancers at their specified template indices
    const assignedLabels = new Set<string>();
    for (const assignment of assignments) {
      const dancer = existing.find((p) => p.dancer_label === assignment.dancerLabel);
      if (dancer && assignment.positionIndex < result.length) {
        result[assignment.positionIndex].dancer_label = dancer.dancer_label;
        result[assignment.positionIndex].dancer_id = dancer.dancer_id;
        result[assignment.positionIndex].color = dancer.color;
        assignedLabels.add(dancer.dancer_label);
      }
    }

    // Fill remaining positions with unassigned dancers in their original order
    const assignedIndices = new Set(assignments.map((a) => a.positionIndex));
    const remainingDancers = existing.filter((p) => !assignedLabels.has(p.dancer_label));
    let remainIdx = 0;
    for (let i = 0; i < result.length; i++) {
      if (!assignedIndices.has(i) && remainIdx < remainingDancers.length) {
        const dancer = remainingDancers[remainIdx++];
        result[i].dancer_label = dancer.dancer_label;
        result[i].dancer_id = dancer.dancer_id;
        result[i].color = dancer.color;
      }
    }
  } else if (existing.length > 0) {
    // No role assignments but we have existing positions — preserve identity
    for (let i = 0; i < Math.min(result.length, existing.length); i++) {
      result[i].dancer_label = existing[i].dancer_label;
      result[i].dancer_id = existing[i].dancer_id;
      result[i].color = existing[i].color;
    }
  }

  return result;
}
