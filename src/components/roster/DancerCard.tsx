import { Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { computeAge } from '@/lib/age';
import type { Dancer } from '@/types';

interface DancerCardProps {
  dancer: Dancer;
  pieces: { id: string; title: string }[];
  onEdit: (dancer: Dancer) => void;
  onDelete: (dancer: Dancer) => void;
}

export function DancerCard({ dancer, pieces, onEdit, onDelete }: DancerCardProps) {
  const age = computeAge(dancer.birthday);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-4 h-4 rounded-full shrink-0"
            style={{ backgroundColor: dancer.color }}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">
              {dancer.full_name}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {dancer.short_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(dancer)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
            title="Edit dancer"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(dancer)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
            title="Delete dancer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="text-xs text-slate-400">
        {age !== null ? (
          <span>Age {age}{dancer.birthday ? ` (${dancer.birthday})` : ''}</span>
        ) : (
          <span className="text-slate-500">No birthday</span>
        )}
      </div>

      {pieces.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {pieces.map((p) => (
            <Badge key={p.id} variant="info">
              {p.title}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">No pieces assigned</p>
      )}
    </Card>
  );
}
