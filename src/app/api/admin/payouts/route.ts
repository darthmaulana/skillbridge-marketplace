import { corsJson, corsOptions } from "@/lib/apiCors";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return corsOptions();
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  const { supabase } = auth;
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id,post_id,buyer_id,seller_id,amount,platform_fee,total_amount,currency,status,bill_title,completion_url,completion_note,accepted_at,created_at,posts(title,post_type),payments(status,paid_at),payout_requests(id,status,notes,updated_at)")
    .in("status", ["released", "refunded", "disputed"])
    .order("accepted_at", { ascending: false, nullsFirst: false });

  if (error) return corsJson({ error: error.message }, { status: 500 });

  const rows = orders ?? [];
  const profileIds = [...new Set(rows.flatMap((order) => [order.buyer_id, order.seller_id]))];
  const { data: profiles, error: profileError } = profileIds.length
    ? await supabase.from("profiles").select("id,full_name,email,payout_method,payout_provider,payout_account_name,payout_account_number,payout_notes").in("id", profileIds)
    : { data: [], error: null };

  if (profileError) return corsJson({ error: profileError.message }, { status: 500 });

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const payouts = rows.map((order) => {
    const payout = Array.isArray(order.payout_requests) ? order.payout_requests[0] : null;
    const post = Array.isArray(order.posts) ? order.posts[0] : order.posts;
    return {
      id: order.id,
      postTitle: post?.title ?? order.bill_title ?? "SkillBridge order",
      postType: post?.post_type ?? null,
      billTitle: order.bill_title,
      buyerName: profileById.get(order.buyer_id)?.full_name ?? "Unknown buyer",
      buyerEmail: profileById.get(order.buyer_id)?.email ?? null,
      sellerName: profileById.get(order.seller_id)?.full_name ?? "Unknown seller",
      sellerEmail: profileById.get(order.seller_id)?.email ?? null,
      sellerPayoutMethod: profileById.get(order.seller_id)?.payout_method ?? null,
      sellerPayoutProvider: profileById.get(order.seller_id)?.payout_provider ?? null,
      sellerPayoutAccountName: profileById.get(order.seller_id)?.payout_account_name ?? null,
      sellerPayoutAccountNumber: profileById.get(order.seller_id)?.payout_account_number ?? null,
      sellerPayoutNotes: profileById.get(order.seller_id)?.payout_notes ?? null,
      amount: order.amount,
      platformFee: order.platform_fee,
      totalAmount: order.total_amount,
      currency: order.currency,
      status: order.status,
      paymentStatus: Array.isArray(order.payments) ? order.payments[0]?.status ?? null : null,
      paidAt: Array.isArray(order.payments) ? order.payments[0]?.paid_at ?? null : null,
      completionUrl: order.completion_url,
      completionNote: order.completion_note,
      acceptedAt: order.accepted_at,
      createdAt: order.created_at,
      payoutRequestId: payout?.id ?? null,
      payoutStatus: payout?.status ?? "pending",
      payoutNotes: payout?.notes ?? null,
      payoutUpdatedAt: payout?.updated_at ?? null,
    };
  });

  return corsJson({ payouts });
}

async function requireAdmin(request: Request) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return { response: corsJson({ error: "Admin payout server is not configured. Add SUPABASE_SERVICE_ROLE_KEY in Vercel." }, { status: 500 }) };
  }

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
  if (!token) return { response: corsJson({ error: "Sign in as admin." }, { status: 401 }) };

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return { response: corsJson({ error: "Your admin session is not valid." }, { status: 401 }) };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,role,is_banned")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError) return { response: corsJson({ error: profileError.message }, { status: 500 }) };
  if (!profile || profile.role !== "admin" || profile.is_banned) {
    return { response: corsJson({ error: "Admin access required." }, { status: 403 }) };
  }

  return { supabase, adminId: userData.user.id };
}
