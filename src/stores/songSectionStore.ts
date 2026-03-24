import { create } from 'zustand';
import type { SongSection, SongSectionInsert, SongSectionUpdate } from '@/types';
import * as service from '@/services/songSections';
import { toast } from '@/stores/toastStore';

interface SongSectionState {
  sections: SongSection[];
  isLoading: boolean;
  load: (pieceId: string) => Promise<void>;
  add: (section: SongSectionInsert) => Promise<void>;
  update: (id: string, updates: SongSectionUpdate) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reset: () => void;
}

export const useSongSectionStore = create<SongSectionState>((set) => ({
  sections: [],
  isLoading: false,

  load: async (pieceId) => {
    set({ isLoading: true });
    try {
      const sections = await service.fetchSongSections(pieceId);
      set({ sections, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load song sections';
      toast.error(msg);
      set({ isLoading: false });
    }
  },

  add: async (section) => {
    try {
      const created = await service.createSongSection(section);
      set((s) => ({ sections: [...s.sections, created] }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add section';
      toast.error(msg);
    }
  },

  update: async (id, updates) => {
    try {
      const updated = await service.updateSongSection(id, updates);
      set((s) => ({ sections: s.sections.map((sec) => (sec.id === id ? updated : sec)) }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update section';
      toast.error(msg);
    }
  },

  remove: async (id) => {
    try {
      await service.deleteSongSection(id);
      set((s) => ({ sections: s.sections.filter((sec) => sec.id !== id) }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete section';
      toast.error(msg);
    }
  },

  reset: () => set({ sections: [], isLoading: false }),
}));
