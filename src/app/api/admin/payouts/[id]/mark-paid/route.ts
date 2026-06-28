import { corsJson, corsOptions } from "@/lib/apiCors";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface MarkPaidBody {
  notes?: string;
}

export function OPTIONS() {
  return corsOptions();
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({})) as MarkPaidBody;
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 1000) : "";
  const { supabase, adminId } = auth;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,seller_id,amount,status,profiles!orders_seller_id_fkey(payout_method,payout_provider,payout_account_name,payout_account_number)")
    .eq("id", id)
    .maybeSingle();

  if (orderError) return corsJson({ error: orderError.message }, { status: 500 });
  if (!order) return corsJson({ error: "Order not found." }, { status: 404 });
  if (order.status !== "released") {
    return corsJson({ error: "Only released orders can be marked as paid out." }, { status: 400 });
  }
  const sellerProfile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
  if (!sellerProfile?.payout_method || !sellerProfile.payout_provider || !sellerProfile.payout_account_name || !sellerProfile.payout_account_number) {
    return corsJson({ error: "Seller payout account is missing. Ask the seller to add Money details in their profile first." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { data: existingPayout } = await supabase
    .from("payout_requests")
    .select("id,status")
    .eq("order_id", id)
    .maybeSingle();

  if (existingPayout) {
    const { error } = await supabase
      .from("payout_requests")
      .update({
        status: "paid",
        admin_id: adminId,
        notes: notes || "Manual payout marked paid by admin.",
        updated_at: now,
      })
      .eq("id", existingPayout.id);
    if (error) return corsJson({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from("payout_requests").insert({
      order_id: id,
      seller_id: order.seller_id,
      amount: order.amount,
      status: "paid",
      admin_id: adminId,
      notes: notes || "Manual payout marked paid by admin.",
      created_at: now,
      updated_at: now,
    });
    if (error) return corsJson({ error: error.message }, { status: 500 });
  }

  return corsJson({ ok: true });
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
