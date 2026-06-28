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
  if (!token) return corsJson({ error: "Sign in before accepting work." }, { status: 401 });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return corsJson({ error: "Your session is not valid." }, { status: 401 });

  const { id } = await params;
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,buyer_id,seller_id,amount,status,chat_id")
    .eq("id", id)
    .maybeSingle();

  if (orderError) return corsJson({ error: orderError.message }, { status: 500 });
  if (!order) return corsJson({ error: "Order not found." }, { status: 404 });
  if (order.buyer_id !== userData.user.id) return corsJson({ error: "Only the buyer can accept completed work." }, { status: 403 });
  if (order.status !== "release_requested") {
    return corsJson({ error: "The seller must submit completion before you can accept." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: "released", accepted_at: now, updated_at: now })
    .eq("id", id);

  if (updateError) return corsJson({ error: updateError.message }, { status: 500 });

  await supabase.from("escrow_releases").insert({
    order_id: id,
    amount: order.amount,
    status: "released",
    notes: "Buyer accepted completion. Manual payout can be processed by admin.",
    released_at: now,
  });

  if (order.chat_id) {
    await supabase.from("messages").insert({
      chat_id: order.chat_id,
      sender_id: userData.user.id,
      message: `Work accepted for order ${id.slice(0, 8)}. The order is now marked released in SkillBridge.`,
    });
  }

  return corsJson({ ok: true });
}
