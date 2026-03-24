import { useEffect, useState } from 'react';
import {
  Plus, Shirt, Pencil, Trash2, Users, ChevronDown, ChevronUp,
  Package, DollarSign,
} from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Select } from '@/components/ui/Select';
import { CostumeFormModal } from '@/components/costumes/CostumeFormModal';
import { PropFormModal } from '@/components/costumes/PropFormModal';
import { AssignDancersModal } from '@/components/costumes/AssignDancersModal';
import { useCostumeStore } from '@/stores/costumeStore';
import { usePieceStore } from '@/stores/pieceStore';
import { useRosterStore } from '@/stores/rosterStore';
import type { Costume, CostumeInsert, CostumeUpdate, PropInsert, Prop as PropType, CostumeStatus } from '@/types';
import { COSTUME_STATUSES } from '@/types';
import { cn } from '@/lib/utils';
import { TierGate } from '@/components/ui/TierGate';

type ViewMode = 'by-piece' | 'by-dancer';

const STATUS_COLORS: Record<string, string> = {
  needed: 'text-text-tertiary',
  ordered: 'text-yellow-500',
  received: 'text-blue-400',
  altered: 'text-purple-400',
  ready: 'text-green-500',
};

export function CostumesPage() {
  const costumes = useCostumeStore((s) => s.costumes);
  const assignments = useCostumeStore((s) => s.assignments);
  const props = useCostumeStore((s) => s.props);
  const isLoading = useCostumeStore((s) => s.isLoading);
  const loadCostumes = useCostumeStore((s) => s.load);
  const addCostume = useCostumeStore((s) => s.addCostume);
  const updateCostume = useCostumeStore((s) => s.updateCostume);
  const removeCostume = useCostumeStore((s) => s.removeCostume);
  const addAssignment = useCostumeStore((s) => s.addAssignment);
  const updateAssignment = useCostumeStore((s) => s.updateAssignment);
  const removeAssignment = useCostumeStore((s) => s.removeAssignment);
  const addProp = useCostumeStore((s) => s.addProp);
  const removeProp = useCostumeStore((s) => s.removeProp);

  const pieces = usePieceStore((s) => s.pieces);
  const loadPieces = usePieceStore((s) => s.load);
  const dancers = useRosterStore((s) => s.dancers);
  const loadRoster = useRosterStore((s) => s.load);

  const [viewMode, setViewMode] = useState<ViewMode>('by-piece');
  const [showCostumeForm, setShowCostumeForm] = useState(false);
  const [editCostume, setEditCostume] = useState<Costume | null>(null);
  const [showPropForm, setShowPropForm] = useState(false);
  const [editProp, setEditProp] = useState<PropType | null>(null);
  const [assignModalCostumeId, setAssignModalCostumeId] = useState<string | null>(null);
  const [expandedPieces, setExpandedPieces] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadCostumes();
    if (pieces.length === 0) loadPieces();
    if (dancers.length === 0) loadRoster();
  }, [loadCostumes, pieces.length, loadPieces, dancers.length, loadRoster]);

  useEffect(() => {
    const piecesWithCostumes = new Set(costumes.map((c) => c.piece_id));
    props.forEach((p) => piecesWithCostumes.add(p.piece_id));
    setExpandedPieces(piecesWithCostumes);
  }, [costumes, props]);

  function togglePiece(pieceId: string) {
    setExpandedPieces((prev) => {
      const next = new Set(prev);
      next.has(pieceId) ? next.delete(pieceId) : next.add(pieceId);
      return next;
    });
  }

  async function handleCostumeSubmit(data: CostumeInsert) {
    if (editCostume) {
      await updateCostume(editCostume.id, data as CostumeUpdate);
      setEditCostume(null);
    } else {
      await addCostume(data);
    }
  }

  async function handlePropSubmit(data: PropInsert) {
    if (editProp) {
      await useCostumeStore.getState().updateProp(editProp.id, data);
      setEditProp(null);
    } else {
      await addProp(data);
    }
  }

  function handleDancerToggle(costumeId: string, dancerId: string, assigned: boolean) {
    if (assigned) {
      const assignment = assignments.find((a) => a.costume_id === costumeId && a.dancer_id === dancerId);
      if (assignment) removeAssignment(assignment.id);
    } else {
      addAssignment({ costume_id: costumeId, dancer_id: dancerId, size: '', alteration_notes: '', status: 'needed' });
    }
  }

  function getDancerName(dancerId: string) {
    const d = dancers.find((d) => d.id === dancerId);
    return d?.short_name || d?.full_name || 'Unknown';
  }

  function getPieceTitle(pieceId: string) {
    return pieces.find((p) => p.id === pieceId)?.title ?? 'Unknown';
  }

  function formatCost(cost: number | null) {
    if (cost == null) return '';
    return `$${cost.toFixed(2)}`;
  }

  const totalCostumeCost = costumes.reduce((sum, c) => sum + (c.cost ?? 0), 0);
  const totalPropCost = props.reduce((sum, p) => sum + (p.cost ?? 0) * p.quantity, 0);
  const totalBudget = totalCostumeCost + totalPropCost;

  const assignModalCostume = assignModalCostumeId ? costumes.find((c) => c.id === assignModalCostumeId) : null;

  return (
    <PageContainer title="Costumes & Props">
      <TierGate feature="costumes">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('by-piece')}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              viewMode === 'by-piece' ? 'accent-bg-light accent-text font-medium' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            By Piece
          </button>
          <button
            onClick={() => setViewMode('by-dancer')}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              viewMode === 'by-dancer' ? 'accent-bg-light accent-text font-medium' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            By Dancer
          </button>
        </div>
        <div className="flex items-center gap-2">
          {totalBudget > 0 && (
            <Badge variant="default" className="text-xs">
              <DollarSign size={10} className="mr-0.5" />
              {totalBudget.toFixed(2)} total
            </Badge>
          )}
          <Button size="sm" variant="secondary" onClick={() => { setEditProp(null); setShowPropForm(true); }}>
            <Package size={14} /> Add Prop
          </Button>
          <Button size="sm" onClick={() => { setEditCostume(null); setShowCostumeForm(true); }}>
            <Plus size={14} /> Add Costume
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : costumes.length === 0 && props.length === 0 ? (
        <Card className="text-center py-12">
          <Shirt size={40} className="mx-auto text-text-tertiary mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No costumes or props yet</h3>
          <p className="text-sm text-text-tertiary max-w-md mx-auto mb-4">
            Track costumes, sizes, alterations, and props for every piece.
          </p>
          <Button onClick={() => setShowCostumeForm(true)}>
            <Plus size={14} /> Add Costume
          </Button>
        </Card>
      ) : viewMode === 'by-piece' ? (
        <div className="space-y-4">
          {pieces.map((piece) => {
            const pieceCostumes = costumes.filter((c) => c.piece_id === piece.id);
            const pieceProps = props.filter((p) => p.piece_id === piece.id);
            if (pieceCostumes.length === 0 && pieceProps.length === 0) return null;
            const isExpanded = expandedPieces.has(piece.id);
            const pieceCost = pieceCostumes.reduce((s, c) => s + (c.cost ?? 0), 0) + pieceProps.reduce((s, p) => s + (p.cost ?? 0) * p.quantity, 0);

            return (
              <Card key={piece.id}>
                <button onClick={() => togglePiece(piece.id)} className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text-primary">{piece.title}</h3>
                    <Badge variant="info" className="text-[10px]">{pieceCostumes.length} costume{pieceCostumes.length !== 1 ? 's' : ''}</Badge>
                    {pieceProps.length > 0 && <Badge className="text-[10px]">{pieceProps.length} prop{pieceProps.length !== 1 ? 's' : ''}</Badge>}
                    {pieceCost > 0 && <span className="text-xs text-text-tertiary">{formatCost(pieceCost)}</span>}
                  </div>
                  {isExpanded ? <ChevronUp size={14} className="text-text-tertiary" /> : <ChevronDown size={14} className="text-text-tertiary" />}
                </button>

                {isExpanded && (
                  <div className="mt-4 space-y-3">
                    {pieceCostumes.map((costume) => {
                      const costumeAssignments = assignments.filter((a) => a.costume_id === costume.id);
                      return (
                        <div key={costume.id} className="p-3 rounded-xl bg-surface-secondary/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {costume.color && (
                                <span className="w-4 h-4 rounded-full shrink-0 border border-border" style={{ backgroundColor: costume.color }} />
                              )}
                              <span className="text-sm font-medium text-text-primary">{costume.name}</span>
                              {costume.cost != null && <span className="text-xs text-text-tertiary">{formatCost(costume.cost)}</span>}
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => setAssignModalCostumeId(costume.id)} className="p-1 text-text-tertiary hover:text-text-secondary transition-colors" title="Assign dancers">
                                <Users size={12} />
                              </button>
                              <button onClick={() => { setEditCostume(costume); setShowCostumeForm(true); }} className="p-1 text-text-tertiary hover:text-text-secondary transition-colors">
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={() => { if (deleteConfirm === costume.id) { removeCostume(costume.id); setDeleteConfirm(null); } else setDeleteConfirm(costume.id); }}
                                onBlur={() => setDeleteConfirm(null)}
                                className="p-1 text-text-tertiary hover:text-danger-500 transition-colors"
                              >
                                <Trash2 size={12} className={deleteConfirm === costume.id ? 'text-danger-500' : ''} />
                              </button>
                            </div>
                          </div>
                          {costume.description && <p className="text-xs text-text-tertiary">{costume.description}</p>}

                          {costumeAssignments.length > 0 && (
                            <div className="space-y-1">
                              {costumeAssignments.map((a) => (
                                <div key={a.id} className="flex items-center gap-2 text-xs">
                                  <span className="text-text-primary font-medium">{getDancerName(a.dancer_id)}</span>
                                  {a.size && <span className="text-text-tertiary">Size: {a.size}</span>}
                                  <Select
                                    options={COSTUME_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                                    value={a.status}
                                    onChange={(e) => updateAssignment(a.id, { status: e.target.value as CostumeStatus })}
                                    className={cn('text-xs py-0.5 px-1.5 h-6 w-24', STATUS_COLORS[a.status])}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {pieceProps.length > 0 && (
                      <div className="pt-2 border-t border-border">
                        <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Props</h4>
                        {pieceProps.map((prop) => (
                          <div key={prop.id} className="flex items-center justify-between text-sm py-1">
                            <div className="flex items-center gap-2">
                              <Package size={12} className="text-text-tertiary" />
                              <span className="text-text-primary">{prop.name}</span>
                              <span className="text-xs text-text-tertiary">x{prop.quantity}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {prop.cost != null && <span className="text-xs text-text-tertiary">{formatCost(prop.cost * prop.quantity)}</span>}
                              <button
                                onClick={() => { if (deleteConfirm === prop.id) { removeProp(prop.id); setDeleteConfirm(null); } else setDeleteConfirm(prop.id); }}
                                onBlur={() => setDeleteConfirm(null)}
                                className="p-0.5 text-text-tertiary hover:text-danger-500 transition-colors"
                              >
                                <Trash2 size={10} className={deleteConfirm === prop.id ? 'text-danger-500' : ''} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {dancers.map((dancer) => {
            const dancerAssignments = assignments.filter((a) => a.dancer_id === dancer.id);
            if (dancerAssignments.length === 0) return null;
            return (
              <Card key={dancer.id}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: dancer.color }} />
                  <h3 className="text-sm font-semibold text-text-primary">{dancer.full_name}</h3>
                  <Badge variant="info" className="text-[10px]">{dancerAssignments.length}</Badge>
                </div>
                <div className="space-y-1.5">
                  {dancerAssignments.map((a) => {
                    const costume = costumes.find((c) => c.id === a.costume_id);
                    if (!costume) return null;
                    return (
                      <div key={a.id} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-surface-secondary/50">
                        {costume.color && (
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: costume.color }} />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-text-primary">{costume.name}</span>
                          <span className="text-text-tertiary text-xs ml-2">{getPieceTitle(costume.piece_id)}</span>
                        </div>
                        {a.size && <span className="text-xs text-text-tertiary">Size: {a.size}</span>}
                        <span className={cn('text-xs font-medium capitalize', STATUS_COLORS[a.status])}>{a.status}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
          {dancers.every((d) => assignments.filter((a) => a.dancer_id === d.id).length === 0) && (
            <Card className="text-center py-8">
              <p className="text-sm text-text-tertiary">No dancer assignments yet. Assign dancers to costumes in the "By Piece" view.</p>
            </Card>
          )}
        </div>
      )}

      <CostumeFormModal
        open={showCostumeForm}
        onClose={() => { setShowCostumeForm(false); setEditCostume(null); }}
        onSubmit={handleCostumeSubmit}
        pieces={pieces}
        costume={editCostume}
      />
      <PropFormModal
        open={showPropForm}
        onClose={() => { setShowPropForm(false); setEditProp(null); }}
        onSubmit={handlePropSubmit}
        pieces={pieces}
        prop={editProp}
      />
      {assignModalCostume && (
        <AssignDancersModal
          open={!!assignModalCostumeId}
          onClose={() => setAssignModalCostumeId(null)}
          dancers={dancers}
          assignments={assignments.filter((a) => a.costume_id === assignModalCostume.id)}
          onToggle={(dancerId, assigned) => handleDancerToggle(assignModalCostume.id, dancerId, assigned)}
        />
      )}
      </TierGate>
    </PageContainer>
  );
}
