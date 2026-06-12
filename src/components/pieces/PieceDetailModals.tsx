import { Spinner } from '@/components/ui/Spinner';
import { AddDancerModal } from '@/components/canvas/AddDancerModal';
import { PieceInfoModal } from '@/components/canvas/PieceInfoModal';
import { DancerManageModal } from '@/components/canvas/DancerManageModal';
import { TemplatePickerModal } from '@/components/canvas';
import { ExportModal } from '@/components/export/ExportModal';
import { PrintView } from '@/components/export/PrintView';
import { KeyboardShortcutsModal } from '@/components/ui/KeyboardShortcutsModal';
import { ShareModal } from '@/components/pieces/ShareModal';
import type { AddDancerParams } from '@/components/canvas/AddDancerModal';
import type { RoleAssignment } from '@/lib/formationTemplates';
import type { Piece, PieceUpdate, Formation, DancerPosition, Dancer } from '@/types';
import type { ExportFormat } from '@/components/export/ExportModal';

type PrintData = { stageImages: (string | null)[] };

/**
 * Every overlay PieceDetailPage can show. Pure wiring — a wide but dumb
 * interface; all state and handlers live in the page.
 */
interface PieceDetailModalsProps {
  piece: Piece;
  formations: Formation[];
  positions: Record<string, DancerPosition[]>;
  activePositions: DancerPosition[];
  activeIdx: number;
  activeFormationId: string | null;
  rosterDancers: Dancer[];
  assignedDancerIds: Set<string>;

  addDancerOpen: boolean;
  templatePickerOpen: boolean;
  dancerManageOpen: boolean;
  pieceInfoOpen: boolean;
  exportModalOpen: boolean;
  shortcutsOpen: boolean;
  shareModalOpen: boolean;
  onCloseAddDancer: () => void;
  onCloseTemplatePicker: () => void;
  onCloseDancerManage: () => void;
  onClosePieceInfo: () => void;
  onCloseExportModal: () => void;
  onCloseShortcuts: () => void;
  onCloseShareModal: () => void;

  onAddDancers: (params: AddDancerParams) => Promise<void>;
  onApplyTemplate: (templateId: string, roleAssignments?: RoleAssignment[]) => Promise<void>;
  onAssign: (formationId: string, positionId: string, dancerId: string | null, color?: string) => void;
  onOpenAddDancer: () => void;
  onRemoveDancer: () => void;
  onSavePieceInfo: (updates: PieceUpdate) => Promise<void>;
  onExport: (format: ExportFormat) => void;
  isExporting: boolean;
  printData: PrintData | null;
  onClosePrint: () => void;
}

export function PieceDetailModals({
  piece,
  formations,
  positions,
  activePositions,
  activeIdx,
  activeFormationId,
  rosterDancers,
  assignedDancerIds,
  addDancerOpen,
  templatePickerOpen,
  dancerManageOpen,
  pieceInfoOpen,
  exportModalOpen,
  shortcutsOpen,
  shareModalOpen,
  onCloseAddDancer,
  onCloseTemplatePicker,
  onCloseDancerManage,
  onClosePieceInfo,
  onCloseExportModal,
  onCloseShortcuts,
  onCloseShareModal,
  onAddDancers,
  onApplyTemplate,
  onAssign,
  onOpenAddDancer,
  onRemoveDancer,
  onSavePieceInfo,
  onExport,
  isExporting,
  printData,
  onClosePrint,
}: PieceDetailModalsProps) {
  return (
    <>
      <AddDancerModal
        open={addDancerOpen}
        onClose={onCloseAddDancer}
        rosterDancers={rosterDancers}
        assignedDancerIds={assignedDancerIds}
        formations={formations}
        activeFormationIndex={activeIdx}
        onAddDancers={onAddDancers}
      />

      <TemplatePickerModal
        open={templatePickerOpen}
        onClose={onCloseTemplatePicker}
        onSelect={onApplyTemplate}
        dancerCount={piece.dancer_count}
        hasExistingPositions={activePositions.length > 0}
        currentPositions={activePositions.map((p) => ({
          dancer_label: p.dancer_label,
          dancer_id: p.dancer_id,
          color: p.color,
        }))}
        rosterDancers={rosterDancers}
      />

      <DancerManageModal
        open={dancerManageOpen}
        onClose={onCloseDancerManage}
        positions={activePositions}
        rosterDancers={rosterDancers}
        dancerCount={piece.dancer_count}
        onAssign={onAssign}
        activeFormationId={activeFormationId}
        onAddDancer={onOpenAddDancer}
        onRemoveDancer={onRemoveDancer}
      />

      <PieceInfoModal
        open={pieceInfoOpen}
        onClose={onClosePieceInfo}
        piece={piece}
        onSave={onSavePieceInfo}
      />

      <ExportModal
        open={exportModalOpen}
        onClose={onCloseExportModal}
        onExport={onExport}
        isExporting={isExporting}
        formationCount={formations.length}
      />

      <KeyboardShortcutsModal
        open={shortcutsOpen}
        onClose={onCloseShortcuts}
      />

      <ShareModal
        open={shareModalOpen}
        onClose={onCloseShareModal}
        pieceId={piece.id}
        pieceTitle={piece.title}
      />

      {printData && (
        <PrintView
          piece={piece}
          formations={formations}
          positions={positions}
          stageImages={printData.stageImages}
          onClose={onClosePrint}
        />
      )}

      {/* Export overlay */}
      {isExporting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <p className="text-sm font-medium text-white">Exporting...</p>
          </div>
        </div>
      )}
    </>
  );
}
