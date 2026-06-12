import { create } from 'zustand';
import type { Show, ShowInsert, ShowUpdate, ShowAct, ShowActInsert, ShowActUpdate } from '@/types';
import * as showsService from '@/services/shows';
import { toast } from '@/stores/toastStore';
import { withRetry } from '@/lib/withRetry';

interface ShowState {
  shows: Show[];
  showActs: ShowAct[];
  isLoading: boolean;
  error: string | null;

  loadAllShows: () => Promise<void>;
  loadShows: (seasonId: string) => Promise<void>;
  addShow: (show: ShowInsert) => Promise<Show | null>;
  updateShow: (id: string, updates: ShowUpdate) => Promise<void>;
  removeShow: (id: string) => Promise<void>;

  loadShowActs: (showId: string) => Promise<void>;
  addShowAct: (act: ShowActInsert) => Promise<ShowAct | null>;
  updateShowAct: (id: string, updates: ShowActUpdate) => Promise<void>;
  removeShowAct: (id: string) => Promise<void>;
  reorderActs: (showId: string, orderedActIds: string[]) => Promise<void>;
}

export const useShowStore = create<ShowState>((set, get) => ({
  shows: [],
  showActs: [],
  isLoading: false,
  error: null,

  loadAllShows: async () => {
    set({ isLoading: true, error: null });
    try {
      const shows = await withRetry(() => showsService.fetchAllShows());
      set({ shows, isLoading: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load shows';
      set({ error: message, isLoading: false });
      toast.error('Failed to load shows');
    }
  },

  loadShows: async (seasonId) => {
    set({ isLoading: true, error: null });
    try {
      const shows = await withRetry(() => showsService.fetchShows(seasonId));
      set({ shows, isLoading: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load shows';
      set({ error: message, isLoading: false });
      toast.error('Failed to load shows');
    }
  },

  addShow: async (show) => {
    try {
      const created = await showsService.createShow(show);
      set({ shows: [...get().shows, created] });
      toast.success('Show created');
      return created;
    } catch {
      toast.error('Failed to create show');
      return null;
    }
  },

  updateShow: async (id, updates) => {
    try {
      const updated = await showsService.updateShow(id, updates);
      set({ shows: get().shows.map((s) => (s.id === id ? updated : s)) });
    } catch {
      toast.error('Failed to update show');
    }
  },

  removeShow: async (id) => {
    try {
      await showsService.deleteShow(id);
      set({
        shows: get().shows.filter((s) => s.id !== id),
        showActs: get().showActs.filter((a) => a.show_id !== id),
      });
      toast.success('Show deleted');
    } catch {
      toast.error('Failed to delete show');
    }
  },

  loadShowActs: async (showId) => {
    try {
      const acts = await withRetry(() => showsService.fetchShowActs(showId));
      set({ showActs: acts });
    } catch {
      toast.error('Failed to load acts');
    }
  },

  addShowAct: async (act) => {
    try {
      const created = await showsService.createShowAct(act);
      set({ showActs: [...get().showActs, created] });
      return created;
    } catch {
      toast.error('Failed to add act');
      return null;
    }
  },

  updateShowAct: async (id, updates) => {
    try {
      const updated = await showsService.updateShowAct(id, updates);
      set({ showActs: get().showActs.map((a) => (a.id === id ? updated : a)) });
    } catch {
      toast.error('Failed to update act');
    }
  },

  removeShowAct: async (id) => {
    try {
      await showsService.deleteShowAct(id);
      set({ showActs: get().showActs.filter((a) => a.id !== id) });
    } catch {
      toast.error('Failed to delete act');
    }
  },

  reorderActs: async (showId, orderedActIds) => {
    // Optimistic update
    const reordered = orderedActIds.map((id, idx) => {
      const act = get().showActs.find((a) => a.id === id);
      return act ? { ...act, act_number: idx } : null;
    }).filter(Boolean) as ShowAct[];
    set({ showActs: reordered });

    try {
      await showsService.reorderShowActs(showId, orderedActIds);
    } catch {
      toast.error('Failed to reorder acts');
      // Recovery refetch gets its own guard — if it also fails, the
      // optimistic order stays on screen rather than throwing unhandled.
      try {
        const acts = await showsService.fetchShowActs(showId);
        set({ showActs: acts });
      } catch {
        // keep optimistic state; next loadShowActs will reconcile
      }
    }
  },
}));
