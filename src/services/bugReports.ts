import { supabase, getCurrentUserId } from '@/lib/supabase';
import type { BugReport, BugReportInsert, BugStatus } from '@/types';

export async function createBugReport(report: BugReportInsert): Promise<BugReport> {
  // user_id is optional — allow anonymous bug reports
  let user_id: string | undefined;
  try {
    user_id = await getCurrentUserId();
  } catch {
    // Not authenticated — submit anonymously
  }
  const { data, error } = await supabase
    .from('bug_reports')
    .insert(user_id ? { ...report, user_id } : report)
    .select()
    .single();
  if (error) throw new Error(`Failed to submit bug report: ${error.message}`);
  return data;
}

export async function fetchBugReports(): Promise<BugReport[]> {
  const { data, error } = await supabase
    .from('bug_reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to fetch bug reports: ${error.message}`);
  return data;
}

export async function updateBugReportStatus(id: string, status: BugStatus): Promise<BugReport> {
  const { data, error } = await supabase
    .from('bug_reports')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update bug report: ${error.message}`);
  return data;
}
