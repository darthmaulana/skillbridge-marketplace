import type { VerificationStatus } from "@/app/data";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export type VerificationReviewAction = "approve" | "reject" | "resubmit" | "ban";

export interface AdminVerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  legalName: string;
  ktpImagePath: string;
  selfieImagePath: string;
  status: VerificationStatus;
  rejectionReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  isBanned: boolean;
}

export interface VerificationPreviewUrls {
  ktpUrl: string | null;
  selfieUrl: string | null;
}

export interface AdminVerificationResult<T> {
  data?: T;
  error?: string;
}

interface RequestRow {
  id: string;
  user_id: string;
  legal_name: string;
  ktp_image_path: string;
  selfie_image_path: string;
  status: VerificationStatus;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  is_banned: boolean;
}

const DEMO_ADMIN_REQUESTS_KEY = "skillbridge-admin-verifications";
const DEMO_USER_REQUEST_KEY = "skillbridge-verification-request";

const DEMO_REQUESTS: AdminVerificationRequest[] = [
  {
    id: "demo-verification-farhan",
    userId: "demo-farhan",
    userName: "Farhan Maulana",
    userEmail: "farhan@example.com",
    legalName: "Farhan Maulana Hakim",
    ktpImagePath: "private-demo/farhan/ktp",
    selfieImagePath: "private-demo/farhan/selfie",
    status: "pending",
    rejectionReason: null,
    submittedAt: "2026-06-13T03:23:00Z",
    reviewedAt: null,
    isBanned: false,
  },
  {
    id: "demo-verification-budi",
    userId: "demo-budi",
    userName: "Budi Santoso",
    userEmail: "budi@example.com",
    legalName: "Budi Santoso Wibowo",
    ktpImagePath: "private-demo/budi/ktp",
    selfieImagePath: "private-demo/budi/selfie",
    status: "pending",
    rejectionReason: null,
    submittedAt: "2026-06-12T08:40:00Z",
    reviewedAt: null,
    isBanned: false,
  },
];

export async function loadAdminVerificationRequests(): Promise<AdminVerificationResult<AdminVerificationRequest[]>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: loadDemoRequests() };

  const { data: requests, error: requestError } = await supabase
    .from("verification_requests")
    .select("id,user_id,legal_name,ktp_image_path,selfie_image_path,status,rejection_reason,submitted_at,reviewed_at")
    .order("submitted_at", { ascending: false });
  if (requestError) return { error: requestError.message };

  const rows = (requests ?? []) as RequestRow[];
  const userIds = [...new Set(rows.map((request) => request.user_id))];
  const { data: profiles, error: profileError } = userIds.length
    ? await supabase.from("profiles").select("id,full_name,email,is_banned").in("id", userIds)
    : { data: [], error: null };
  if (profileError) return { error: profileError.message };

  const profileById = new Map((profiles as ProfileRow[]).map((profile) => [profile.id, profile]));
  return {
    data: rows.map((request) => {
      const profile = profileById.get(request.user_id);
      return {
        id: request.id,
        userId: request.user_id,
        userName: profile?.full_name || "Unknown user",
        userEmail: profile?.email || "Email unavailable",
        legalName: request.legal_name,
        ktpImagePath: request.ktp_image_path,
        selfieImagePath: request.selfie_image_path,
        status: request.status,
        rejectionReason: request.rejection_reason,
        submittedAt: request.submitted_at,
        reviewedAt: request.reviewed_at,
        isBanned: Boolean(profile?.is_banned),
      };
    }),
  };
}

export async function createVerificationPreviewUrls(
  request: AdminVerificationRequest,
): Promise<AdminVerificationResult<VerificationPreviewUrls>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: { ktpUrl: null, selfieUrl: null } };

  const { data, error } = await supabase.storage
    .from("verification-private")
    .createSignedUrls([request.ktpImagePath, request.selfieImagePath], 300);
  if (error) return { error: error.message };

  return {
    data: {
      ktpUrl: data?.[0]?.signedUrl ?? null,
      selfieUrl: data?.[1]?.signedUrl ?? null,
    },
  };
}

export async function reviewVerificationRequest(
  requestId: string,
  action: VerificationReviewAction,
  reason?: string,
): Promise<AdminVerificationResult<VerificationStatus>> {
  if (action !== "approve" && !reason?.trim()) return { error: "A reason is required for this action." };

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    const requests = loadDemoRequests();
    const index = requests.findIndex((request) => request.id === requestId);
    if (index < 0) return { error: "Verification request not found." };

    const nextStatus: VerificationStatus = action === "approve" ? "approved" : "rejected";
    requests[index] = {
      ...requests[index],
      status: nextStatus,
      rejectionReason: action === "approve" ? null : reason?.trim() || null,
      reviewedAt: new Date().toISOString(),
      isBanned: action === "ban",
    };
    localStorage.setItem(DEMO_ADMIN_REQUESTS_KEY, JSON.stringify(requests));
    syncDemoUserRequest(requests[index]);
    return { data: nextStatus };
  }

  const { data, error } = await supabase.rpc("review_verification_request", {
    target_request_id: requestId,
    review_action: action,
    review_reason: reason?.trim() || null,
  });
  return error ? { error: error.message } : { data: data as VerificationStatus };
}

function loadDemoRequests() {
  if (typeof window === "undefined") return structuredClone(DEMO_REQUESTS);
  const saved = localStorage.getItem(DEMO_ADMIN_REQUESTS_KEY);
  let requests: AdminVerificationRequest[];
  try {
    requests = saved ? JSON.parse(saved) as AdminVerificationRequest[] : structuredClone(DEMO_REQUESTS);
  } catch {
    requests = structuredClone(DEMO_REQUESTS);
  }

  const userRequest = localStorage.getItem(DEMO_USER_REQUEST_KEY);
  if (userRequest) {
    try {
      const parsed = JSON.parse(userRequest) as {
        id: string;
        legalName: string;
        ktpImagePath: string;
        selfieImagePath: string;
        status: VerificationStatus;
        rejectionReason: string | null;
        submittedAt: string;
        reviewedAt: string | null;
      };
      if (!requests.some((request) => request.id === parsed.id)) {
        requests.unshift({
          ...parsed,
          userId: "demo-ayu",
          userName: "Ayu Setiawati",
          userEmail: "ayu@example.com",
          isBanned: false,
        });
      }
    } catch {
      // The user-facing verification flow will repair invalid demo data.
    }
  }
  localStorage.setItem(DEMO_ADMIN_REQUESTS_KEY, JSON.stringify(requests));
  return requests;
}

function syncDemoUserRequest(request: AdminVerificationRequest) {
  if (request.userId !== "demo-ayu") return;
  localStorage.setItem(DEMO_USER_REQUEST_KEY, JSON.stringify({
    id: request.id,
    legalName: request.legalName,
    ktpImagePath: request.ktpImagePath,
    selfieImagePath: request.selfieImagePath,
    status: request.status,
    rejectionReason: request.rejectionReason,
    submittedAt: request.submittedAt,
    reviewedAt: request.reviewedAt,
  }));
  localStorage.setItem("skillbridge-verification", request.status);
}
