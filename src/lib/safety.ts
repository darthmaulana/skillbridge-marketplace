import { getSupabaseBrowserClient } from "@/lib/supabase";

export interface SafetyReportInput {
  postId?: string;
  reportedUserId: string;
  reason: string;
  description: string;
  blockUser: boolean;
}

export interface SafetyResult {
  reportId?: string;
  error?: string;
}

const DEMO_REPORTS_KEY = "skillbridge-admin-reports";
const DEMO_BLOCKS_KEY = "skillbridge-blocked-users";

export async function submitSafetyReport(input: SafetyReportInput): Promise<SafetyResult> {
  if (!input.reason.trim()) return { error: "Choose a reason for your report." };
  if (input.description.length > 2000) return { error: "Additional details must be 2,000 characters or fewer." };

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    const reportId = crypto.randomUUID();
    const reports = loadJson<Array<Record<string, unknown>>>(DEMO_REPORTS_KEY, []);
    reports.unshift({
      id: reportId,
      reporterName: "Ayu Setiawati",
      reportedUserName: input.reportedUserId,
      postTitle: input.postId ? `Post ${input.postId}` : null,
      reason: input.reason.trim(),
      description: input.description.trim() || null,
      status: "open",
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(DEMO_REPORTS_KEY, JSON.stringify(reports));
    if (input.blockUser) {
      const blocks = new Set(loadJson<string[]>(DEMO_BLOCKS_KEY, []));
      blocks.add(input.reportedUserId);
      localStorage.setItem(DEMO_BLOCKS_KEY, JSON.stringify([...blocks]));
    }
    return { reportId };
  }

  const { data, error } = await supabase.rpc("submit_safety_report", {
    target_post_id: input.postId ?? null,
    target_user_id: input.reportedUserId,
    report_reason: input.reason.trim(),
    report_description: input.description.trim() || null,
    should_block: input.blockUser,
  });
  return error ? { error: error.message } : { reportId: data as string };
}

export function getDemoBlockedUserIds() {
  if (typeof window === "undefined") return new Set<string>();
  return new Set(loadJson<string[]>(DEMO_BLOCKS_KEY, []));
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const value = localStorage.getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}
