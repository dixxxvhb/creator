import { supabase } from '@/lib/supabase';

export interface ShowConflict {
  actIndex1: number;
  actIndex2: number;
  dancerIds: string[];
  gap: number;
  requiredGap: number;
}

/**
 * Detect quick-change conflicts: dancers appearing in two acts
 * within `bufferActs` acts of each other.
 */
export function detectConflicts(
  orderedPieceIds: string[],
  pieceDancerMap: Map<string, Set<string>>,
  bufferActs: number,
): ShowConflict[] {
  const conflicts: ShowConflict[] = [];

  for (let i = 0; i < orderedPieceIds.length; i++) {
    const dancersA = pieceDancerMap.get(orderedPieceIds[i]);
    if (!dancersA || dancersA.size === 0) continue;

    for (let j = i + 1; j < orderedPieceIds.length && j <= i + bufferActs; j++) {
      const dancersB = pieceDancerMap.get(orderedPieceIds[j]);
      if (!dancersB || dancersB.size === 0) continue;

      const shared: string[] = [];
      for (const d of dancersA) {
        if (dancersB.has(d)) shared.push(d);
      }

      if (shared.length > 0) {
        conflicts.push({
          actIndex1: i,
          actIndex2: j,
          dancerIds: shared,
          gap: j - i,
          requiredGap: bufferActs,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Build a map of pieceId -> Set<dancerId> by querying formations and dancer_positions.
 */
export async function buildPieceDancerMap(
  pieceIds: string[],
): Promise<Map<string, Set<string>>> {
  const map = new Map<string, Set<string>>();
  if (pieceIds.length === 0) return map;

  for (const pid of pieceIds) {
    if (!map.has(pid)) map.set(pid, new Set());
  }

  // 1. Get all formations for the given pieces
  const { data: formations, error: fErr } = await supabase
    .from('formations')
    .select('id, piece_id')
    .in('piece_id', pieceIds);

  if (fErr || !formations || formations.length === 0) return map;

  // Build formation_id -> piece_id lookup
  const formationToPiece = new Map<string, string>();
  const formationIds: string[] = [];
  for (const f of formations) {
    formationToPiece.set(f.id, f.piece_id);
    formationIds.push(f.id);
  }

  // 2. Get all dancer positions with non-null dancer_id
  const batchSize = 200;
  for (let i = 0; i < formationIds.length; i += batchSize) {
    const batch = formationIds.slice(i, i + batchSize);
    const { data: positions, error: pErr } = await supabase
      .from('dancer_positions')
      .select('formation_id, dancer_id')
      .in('formation_id', batch)
      .not('dancer_id', 'is', null);

    if (pErr || !positions) continue;

    for (const pos of positions) {
      const pieceId = formationToPiece.get(pos.formation_id);
      if (pieceId && pos.dancer_id) {
        map.get(pieceId)!.add(pos.dancer_id);
      }
    }
  }

  return map;
}
