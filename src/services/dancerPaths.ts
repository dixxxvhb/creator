import { supabase } from '@/lib/supabase';
import type { DancerPath, PathPoint } from '@/types';

export async function fetchPaths(formationId: string): Promise<DancerPath[]> {
  const { data, error } = await supabase
    .from('dancer_paths')
    .select('*')
    .eq('formation_id', formationId);
  if (error) throw new Error(`Failed to fetch paths: ${error.message}`);
  return data;
}

export async function fetchPathsBatch(
  formationIds: string[]
): Promise<Record<string, DancerPath[]>> {
  if (formationIds.length === 0) return {};

  const { data, error } = await supabase
    .from('dancer_paths')
    .select('*')
    .in('formation_id', formationIds);
  if (error) throw new Error(`Failed to fetch paths batch: ${error.message}`);

  const grouped: Record<string, DancerPath[]> = {};
  for (const path of data) {
    if (!grouped[path.formation_id]) {
      grouped[path.formation_id] = [];
    }
    grouped[path.formation_id].push(path);
  }
  return grouped;
}

export async function upsertPath(
  formationId: string,
  dancerLabel: string,
  points: PathPoint[],
  pathType: 'freehand' | 'geometric'
): Promise<DancerPath> {
  const { data, error } = await supabase
    .from('dancer_paths')
    .upsert(
      {
        formation_id: formationId,
        dancer_label: dancerLabel,
        path_points: points,
        path_type: pathType,
      },
      { onConflict: 'formation_id,dancer_label' }
    )
    .select()
    .single();
  if (error) throw new Error(`Failed to upsert path: ${error.message}`);
  return data;
}

export async function deletePath(
  formationId: string,
  dancerLabel: string
): Promise<void> {
  const { error } = await supabase
    .from('dancer_paths')
    .delete()
    .eq('formation_id', formationId)
    .eq('dancer_label', dancerLabel);
  if (error) throw new Error(`Failed to delete path: ${error.message}`);
}

export async function deletePathsForFormation(formationId: string): Promise<void> {
  const { error } = await supabase
    .from('dancer_paths')
    .delete()
    .eq('formation_id', formationId);
  if (error) throw new Error(`Failed to delete paths for formation: ${error.message}`);
}
