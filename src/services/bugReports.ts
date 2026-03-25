import { supabase } from '@/lib/supabase';
import type { BugReport, BugReportInsert, BugStatus } from '@/types';

export async function createBugReport(report: BugReportInsert): Promise<BugReport> {
  const { data, error } = await supabase
    .from('bug_reports')
    .insert(report)
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
