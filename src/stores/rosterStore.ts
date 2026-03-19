import { create } from 'zustand';
import type { Dancer, DancerInsert, DancerUpdate } from '@/types';
import * as dancersService from '@/services/dancers';
import { toast } from '@/stores/toastStore';

interface RosterState {
  dancers: Dancer[];
  isLoading: boolean;
  load: () => Promise<void>;
  add: (dancer: DancerInsert) => Promise<Dancer | null>;
  update: (id: string, updates: DancerUpdate) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useRosterStore = create<RosterState>((set) => ({
  dancers: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    try {
      const dancers = await dancersService.fetchDancers();
      set({ dancers, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dancers';
      set({ isLoading: false });
      toast.error(message);
    }
  },

  add: async (dancer) => {
    try {
      const created = await dancersService.createDancer(dancer);
      set((state) => ({ dancers: [...state.dancers, created] }));
      toast.success('Dancer added');
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add dancer';
      toast.error(message);
      return null;
    }
  },

  update: async (id, updates) => {
    try {
      const updated = await dancersService.updateDancer(id, updates);
      set((state) => ({
        dancers: state.dancers.map((d) => (d.id === id ? updated : d)),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update dancer';
      toast.error(message);
    }
  },

  remove: async (id) => {
    try {
      await dancersService.deleteDancer(id);
      set((state) => ({
        dancers: state.dancers.filter((d) => d.id !== id),
      }));
      toast.success('Dancer removed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove dancer';
      toast.error(message);
    }
  },
}));
