import { create } from 'zustand';
import type {
  Season, SeasonInsert, SeasonUpdate,
  PieceSeason,
  Competition, CompetitionInsert, CompetitionUpdate,
  CompetitionEntry, CompetitionEntryInsert, CompetitionEntryUpdate,
} from '@/types';
import * as seasonsService from '@/services/seasons';
import * as competitionsService from '@/services/competitions';
import { toast } from '@/stores/toastStore';

interface SeasonState {
  seasons: Season[];
  pieceSeasons: PieceSeason[];
  competitions: Competition[];
  entries: CompetitionEntry[];
  isLoading: boolean;
  error: string | null;

  // Seasons
  loadSeasons: () => Promise<void>;
  addSeason: (season: SeasonInsert) => Promise<Season | null>;
  updateSeason: (id: string, updates: SeasonUpdate) => Promise<void>;
  removeSeason: (id: string) => Promise<void>;

  // Piece-Season assignments
  assignPiece: (pieceId: string, seasonId: string) => Promise<void>;
  unassignPiece: (pieceId: string, seasonId: string) => Promise<void>;
  getPiecesForSeason: (seasonId: string) => string[];

  // Competitions
  loadAllCompetitions: () => Promise<void>;
  loadCompetitions: (seasonId: string) => Promise<void>;
  addCompetition: (comp: CompetitionInsert) => Promise<Competition | null>;
  updateCompetition: (id: string, updates: CompetitionUpdate) => Promise<void>;
  removeCompetition: (id: string) => Promise<void>;

  // Entries
  loadEntries: (competitionId: string) => Promise<void>;
  loadEntriesBySeason: (seasonId: string) => Promise<void>;
  addEntry: (entry: CompetitionEntryInsert) => Promise<CompetitionEntry | null>;
  updateEntry: (id: string, updates: CompetitionEntryUpdate) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
}

export const useSeasonStore = create<SeasonState>((set, get) => ({
  seasons: [],
  pieceSeasons: [],
  competitions: [],
  entries: [],
  isLoading: false,
  error: null,

  // ─── Seasons ───

  loadSeasons: async () => {
    set({ isLoading: true, error: null });
    try {
      const [seasons, pieceSeasons] = await Promise.all([
        seasonsService.fetchSeasons(),
        seasonsService.fetchPieceSeasons(),
      ]);
      set({ seasons, pieceSeasons, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load seasons';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  addSeason: async (season) => {
    try {
      const created = await seasonsService.createSeason(season);
      set((s) => ({ seasons: [created, ...s.seasons] }));
      toast.success('Season created');
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create season';
      toast.error(message);
      return null;
    }
  },

  updateSeason: async (id, updates) => {
    try {
      const updated = await seasonsService.updateSeason(id, updates);
      set((s) => ({
        seasons: s.seasons.map((x) => (x.id === id ? updated : x)),
      }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update season');
    }
  },

  removeSeason: async (id) => {
    try {
      await seasonsService.deleteSeason(id);
      set((s) => ({
        seasons: s.seasons.filter((x) => x.id !== id),
        pieceSeasons: s.pieceSeasons.filter((ps) => ps.season_id !== id),
        competitions: s.competitions.filter((c) => c.season_id !== id),
        // Also clear entries whose competition belonged to this season
        entries: s.entries.filter((e) => {
          const compIds = s.competitions.filter((c) => c.season_id === id).map((c) => c.id);
          return !compIds.includes(e.competition_id);
        }),
      }));
      toast.success('Season deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete season');
    }
  },

  // ─── Piece-Season ───

  assignPiece: async (pieceId, seasonId) => {
    try {
      const link = await seasonsService.assignPieceToSeason(pieceId, seasonId);
      set((s) => ({ pieceSeasons: [...s.pieceSeasons, link] }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign piece');
    }
  },

  unassignPiece: async (pieceId, seasonId) => {
    try {
      await seasonsService.removePieceFromSeason(pieceId, seasonId);
      set((s) => ({
        pieceSeasons: s.pieceSeasons.filter(
          (ps) => !(ps.piece_id === pieceId && ps.season_id === seasonId)
        ),
      }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove piece');
    }
  },

  getPiecesForSeason: (seasonId) => {
    return get().pieceSeasons
      .filter((ps) => ps.season_id === seasonId)
      .map((ps) => ps.piece_id);
  },

  // ─── Competitions ───

  loadAllCompetitions: async () => {
    try {
      const competitions = await competitionsService.fetchAllCompetitions();
      set({ competitions });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load competitions');
    }
  },

  loadCompetitions: async (seasonId) => {
    try {
      const competitions = await competitionsService.fetchCompetitions(seasonId);
      set({ competitions });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load competitions');
    }
  },

  addCompetition: async (comp) => {
    try {
      const created = await competitionsService.createCompetition(comp);
      set((s) => ({ competitions: [...s.competitions, created] }));
      toast.success('Competition added');
      return created;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create competition');
      return null;
    }
  },

  updateCompetition: async (id, updates) => {
    try {
      const updated = await competitionsService.updateCompetition(id, updates);
      set((s) => ({
        competitions: s.competitions.map((c) => (c.id === id ? updated : c)),
      }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update competition');
    }
  },

  removeCompetition: async (id) => {
    try {
      await competitionsService.deleteCompetition(id);
      set((s) => ({
        competitions: s.competitions.filter((c) => c.id !== id),
        entries: s.entries.filter((e) => e.competition_id !== id),
      }));
      toast.success('Competition deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete competition');
    }
  },

  // ─── Entries ───

  loadEntries: async (competitionId) => {
    try {
      const entries = await competitionsService.fetchEntries(competitionId);
      set((s) => ({
        // Merge: replace entries for this competition, keep others
        entries: [
          ...s.entries.filter((e) => e.competition_id !== competitionId),
          ...entries,
        ],
      }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load entries');
    }
  },

  loadEntriesBySeason: async (seasonId) => {
    try {
      const entries = await competitionsService.fetchEntriesBySeason(seasonId);
      set({ entries });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load entries');
    }
  },

  addEntry: async (entry) => {
    try {
      const created = await competitionsService.createEntry(entry);
      set((s) => ({ entries: [...s.entries, created] }));
      toast.success('Entry added');
      return created;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create entry');
      return null;
    }
  },

  updateEntry: async (id, updates) => {
    try {
      const updated = await competitionsService.updateEntry(id, updates);
      set((s) => ({
        entries: s.entries.map((e) => (e.id === id ? updated : e)),
      }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update entry');
    }
  },

  removeEntry: async (id) => {
    try {
      await competitionsService.deleteEntry(id);
      set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete entry');
    }
  },
}));
