import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from 'zustand';
import { useFormationStore } from '@/stores/formationStore';
import { usePieceStore } from '@/stores/pieceStore';
import { useRosterStore } from '@/stores/rosterStore';
import { useUIStore } from '@/stores/uiStore';
import { usePathStore } from '@/stores/pathStore';
import { generateLabel } from '@/lib/formationTemplates';
import { applyTemplate } from '@/lib/formationTemplates';
import { toast } from '@/stores/toastStore';
import { DANCER_COLORS } from '@/types';
import type { DancerPositionInsert } from '@/types';
import type { RoleAssignment } from '@/lib/formationTemplates';
import type { AddDancerParams } from '@/components/canvas/AddDancerModal';

export function useFormationEditor(pieceId: string | undefined) {
  const pieces = usePieceStore((s) => s.pieces);
  const updatePiece = usePieceStore((s) => s.update);

  const formations = useFormationStore((s) => s.formations);
  const positions = useFormationStore((s) => s.positions);
  const activeFormationId = useFormationStore((s) => s.activeFormationId);
  const savePositions = useFormationStore((s) => s.savePositions);
  const addFormation = useFormationStore((s) => s.addFormation);
  const updateFormation = useFormationStore((s) => s.updateFormation);
  const updateLocalPositionDancer = useFormationStore((s) => s.updateLocalPositionDancer);
  const isDirty = useFormationStore((s) => s.isDirty);

  const rosterDancers = useRosterStore((s) => s.dancers);
  const addRosterDancer = useRosterStore((s) => s.add);

  const piece = pieces.find((p) => p.id === pieceId);
  const activeFormation = formations.find((f) => f.id === activeFormationId);
  const activePositions = activeFormationId ? positions[activeFormationId] ?? [] : [];

  // --- Auto-save logic ---
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const templateHintShown = useRef(false);

  const flushAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    const dirtyFlag = useFormationStore.getState().isDirty;
    if (!dirtyFlag) return;
    const allPositions = useFormationStore.getState().positions;
    const formationIds = Object.keys(allPositions);
    formationIds.forEach((fId) => {
      const positionsForFormation = allPositions[fId];
      if (!positionsForFormation || positionsForFormation.length === 0) return;
      const inserts: DancerPositionInsert[] = positionsForFormation.map((pos) => ({
        formation_id: fId,
        dancer_id: pos.dancer_id,
        dancer_label: pos.dancer_label,
        x: pos.x,
        y: pos.y,
        color: pos.color,
      }));
      savePositions(fId, inserts, true);
    });
  }, [savePositions]);

  // Flush on formation switch so pending saves aren't lost
  const prevFormationId = useRef(activeFormationId);
  useEffect(() => {
    if (prevFormationId.current && prevFormationId.current !== activeFormationId) {
      flushAutoSave();
    }
    prevFormationId.current = activeFormationId;
  }, [activeFormationId, flushAutoSave]);

  useEffect(() => {
    if (!isDirty || !activeFormationId) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      const allPositions = useFormationStore.getState().positions;
      const formationIds = Object.keys(allPositions);
      Promise.all(
        formationIds.map((fId) => {
          const positionsForFormation = allPositions[fId];
          if (!positionsForFormation || positionsForFormation.length === 0) return Promise.resolve();
          const inserts: DancerPositionInsert[] = positionsForFormation.map((pos) => ({
            formation_id: fId,
            dancer_id: pos.dancer_id,
            dancer_label: pos.dancer_label,
            x: pos.x,
            y: pos.y,
            color: pos.color,
          }));
          return savePositions(fId, inserts, true);
        })
      );
    }, 1500);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [isDirty, activeFormationId, savePositions]);

  // --- Notes debounce logic ---
  const [localChoreoNotes, setLocalChoreoNotes] = useState('');
  const [localCountsNotes, setLocalCountsNotes] = useState('');
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local notes from formation data when active formation changes
  useEffect(() => {
    if (activeFormation) {
      setLocalChoreoNotes(activeFormation.choreo_notes ?? '');
      setLocalCountsNotes(activeFormation.counts_notes ?? '');
    }
  }, [activeFormationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const debouncedUpdateNotes = useCallback(
    (field: 'choreo_notes' | 'counts_notes', value: string) => {
      if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
      notesTimerRef.current = setTimeout(() => {
        if (activeFormationId) {
          updateFormation(activeFormationId, { [field]: value });
        }
      }, 500);
    },
    [activeFormationId, updateFormation]
  );

  // Cleanup notes timer
  useEffect(() => {
    return () => {
      if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    };
  }, []);

  // --- Handlers ---
  async function handleAddFormation() {
    if (!pieceId) return;
    try {
      const label = `Formation ${formations.length + 1}`;
      const currentPositions = activeFormationId ? positions[activeFormationId] ?? [] : [];
      const newFormation = await addFormation({
        piece_id: pieceId,
        index: formations.length,
        label,
        timestamp_seconds: null,
        choreo_notes: '',
        counts_notes: '',
        transition_duration_ms: 2000,
        transition_easing: 'ease-in-out',
      });
      if (newFormation && currentPositions.length > 0) {
        const copiedPositions: DancerPositionInsert[] = currentPositions.map((p) => ({
          formation_id: newFormation.id,
          dancer_id: p.dancer_id,
          dancer_label: p.dancer_label,
          x: p.x,
          y: p.y,
          color: p.color,
        }));
        await savePositions(newFormation.id, copiedPositions);
        toast.info('Positions copied — tap a dancer to draw their transition path.');
      }
    } catch {
      toast.error('Failed to add formation');
    }
  }

  async function handleDeleteFormation() {
    if (!activeFormationId || formations.length <= 1) return;
    try {
      const removeFormation = useFormationStore.getState().removeFormation;
      await removeFormation(activeFormationId);
    } catch {
      toast.error('Failed to delete formation');
    }
  }

  async function handleApplyTemplate(templateId: string, roleAssignments?: RoleAssignment[]) {
    if (!activeFormationId || !piece) return;
    const newPositions = applyTemplate(
      templateId,
      piece.dancer_count,
      piece.stage_width,
      piece.stage_depth,
      activeFormationId,
      {
        roleAssignments,
        existingPositions: activePositions.map((p) => ({
          dancer_label: p.dancer_label,
          dancer_id: p.dancer_id,
          color: p.color,
        })),
        focalDancerId: piece.focal_dancer_id,
      },
    );
    if (newPositions.length > 0) {
      await savePositions(activeFormationId, newPositions);
    }
  }

  async function handleAddDancers(params: AddDancerParams) {
    if (!piece) return;

    let dancerId = params.dancer.id;
    let dancerColor = params.dancer.color;

    if (params.create) {
      const color = dancerColor || DANCER_COLORS[piece.dancer_count % DANCER_COLORS.length];
      const newDancer = await addRosterDancer({
        full_name: params.create.fullName,
        short_name: params.create.shortName,
        birthday: null,
        color,
        is_active: true,
      });
      if (!newDancer) return;
      dancerId = newDancer.id;
      dancerColor = newDancer.color;
    }

    const newIdx = piece.dancer_count;
    const label = generateLabel(newIdx);
    const [startIdx, endIdx] = params.formationRange;

    await updatePiece(piece.id, { dancer_count: piece.dancer_count + 1 });

    for (let i = startIdx; i <= endIdx && i < formations.length; i++) {
      const formation = formations[i];
      const existing = positions[formation.id] ?? [];
      const newPosition: DancerPositionInsert = {
        formation_id: formation.id,
        dancer_id: dancerId,
        dancer_label: label,
        x: piece.stage_width / 2,
        y: piece.stage_depth / 2,
        color: dancerColor,
      };
      await savePositions(formation.id, [
        ...existing.map((p) => ({
          formation_id: formation.id,
          dancer_id: p.dancer_id,
          dancer_label: p.dancer_label,
          x: p.x,
          y: p.y,
          color: p.color,
        })),
        newPosition,
      ]);
    }

    const newCount = piece.dancer_count + 1;
    if (newCount < 4) {
      toast.info(`Only ${newCount} dancer${newCount !== 1 ? 's' : ''} so far — add more anytime from the toolbar.`);
    }

    if (piece.dancer_count === 0 && !templateHintShown.current) {
      templateHintShown.current = true;
      toast.info('Tip: Use the Template button to quickly arrange dancers into formations.');
    }
  }

  async function handleRemoveDancer(dancerLabel?: string) {
    if (!piece || piece.dancer_count <= 1) return;
    const newCount = piece.dancer_count - 1;
    const removeLabel = dancerLabel ?? generateLabel(newCount);

    await updatePiece(piece.id, { dancer_count: newCount });

    for (const formation of formations) {
      const existing = positions[formation.id] ?? [];
      const filtered = existing.filter((p) => p.dancer_label !== removeLabel);
      const relabeled = filtered
        .sort((a, b) => a.dancer_label.localeCompare(b.dancer_label))
        .map((p, i) => ({
          formation_id: formation.id,
          dancer_id: p.dancer_id,
          dancer_label: generateLabel(i),
          x: p.x,
          y: p.y,
          color: p.color,
        }));
      await savePositions(formation.id, relabeled);
    }
  }

  async function handleQuickPopulate(count: number) {
    if (!piece) return;

    await updatePiece(piece.id, { dancer_count: count });

    for (const formation of formations) {
      const positionInserts: DancerPositionInsert[] = [];
      for (let i = 0; i < count; i++) {
        const label = generateLabel(i);
        const color = DANCER_COLORS[i % DANCER_COLORS.length];
        const SNAP = 1.25;
        const t = count === 1 ? 0.5 : i / (count - 1);
        positionInserts.push({
          formation_id: formation.id,
          dancer_id: null,
          dancer_label: label,
          x: Math.round((piece.stage_width * 0.1 + t * piece.stage_width * 0.8) / SNAP) * SNAP,
          y: Math.round((piece.stage_depth / 2) / SNAP) * SNAP,
          color,
        });
      }
      await savePositions(formation.id, positionInserts);
    }
  }

  async function handleQuickAddDancer(name: string, positionId: string) {
    if (!name || !piece || !activeFormationId) return;

    const usedColors = new Set(rosterDancers.map((d) => d.color));
    const color = DANCER_COLORS.find((c) => !usedColors.has(c)) ?? DANCER_COLORS[rosterDancers.length % DANCER_COLORS.length];

    const newDancer = await addRosterDancer({
      full_name: name,
      short_name: name.split(' ')[0],
      birthday: null,
      color,
      is_active: true,
    });
    if (!newDancer) return;

    updateLocalPositionDancer(activeFormationId, positionId, newDancer.id, newDancer.color);
  }

  async function handleSavePositions() {
    if (!activeFormationId) return;
    const inserts: DancerPositionInsert[] = activePositions.map((pos) => ({
      formation_id: activeFormationId,
      dancer_id: pos.dancer_id,
      dancer_label: pos.dancer_label,
      x: pos.x,
      y: pos.y,
      color: pos.color,
    }));
    await savePositions(activeFormationId, inserts);
  }

  // --- Undo/Redo for position changes via zundo ---
  const canUndo = useStore(useFormationStore.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(useFormationStore.temporal, (s) => s.futureStates.length > 0);

  const handleUndo = useCallback(() => {
    useFormationStore.temporal.getState().undo();
  }, []);

  const handleRedo = useCallback(() => {
    useFormationStore.temporal.getState().redo();
  }, []);

  // Keyboard bindings: Ctrl/Cmd+Z = undo, Ctrl/Cmd+Shift+Z = redo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== 'z') return;

      // In draw mode, let the path undo system handle Ctrl+Z
      const mode = useUIStore.getState().canvasMode;
      if (mode === 'draw-freehand' || mode === 'draw-geometric') {
        if (!e.shiftKey) {
          // Ctrl+Z in draw mode → path undo
          e.preventDefault();
          usePathStore.getState().undo();
          return;
        }
        // Shift+Z in draw mode → ignore (no path redo)
        return;
      }

      e.preventDefault();
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  return {
    localChoreoNotes,
    setLocalChoreoNotes,
    localCountsNotes,
    setLocalCountsNotes,
    debouncedUpdateNotes,
    handleAddFormation,
    handleDeleteFormation,
    handleApplyTemplate,
    handleAddDancers,
    handleRemoveDancer,
    handleQuickPopulate,
    handleQuickAddDancer,
    handleSavePositions,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
  };
}
