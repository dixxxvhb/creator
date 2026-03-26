import { useState, type RefObject } from 'react';
import type { Piece, Formation, DancerPosition } from '@/types';
import type { FormationCanvasHandle } from '@/components/canvas';
import type { ExportFormat } from '@/components/export/ExportModal';
import { exportPng } from '@/lib/exportImage';
import { exportPdf } from '@/lib/exportPdf';
import { useFormationStore } from '@/stores/formationStore';

export function usePieceExport(
  piece: Piece | undefined,
  formations: Formation[],
  positions: Record<string, DancerPosition[]>,
  canvasRef: RefObject<FormationCanvasHandle | null>,
) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [printData, setPrintData] = useState<{ stageImages: (string | null)[] } | null>(null);

  const activeFormationId = useFormationStore((s) => s.activeFormationId);
  const setActiveFormation = useFormationStore((s) => s.setActiveFormation);

  async function handleExport(format: ExportFormat) {
    if (!piece) return;
    setIsExporting(true);

    const activeFormation = formations.find((f) => f.id === activeFormationId);

    // Reset zoom to 1.0 so exports capture the full stage, not the current zoom level
    const savedZoom = canvasRef.current?.getZoom() ?? 1;
    if (canvasRef.current && savedZoom !== 1) {
      canvasRef.current.setZoom(1);
      await new Promise((r) => setTimeout(r, 100));
    }

    try {
      if (format === 'png') {
        if (canvasRef.current) {
          exportPng(canvasRef.current, `${piece.title}_${activeFormation?.label ?? 'formation'}`);
        }
      } else if (format === 'pdf' || format === 'print') {
        const stageImages: (string | null)[] = [];
        const originalActiveId = activeFormationId;

        for (const formation of formations) {
          setActiveFormation(formation.id);
          await new Promise((r) => setTimeout(r, 150));
          stageImages.push(canvasRef.current?.toDataURL(2) ?? null);
        }

        if (originalActiveId) setActiveFormation(originalActiveId);

        if (format === 'pdf') {
          exportPdf({ piece, formations, positions, stageImages });
        } else {
          setPrintData({ stageImages });
        }
      }
    } finally {
      if (canvasRef.current && savedZoom !== 1) {
        canvasRef.current.setZoom(savedZoom);
      }
      setIsExporting(false);
      setExportModalOpen(false);
    }
  }

  return {
    handleExport,
    isExporting,
    exportModalOpen,
    setExportModalOpen,
    printData,
    setPrintData,
  };
}
