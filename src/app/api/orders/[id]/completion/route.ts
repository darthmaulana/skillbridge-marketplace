import { corsJson, corsOptions } from "@/lib/apiCors";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CompletionBody {
  completionUrl?: string;
  completionNote?: string;
}

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
  if (!token) return corsJson({ error: "Sign in before submitting completion." }, { status: 401 });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return corsJson({ error: "Your session is not valid. Please sign out, sign in again, and make sure Vercel uses the same Supabase project keys as the app." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({})) as CompletionBody;
  const completionUrl = cleanText(body.completionUrl, 500);
  const completionNote = cleanText(body.completionNote, 2000);

  if (!completionUrl && !completionNote) {
    return corsJson({ error: "Add a link or note showing the completed work." }, { status: 400 });
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,seller_id,status,chat_id")
    .eq("id", id)
    .maybeSingle();

  if (orderError) return corsJson({ error: orderError.message }, { status: 500 });
  if (!order) return corsJson({ error: "Order not found." }, { status: 404 });
  if (order.seller_id !== userData.user.id) return corsJson({ error: "Only the seller can submit completion." }, { status: 403 });
  if (!["paid_held", "in_progress", "release_requested"].includes(order.status)) {
    return corsJson({ error: "Completion can be submitted after the buyer has paid." }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      completion_url: completionUrl || null,
      completion_note: completionNote || null,
      completion_submitted_at: new Date().toISOString(),
      status: "release_requested",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) return corsJson({ error: updateError.message }, { status: 500 });

  if (order.chat_id) {
    await supabase.from("messages").insert({
      chat_id: order.chat_id,
      sender_id: userData.user.id,
      message: `Completion submitted for order ${id.slice(0, 8)}. Please review it from the order card.`,
    });
  }

  return corsJson({ ok: true });
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
