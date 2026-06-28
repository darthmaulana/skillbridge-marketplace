import type { VerificationStatus } from "@/app/data";
import { INITIAL_POSTS } from "@/app/data";
import { DEMO_PROFILE, DEMO_PUBLIC_PROFILES } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: "user" | "admin";
  verificationStatus: VerificationStatus;
  isBanned: boolean;
  banReason: string | null;
  createdAt: string;
}

export interface AdminPost {
  id: string;
  userId: string;
  ownerName: string;
  type: "job" | "skill";
  title: string;
  category: string;
  mode: "online" | "offline";
  isFeatured: boolean;
  createdAt: string;
}

export interface AdminReport {
  id: string;
  reporterName: string;
  reportedUserName: string | null;
  postTitle: string | null;
  reason: string;
  description: string | null;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  createdAt: string;
}

export interface AdminStats {
  users: number;
  activePosts: number;
  openReports: number;
  pendingVerifications: number;
  pendingPayouts: number;
}

export interface AdminResult<T> {
  data?: T;
  error?: string;
}

const DEMO_USERS_KEY = "skillbridge-admin-users";
const DEMO_POSTS_REMOVED_KEY = "skillbridge-admin-removed-posts";
const DEMO_REPORTS_KEY = "skillbridge-admin-reports";

export async function loadAdminUsers(): Promise<AdminResult<AdminUser[]>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: loadDemoUsers() };
  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,email,role,verification_status,is_banned,ban_reason,created_at")
    .order("created_at", { ascending: false });
  if (error) return { error: error.message };
  return {
    data: (data ?? []).map((row) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      role: row.role,
      verificationStatus: row.verification_status,
      isBanned: row.is_banned,
      banReason: row.ban_reason,
      createdAt: row.created_at,
    })),
  };
}

export async function setAdminUserBan(userId: string, banned: boolean, reason?: string): Promise<AdminResult<boolean>> {
  if (banned && !reason?.trim()) return { error: "A restriction reason is required." };
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    const users = loadDemoUsers().map((user) => user.id === userId ? { ...user, isBanned: banned, banReason: banned ? reason?.trim() || null : null } : user);
    localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
    return { data: true };
  }
  const { data, error } = await supabase.rpc("admin_set_user_ban", {
    target_user_id: userId,
    should_ban: banned,
    reason: reason?.trim() || null,
  });
  return error ? { error: error.message } : { data: Boolean(data) };
}

export async function loadAdminPosts(): Promise<AdminResult<AdminPost[]>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    const removed = new Set(loadJson<string[]>(DEMO_POSTS_REMOVED_KEY, []));
    const demoPosts = loadJson("skillbridge-posts", INITIAL_POSTS);
    return {
      data: demoPosts.filter((post) => !removed.has(post.id)).map((post) => ({
        id: post.id,
        userId: post.userId,
        ownerName: post.userName,
        type: post.type,
        title: post.title,
        category: post.category,
        mode: post.mode,
        isFeatured: Boolean(post.featured),
        createdAt: post.createdAt,
      })),
    };
  }
  const postResult = await supabase
    .from("admin_posts")
    .select("id,user_id,owner_name,post_type,title,category,work_type,is_featured,created_at")
    .order("created_at", { ascending: false });
  let data: Array<Record<string, unknown>> | null = postResult.data;
  let error = postResult.error;
  if (error && error.message.toLowerCase().includes("is_featured")) {
    const fallback = await supabase
      .from("admin_posts")
      .select("id,user_id,owner_name,post_type,title,category,work_type,created_at")
      .order("created_at", { ascending: false });
    data = fallback.data;
    error = fallback.error;
  }
  if (error) return { error: error.message };
  return {
    data: ((data ?? []) as unknown as Array<{
      id: string;
      user_id: string;
      owner_name: string;
      post_type: "job" | "skill";
      title: string;
      category: string;
      work_type: "online" | "offline";
      is_featured?: boolean | null;
      created_at: string;
    }>).map((row) => ({
      id: row.id,
      userId: row.user_id,
      ownerName: row.owner_name,
      type: row.post_type,
      title: row.title,
      category: row.category,
      mode: row.work_type,
      isFeatured: Boolean(row.is_featured),
      createdAt: row.created_at,
    })),
  };
}

export async function setAdminPostFeatured(postId: string, featured: boolean): Promise<AdminResult<boolean>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    const posts = loadJson("skillbridge-posts", INITIAL_POSTS).map((post) => post.id === postId ? { ...post, featured } : post);
    localStorage.setItem("skillbridge-posts", JSON.stringify(posts));
    return { data: true };
  }
  const { data, error } = await supabase.rpc("admin_set_post_featured", {
    target_post_id: postId,
    should_feature: featured,
  });
  if (!error) return { data: Boolean(data) };

  if (isMissingRpcError(error.message)) {
    const fallback = await supabase.from("posts").update({ is_featured: featured }).eq("id", postId);
    return fallback.error ? { error: fallback.error.message } : { data: true };
  }

  return { error: error.message };
}

