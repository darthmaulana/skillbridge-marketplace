import { getSupabaseBrowserClient } from "@/lib/supabase";

export interface EarningsSummary {
  pending: number;
  paid: number;
  released: number;
  payoutAccountReady: boolean;
}

interface OrderRow {
  id: string;
  amount: number;
  status: string;
  payout_requests?: Array<{ status: string }> | null;
}

export async function loadEarningsSummary(userId: string): Promise<{ data?: EarningsSummary; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { data: { pending: 0, paid: 0, released: 0, payoutAccountReady: true } };
  }

  const [{ data: orders, error: ordersError }, { data: profile, error: profileError }] = await Promise.all([
    supabase
      .from("orders")
      .select("id,amount,status,payout_requests(status)")
      .eq("seller_id", userId)
      .in("status", ["paid_held", "in_progress", "release_requested", "released"]),
    supabase
      .from("profiles")
      .select("payout_method,payout_provider,payout_account_name,payout_account_number")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if (ordersError) return { error: ordersError.message };
  if (profileError) return { error: profileError.message };

  let pending = 0;
  let paid = 0;
  let released = 0;

  for (const order of (orders ?? []) as OrderRow[]) {
    const payout = order.payout_requests?.[0];
    if (payout?.status === "paid") {
      paid += Number(order.amount) || 0;
      continue;
    }
    if (order.status === "released") released += Number(order.amount) || 0;
    else pending += Number(order.amount) || 0;
  }

  return {
    data: {
      pending,
      paid,
      released,
      payoutAccountReady: Boolean(profile?.payout_method && profile.payout_provider && profile.payout_account_name && profile.payout_account_number),
    },
  };
}
