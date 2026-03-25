import { create } from 'zustand';
import type { BugReport, BugReportInsert, BugStatus } from '@/types';
import * as bugReportService from '@/services/bugReports';
import { toast } from '@/stores/toastStore';

interface BugReportState {
  reports: BugReport[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  submit: (report: BugReportInsert) => Promise<boolean>;
  updateStatus: (id: string, status: BugStatus) => Promise<void>;
}

export const useBugReportStore = create<BugReportState>((set) => ({
  reports: [],
  isLoading: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const reports = await bugReportService.fetchBugReports();
      set({ reports, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load bug reports';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  submit: async (report) => {
    try {
      await bugReportService.createBugReport(report);
      toast.success('Bug report submitted — thank you!');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit bug report';
      toast.error(message);
      return false;
    }
  },

  updateStatus: async (id, status) => {
    try {
      const updated = await bugReportService.updateBugReportStatus(id, status);
      set((state) => ({
        reports: state.reports.map((r) => (r.id === id ? updated : r)),
      }));
      toast.success(`Report marked as ${status}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update bug report';
      toast.error(message);
    }
  },
}));
