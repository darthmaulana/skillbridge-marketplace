import { getSupabaseBrowserClient } from "@/lib/supabase";

export interface AdminPayout {
  id: string;
  postTitle: string;
  postType: "job" | "skill" | null;
  billTitle: string | null;
  buyerName: string;
  buyerEmail: string | null;
  sellerName: string;
  sellerEmail: string | null;
  sellerPayoutMethod: string | null;
  sellerPayoutProvider: string | null;
  sellerPayoutAccountName: string | null;
  sellerPayoutAccountNumber: string | null;
  sellerPayoutNotes: string | null;
  amount: number;
  platformFee: number;
  totalAmount: number;
  currency: string;
  status: string;
  paymentStatus: string | null;
  paidAt: string | null;
  completionUrl: string | null;
  completionNote: string | null;
  acceptedAt: string | null;
  createdAt: string;
  payoutRequestId: string | null;
  payoutStatus: "pending" | "approved" | "paid" | "rejected";
  payoutNotes: string | null;
  payoutUpdatedAt: string | null;
}

export async function loadAdminPayouts(): Promise<{ data?: AdminPayout[]; error?: string }> {
  const token = await getAccessToken();
  if (!token) return { error: "Sign in as admin." };

  const response = await fetch("/api/admin/payouts", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => ({})) as { payouts?: AdminPayout[]; error?: string };
  return response.ok ? { data: payload.payouts ?? [] } : { error: payload.error || "Could not load payouts." };
}

export async function markAdminPayoutPaid(orderId: string, notes?: string): Promise<{ error?: string }> {
  const token = await getAccessToken();
  if (!token) return { error: "Sign in as admin." };

  const response = await fetch(`/api/admin/payouts/${orderId}/mark-paid`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ notes }),
  });
  const payload = await response.json().catch(() => ({})) as { error?: string };
  return response.ok ? {} : { error: payload.error || "Could not mark payout as paid." };
}

async function getAccessToken() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return null;
  const expiresAtMs = (session.expires_at ?? 0) * 1000;
  if (expiresAtMs && expiresAtMs - Date.now() > 120_000) return session.access_token;
  const { data: refreshed } = await supabase.auth.refreshSession();
  return refreshed.session?.access_token ?? session.access_token;
}
