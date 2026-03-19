import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout';
import { PieceSetupForm } from '@/components/pieces';
import { usePieceStore } from '@/stores/pieceStore';
import { useFormationStore } from '@/stores/formationStore';
import type { PieceInsert, DancerPositionInsert } from '@/types';
import { DANCER_COLORS } from '@/types';

function generateLabel(i: number): string {
  if (i < 26) return String.fromCharCode(65 + i);
  return (
    String.fromCharCode(65 + Math.floor(i / 26) - 1) +
    String.fromCharCode(65 + (i % 26))
  );
}

function generateStarterPositions(
  dancerCount: number,
  _groupSize: string,
  stageWidth: number,
  stageDepth: number,
): Array<{ dancer_label: string; x: number; y: number; color: string }> {
  const colors = DANCER_COLORS;
  const centerX = stageWidth / 2;
  const centerY = stageDepth / 2;

  if (dancerCount === 1) {
    return [{ dancer_label: generateLabel(0), x: centerX, y: centerY, color: colors[0] }];
  }

  if (dancerCount === 2) {
    const spacing = stageWidth * 0.15;
    return [
      { dancer_label: generateLabel(0), x: centerX - spacing, y: centerY, color: colors[0] },
      { dancer_label: generateLabel(1), x: centerX + spacing, y: centerY, color: colors[1] },
    ];
  }

  if (dancerCount === 3) {
    const spreadX = stageWidth * 0.15;
    const spreadY = stageDepth * 0.12;
    return [
      { dancer_label: generateLabel(0), x: centerX, y: centerY - spreadY, color: colors[0] },
      { dancer_label: generateLabel(1), x: centerX - spreadX, y: centerY + spreadY, color: colors[1] },
      { dancer_label: generateLabel(2), x: centerX + spreadX, y: centerY + spreadY, color: colors[2] },
    ];
  }

  if (dancerCount <= 7) {
    const positions = [];
    const totalSpreadX = stageWidth * 0.6;
    const totalSpreadY = stageDepth * 0.4;
    for (let i = 0; i < dancerCount; i++) {
      const t = dancerCount > 1 ? i / (dancerCount - 1) : 0.5;
      positions.push({
        dancer_label: generateLabel(i),
        x: centerX - totalSpreadX / 2 + t * totalSpreadX,
        y: centerY - totalSpreadY / 2 + t * totalSpreadY,
        color: colors[i % colors.length],
      });
    }
    return positions;
  }

  // Large group: two-row staggered
  const positions = [];
  const frontRow = Math.ceil(dancerCount / 2);
  const backRow = dancerCount - frontRow;
  const rowSpacing = stageDepth * 0.15;

  for (let i = 0; i < frontRow; i++) {
    const t = frontRow > 1 ? i / (frontRow - 1) : 0.5;
    const spreadX = stageWidth * 0.7;
    positions.push({
      dancer_label: generateLabel(i),
      x: centerX - spreadX / 2 + t * spreadX,
      y: centerY + rowSpacing / 2,
      color: colors[i % colors.length],
    });
  }

  for (let i = 0; i < backRow; i++) {
    const t = backRow > 1 ? i / (backRow - 1) : 0.5;
    const spreadX = stageWidth * 0.6;
    positions.push({
      dancer_label: generateLabel(frontRow + i),
      x: centerX - spreadX / 2 + t * spreadX,
      y: centerY - rowSpacing / 2,
      color: colors[(frontRow + i) % colors.length],
    });
  }

  return positions;
}

export function PieceSetupPage() {
  const navigate = useNavigate();
  const addPiece = usePieceStore((s) => s.add);
  const addFormation = useFormationStore((s) => s.addFormation);
  const savePositions = useFormationStore((s) => s.savePositions);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(data: PieceInsert, groupSize: string) {
    setIsSubmitting(true);
    try {
      const piece = await addPiece(data);
      if (!piece) {
        setIsSubmitting(false);
        return;
      }

      // Create first formation
      const formation = await addFormation({
        piece_id: piece.id,
        index: 0,
        label: 'Formation 1',
        timestamp_seconds: null,
        choreo_notes: '',
        counts_notes: '',
        transition_duration_ms: 2000,
        transition_easing: 'ease-in-out',
      });

      if (formation) {
        // Generate starter positions
        const starterPositions = generateStarterPositions(
          piece.dancer_count,
          groupSize,
          piece.stage_width,
          piece.stage_depth,
        );

        const positionInserts: DancerPositionInsert[] = starterPositions.map((pos) => ({
          formation_id: formation.id,
          dancer_id: null,
          dancer_label: pos.dancer_label,
          x: pos.x,
          y: pos.y,
          color: pos.color,
        }));

        await savePositions(formation.id, positionInserts);
      }

      navigate(`/pieces/${piece.id}`);
    } catch {
      setIsSubmitting(false);
    }
  }

  return (
    <PageContainer title="New Piece">
      <PieceSetupForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </PageContainer>
  );
}
