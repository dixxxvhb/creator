import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ClipboardList } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { PieceSetupForm } from '@/components/pieces';
import { usePieceStore } from '@/stores/pieceStore';
import { useFormationStore } from '@/stores/formationStore';
import type { PieceInsert, DancerPositionInsert } from '@/types';
import { DANCER_COLORS } from '@/types';
import { generateLabel } from '@/lib/formationTemplates';

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
  const [mode, setMode] = useState<'choose' | 'full'>('choose');

  async function handleQuickStart() {
    setIsSubmitting(true);
    try {
      const data: PieceInsert = {
        title: 'Untitled Piece',
        style: 'Contemporary',
        group_size: 'small-group',
        dancer_count: 0,
        song_title: null,
        song_artist: null,
        bpm: null,
        duration_seconds: null,
        audio_url: null,
        stage_width: 40,
        stage_depth: 30,
        notes: '',
        sort_order: 0,
      };

      const piece = await addPiece(data);
      if (!piece) {
        setIsSubmitting(false);
        return;
      }

      // Create first formation (empty — no dancers yet)
      await addFormation({
        piece_id: piece.id,
        index: 0,
        label: 'Formation 1',
        timestamp_seconds: null,
        choreo_notes: '',
        counts_notes: '',
        transition_duration_ms: 2000,
        transition_easing: 'ease-in-out',
      });

      navigate(`/pieces/${piece.id}`);
    } catch {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(data: PieceInsert, groupSize: string, selectedDancerIds: string[]) {
    setIsSubmitting(true);
    try {
      const piece = await addPiece(data);
      if (!piece) {
        setIsSubmitting(false);
        return;
      }

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
        const starterPositions = generateStarterPositions(
          piece.dancer_count,
          groupSize,
          piece.stage_width,
          piece.stage_depth,
        );

        const positionInserts: DancerPositionInsert[] = starterPositions.map((pos, i) => ({
          formation_id: formation.id,
          dancer_id: selectedDancerIds[i] ?? null,
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

  if (mode === 'choose') {
    return (
      <PageContainer title="New Piece">
        <div className="max-w-xl mx-auto space-y-4 pt-4">
          <button
            onClick={handleQuickStart}
            disabled={isSubmitting}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-[var(--color-accent)] accent-bg-light hover:brightness-105 transition-all text-left group"
          >
            <div className="p-3 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] shrink-0">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-base font-semibold text-text-primary">Quick Start</p>
              <p className="text-sm text-text-secondary mt-0.5">
                Jump straight to the canvas. Add title, dancers, and details later.
              </p>
            </div>
          </button>

          <button
            onClick={() => setMode('full')}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border border-border hover:border-text-tertiary hover:bg-surface-secondary/50 transition-all text-left"
          >
            <div className="p-3 rounded-xl bg-surface-secondary text-text-secondary shrink-0">
              <ClipboardList size={24} />
            </div>
            <div>
              <p className="text-base font-semibold text-text-primary">Full Setup</p>
              <p className="text-sm text-text-secondary mt-0.5">
                Set title, style, dancers, song info, and stage size upfront.
              </p>
            </div>
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="New Piece">
      <PieceSetupForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </PageContainer>
  );
}
