import { corsJson, corsOptions } from "@/lib/apiCors";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return corsOptions();
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return corsJson({ error: "Order server is not configured. Add SUPABASE_SERVICE_ROLE_KEY in Vercel." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
  if (!token) return corsJson({ error: "Sign in before cancelling a bill." }, { status: 401 });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return corsJson({ error: "Your session is not valid. Please sign out, sign in again, and make sure Vercel uses the same Supabase project keys as the app." }, { status: 401 });
  }

  const { id } = await params;
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,buyer_id,seller_id,status,chat_id,payments(status)")
    .eq("id", id)
    .maybeSingle();

  if (orderError) return corsJson({ error: orderError.message }, { status: 500 });
  if (!order) return corsJson({ error: "Bill not found." }, { status: 404 });
  if (![order.buyer_id, order.seller_id].includes(userData.user.id)) {
    return corsJson({ error: "Only order participants can cancel this unpaid bill." }, { status: 403 });
  }
  if (order.status !== "pending_payment") {
    return corsJson({ error: "Only unpaid bills can be cancelled. Paid orders need refund/dispute handling." }, { status: 400 });
  }

  const hasPaidPayment = Array.isArray(order.payments) && order.payments.some((payment) => payment.status === "paid");
  if (hasPaidPayment) {
    return corsJson({ error: "This bill has already been paid and cannot be cancelled here." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: "cancelled", updated_at: now })
    .eq("id", id);

  if (updateError) return corsJson({ error: updateError.message }, { status: 500 });

  await supabase
    .from("payments")
    .update({ status: "cancelled", updated_at: now })
    .eq("order_id", id)
    .eq("status", "pending");

  if (order.chat_id) {
    await supabase.from("messages").insert({
      chat_id: order.chat_id,
      sender_id: userData.user.id,
      message: `Bill ${id.slice(0, 8)} was cancelled before payment.`,
    });
  }

  return corsJson({ ok: true });
}
