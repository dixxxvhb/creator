import { create } from 'zustand';
import type {
  Costume, CostumeInsert, CostumeUpdate,
  CostumeAssignment, CostumeAssignmentInsert, CostumeAssignmentUpdate,
  Prop, PropInsert, PropUpdate,
} from '@/types';
import * as costumesService from '@/services/costumes';
import * as propsService from '@/services/props';
import { toast } from '@/stores/toastStore';

interface CostumeState {
  costumes: Costume[];
  assignments: CostumeAssignment[];
  props: Prop[];
  isLoading: boolean;

  load: () => Promise<void>;

  // Costumes
  addCostume: (costume: CostumeInsert) => Promise<Costume | null>;
  updateCostume: (id: string, updates: CostumeUpdate) => Promise<void>;
  removeCostume: (id: string) => Promise<void>;

  // Assignments
  addAssignment: (assignment: CostumeAssignmentInsert) => Promise<void>;
  updateAssignment: (id: string, updates: CostumeAssignmentUpdate) => Promise<void>;
  removeAssignment: (id: string) => Promise<void>;

  // Props
  addProp: (prop: PropInsert) => Promise<Prop | null>;
  updateProp: (id: string, updates: PropUpdate) => Promise<void>;
  removeProp: (id: string) => Promise<void>;
}

export const useCostumeStore = create<CostumeState>((set) => ({
  costumes: [],
  assignments: [],
  props: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    try {
      const [costumes, assignments, props] = await Promise.all([
        costumesService.fetchCostumes(),
        costumesService.fetchAssignments(),
        propsService.fetchProps(),
      ]);
      set({ costumes, assignments, props, isLoading: false });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load costumes');
      set({ isLoading: false });
    }
  },

  // ─── Costumes ───

  addCostume: async (costume) => {
    try {
      const created = await costumesService.createCostume(costume);
      set((s) => ({ costumes: [...s.costumes, created] }));
      toast.success('Costume added');
      return created;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create costume');
      return null;
    }
  },

  updateCostume: async (id, updates) => {
    try {
      const updated = await costumesService.updateCostume(id, updates);
      set((s) => ({ costumes: s.costumes.map((c) => (c.id === id ? updated : c)) }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update costume');
    }
  },

  removeCostume: async (id) => {
    try {
      await costumesService.deleteCostume(id);
      set((s) => ({
        costumes: s.costumes.filter((c) => c.id !== id),
        assignments: s.assignments.filter((a) => a.costume_id !== id),
      }));
      toast.success('Costume deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete costume');
    }
  },

  // ─── Assignments ───

  addAssignment: async (assignment) => {
    try {
      const created = await costumesService.createAssignment(assignment);
      set((s) => ({ assignments: [...s.assignments, created] }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign dancer');
    }
  },

  updateAssignment: async (id, updates) => {
    try {
      const updated = await costumesService.updateAssignment(id, updates);
      set((s) => ({ assignments: s.assignments.map((a) => (a.id === id ? updated : a)) }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update assignment');
    }
  },

  removeAssignment: async (id) => {
    try {
      await costumesService.deleteAssignment(id);
      set((s) => ({ assignments: s.assignments.filter((a) => a.id !== id) }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove assignment');
    }
  },

  // ─── Props ───

  addProp: async (prop) => {
    try {
      const created = await propsService.createProp(prop);
      set((s) => ({ props: [...s.props, created] }));
      toast.success('Prop added');
      return created;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create prop');
      return null;
    }
  },

  updateProp: async (id, updates) => {
    try {
      const updated = await propsService.updateProp(id, updates);
      set((s) => ({ props: s.props.map((p) => (p.id === id ? updated : p)) }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update prop');
    }
  },

  removeProp: async (id) => {
    try {
      await propsService.deleteProp(id);
      set((s) => ({ props: s.props.filter((p) => p.id !== id) }));
      toast.success('Prop deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete prop');
    }
  },
}));
