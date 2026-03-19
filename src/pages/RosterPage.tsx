import { useEffect, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { DancerFormModal, DancerCard } from '@/components/roster';
import { useRosterStore } from '@/stores/rosterStore';
import { DANCER_COLORS } from '@/types';
import type { Dancer, DancerInsert } from '@/types';

export function RosterPage() {
  const dancers = useRosterStore((s) => s.dancers);
  const pieceAssignments = useRosterStore((s) => s.pieceAssignments);
  const isLoading = useRosterStore((s) => s.isLoading);
  const load = useRosterStore((s) => s.load);
  const add = useRosterStore((s) => s.add);
  const update = useRosterStore((s) => s.update);
  const remove = useRosterStore((s) => s.remove);

  const [formOpen, setFormOpen] = useState(false);
  const [editingDancer, setEditingDancer] = useState<Dancer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Dancer | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  // Next unused color for new dancers
  const usedColors = new Set(dancers.map((d) => d.color));
  const nextColor = DANCER_COLORS.find((c) => !usedColors.has(c)) ?? DANCER_COLORS[0];

  function handleAdd() {
    setEditingDancer(null);
    setFormOpen(true);
  }

  function handleEdit(dancer: Dancer) {
    setEditingDancer(dancer);
    setFormOpen(true);
  }

  async function handleSave(data: DancerInsert) {
    if (editingDancer) {
      await update(editingDancer.id, data);
    } else {
      await add(data);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    await remove(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <PageContainer
      title="Roster"
      actions={
        <Button onClick={handleAdd}>
          <Plus size={16} />
          Add Dancer
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : dancers.length === 0 ? (
        <Card className="text-center py-12">
          <Users size={40} className="mx-auto text-text-tertiary mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No dancers yet</h3>
          <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">
            Add dancers to your roster to assign them to pieces and formations.
          </p>
          <Button onClick={handleAdd}>
            <Plus size={16} />
            Add Dancer
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dancers.map((dancer) => (
            <DancerCard
              key={dancer.id}
              dancer={dancer}
              pieces={pieceAssignments[dancer.id] ?? []}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <DancerFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        dancer={editingDancer}
        defaultColor={nextColor}
      />

      {/* Delete confirmation */}
      <Modal
        open={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Dancer"
      >
        <p className="text-sm text-text-primary mb-4">
          Remove <strong>{deleteTarget?.full_name}</strong> from the roster? They will be unassigned from all formations.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
}