export async function removeAdminPost(postId: string): Promise<AdminResult<boolean>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    const removed = new Set(loadJson<string[]>(DEMO_POSTS_REMOVED_KEY, []));
    removed.add(postId);
    localStorage.setItem(DEMO_POSTS_REMOVED_KEY, JSON.stringify([...removed]));
    const posts = loadJson("skillbridge-posts", INITIAL_POSTS).filter((post) => post.id !== postId);
    localStorage.setItem("skillbridge-posts", JSON.stringify(posts));
    return { data: true };
  }
  const { data, error } = await supabase.rpc("admin_remove_post", { target_post_id: postId });
  return error ? { error: error.message } : { data: Boolean(data) };
}

export async function loadAdminReports(): Promise<AdminResult<AdminReport[]>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: loadDemoReports() };
  const { data: reports, error } = await supabase
    .from("reports")
    .select("id,reporter_id,reported_user_id,post_id,reason,description,status,created_at")
    .order("created_at", { ascending: false });
  if (error) return { error: error.message };

  const rows = reports ?? [];
  const userIds = [...new Set(rows.flatMap((row) => [row.reporter_id, row.reported_user_id].filter(Boolean)))];
  const postIds = [...new Set(rows.map((row) => row.post_id).filter(Boolean))];
  const [{ data: users, error: userError }, { data: posts, error: postError }] = await Promise.all([
    userIds.length ? supabase.from("profiles").select("id,full_name").in("id", userIds) : { data: [], error: null },
    postIds.length ? supabase.from("admin_posts").select("id,title").in("id", postIds) : { data: [], error: null },
  ]);
  if (userError) return { error: userError.message };
  if (postError) return { error: postError.message };
  const userNames = new Map((users ?? []).map((user) => [user.id, user.full_name]));
  const postTitles = new Map((posts ?? []).map((post) => [post.id, post.title]));
  return {
    data: rows.map((row) => ({
      id: row.id,
      reporterName: userNames.get(row.reporter_id) || "Unknown user",
      reportedUserName: row.reported_user_id ? userNames.get(row.reported_user_id) || "Unknown user" : null,
      postTitle: row.post_id ? postTitles.get(row.post_id) || "Removed post" : null,
      reason: row.reason,
      description: row.description,
      status: row.status,
      createdAt: row.created_at,
    })),
  };
}

export async function reviewAdminReport(reportId: string, status: AdminReport["status"]): Promise<AdminResult<AdminReport["status"]>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    const reports = loadDemoReports().map((report) => report.id === reportId ? { ...report, status } : report);
    localStorage.setItem(DEMO_REPORTS_KEY, JSON.stringify(reports));
    return { data: status };
  }
  const { data, error } = await supabase.rpc("admin_review_report", { target_report_id: reportId, next_status: status });
  return error ? { error: error.message } : { data: data as AdminReport["status"] };
}

export async function loadAdminStats(): Promise<AdminResult<AdminStats>> {
  const [users, posts, reports] = await Promise.all([loadAdminUsers(), loadAdminPosts(), loadAdminReports()]);
  if (users.error || posts.error || reports.error) return { error: users.error || posts.error || reports.error };
  const supabase = getSupabaseBrowserClient();
  let pendingVerifications = 0;
  let pendingPayouts = 0;
  if (!supabase) {
    const saved = loadJson<Array<{ status: VerificationStatus }>>("skillbridge-admin-verifications", []);
    pendingVerifications = saved.filter((request) => request.status === "pending").length || 2;
  } else {
    const { count, error } = await supabase.from("verification_requests").select("id", { count: "exact", head: true }).eq("status", "pending");
    if (error) return { error: error.message };
    pendingVerifications = count ?? 0;

    const { count: releasedCount, error: payoutError } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "released");
    if (!payoutError) pendingPayouts = releasedCount ?? 0;
  }
  return {
    data: {
      users: users.data?.length ?? 0,
      activePosts: posts.data?.length ?? 0,
      openReports: reports.data?.filter((report) => report.status === "open" || report.status === "reviewing").length ?? 0,
      pendingVerifications,
      pendingPayouts,
    },
  };
}

function loadDemoUsers(): AdminUser[] {
  const saved = loadJson<AdminUser[] | null>(DEMO_USERS_KEY, null);
  if (saved) return saved;
  const profiles = [DEMO_PROFILE, ...Object.values(DEMO_PUBLIC_PROFILES).map((profile) => ({
    ...profile,
    email: `${profile.full_name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    role: "user" as const,
    is_banned: false,
    ban_reason: null,
    offline_job_access: profile.verification_status === "approved",
  }))];
  return profiles.map((profile) => ({
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    role: profile.role,
    verificationStatus: profile.verification_status,
    isBanned: profile.is_banned,
    banReason: profile.ban_reason,
    createdAt: profile.created_at,
  }));
}

function loadDemoReports(): AdminReport[] {
  return loadJson(DEMO_REPORTS_KEY, [
    { id: "demo-report-1", reporterName: "Dewi Kusuma", reportedUserName: "Farhan Maulana", postTitle: "English to Indonesian translation", reason: "Fake or fraudulent listing", description: "The poster requested payment outside the platform.", status: "open", createdAt: "2026-06-14T08:00:00Z" },
    { id: "demo-report-2", reporterName: "Rizky Pratama", reportedUserName: "Budi Santoso", postTitle: "Build a landing page in React", reason: "Spam or misleading post", description: null, status: "reviewing", createdAt: "2026-06-13T09:00:00Z" },
  ]);
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;
  try {
    return JSON.parse(saved) as T;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

function isMissingRpcError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("could not find the function") || normalized.includes("schema cache");
}
