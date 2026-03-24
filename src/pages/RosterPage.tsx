import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SearchInput } from '@/components/shared/SearchInput';
import { DancerFormModal, DancerCard } from '@/components/roster';
import { useRosterStore } from '@/stores/rosterStore';
import { DANCER_COLORS } from '@/types';
import { TierGate } from '@/components/ui/TierGate';
import { staggerContainer, staggerItem } from '@/lib/motion';
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
  const [search, setSearch] = useState('');

  useEffect(() => {
    load();
  }, [load]);

  const usedColors = new Set(dancers.map((d) => d.color));
  const nextColor = DANCER_COLORS.find((c) => !usedColors.has(c)) ?? DANCER_COLORS[0];

  const filtered = useMemo(() => {
    if (!search.trim()) return dancers;
    const q = search.toLowerCase();
    return dancers.filter(
      (d) =>
        d.full_name.toLowerCase().includes(q) ||
        (d.short_name && d.short_name.toLowerCase().includes(q)),
    );
  }, [dancers, search]);

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
      <TierGate feature="roster">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : dancers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No dancers yet"
            description="Add dancers to your roster to assign them to pieces, formations, and costumes."
            action={
              <Button onClick={handleAdd}>
                <Plus size={16} />
                Add Your First Dancer
              </Button>
            }
          />
        ) : (
          <>
            {dancers.length > 5 && (
              <div className="mb-6">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search dancers..."
                  className="max-w-md"
                />
              </div>
            )}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {filtered.map((dancer) => (
                <motion.div key={dancer.id} variants={staggerItem}>
                  <DancerCard
                    dancer={dancer}
                    pieces={pieceAssignments[dancer.id] ?? []}
                    onEdit={handleEdit}
                    onDelete={setDeleteTarget}
                  />
                </motion.div>
              ))}
            </motion.div>
            {search && filtered.length === 0 && (
              <p className="text-center text-sm text-text-tertiary py-12">
                No dancers match "{search}"
              </p>
            )}
          </>
        )}

        <DancerFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSave={handleSave}
          dancer={editingDancer}
          defaultColor={nextColor}
        />

        <ConfirmDialog
          open={deleteTarget != null}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Dancer"
          description={`Remove ${deleteTarget?.full_name ?? 'this dancer'} from the roster? They will be unassigned from all formations.`}
          confirmLabel="Delete"
        />
      </TierGate>
    </PageContainer>
  );
}
