import { randomUUID } from "node:crypto";
import { corsJson, corsOptions } from "@/lib/apiCors";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { calculatePlatformFee, createMidtransSnapTransaction } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateBillBody {
  chatId?: string;
  amount?: number;
  title?: string;
  note?: string;
}

export function OPTIONS() {
  return corsOptions();
}

export async function POST(request: Request) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return corsJson({ error: "Payment server is not configured. Add SUPABASE_SERVICE_ROLE_KEY in Vercel." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
  if (!token) return corsJson({ error: "Sign in before creating a bill." }, { status: 401 });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return corsJson({ error: "Your session is not valid." }, { status: 401 });

  const body = await request.json().catch(() => ({})) as CreateBillBody;
  const amount = Math.round(Number(body.amount));
  const billTitle = cleanText(body.title, 120) || "SkillBridge bill";
  const billNote = cleanText(body.note, 1000);

  if (!body.chatId) return corsJson({ error: "Chat id is required." }, { status: 400 });
  if (!Number.isFinite(amount) || amount < 1000) return corsJson({ error: "Bill amount must be at least Rp 1.000." }, { status: 400 });

  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select("id,post_id,participant_one_id,participant_two_id")
    .eq("id", body.chatId)
    .maybeSingle();

  if (chatError) return corsJson({ error: chatError.message }, { status: 500 });
  if (!chat) return corsJson({ error: "Conversation not found." }, { status: 404 });
  if (![chat.participant_one_id, chat.participant_two_id].includes(userData.user.id)) {
    return corsJson({ error: "You are not part of this conversation." }, { status: 403 });
  }
  if (!chat.post_id) return corsJson({ error: "Bills must be connected to a post conversation." }, { status: 400 });

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id,user_id,title,work_type")
    .eq("id", chat.post_id)
    .maybeSingle();

  if (postError) return corsJson({ error: postError.message }, { status: 500 });
  if (!post) return corsJson({ error: "Post not found." }, { status: 404 });
  if (post.user_id !== userData.user.id) return corsJson({ error: "Only the post owner can create a bill." }, { status: 403 });

  const buyerId = chat.participant_one_id === userData.user.id ? chat.participant_two_id : chat.participant_one_id;
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id,full_name,email,verification_status,offline_job_access,is_banned")
    .in("id", [buyerId, userData.user.id]);

  if (profileError) return corsJson({ error: profileError.message }, { status: 500 });
  const buyer = profiles?.find((profile) => profile.id === buyerId);
  const seller = profiles?.find((profile) => profile.id === userData.user.id);

  if (!buyer || !seller) return corsJson({ error: "Buyer or seller profile is missing." }, { status: 400 });
  if (buyer.is_banned || seller.is_banned) return corsJson({ error: "Payments are unavailable for restricted accounts." }, { status: 403 });

  if (post.work_type === "offline") {
    const buyerVerified = buyer.verification_status === "approved" && buyer.offline_job_access;
    const sellerVerified = seller.verification_status === "approved" && seller.offline_job_access;
    if (!buyerVerified || !sellerVerified) {
      return corsJson({ error: "Both users must be verified before billing for offline work." }, { status: 403 });
    }
  }

  const platformFee = calculatePlatformFee(amount);
  const totalAmount = amount + platformFee;
  const orderId = randomUUID();

  const { error: orderError } = await supabase.from("orders").insert({
    id: orderId,
    post_id: post.id,
    chat_id: chat.id,
    buyer_id: buyerId,
    seller_id: userData.user.id,
    amount,
    platform_fee: platformFee,
    total_amount: totalAmount,
    currency: "IDR",
    bill_title: billTitle,
    bill_note: billNote,
    status: "pending_payment",
  });

  if (orderError) return corsJson({ error: orderError.message }, { status: 500 });

  try {
    const snap = await createMidtransSnapTransaction({
      orderId,
      grossAmount: totalAmount,
      postTitle: billTitle || post.title,
      buyerName: buyer.full_name,
      buyerEmail: buyer.email,
    });

    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: orderId,
      provider: "midtrans",
      provider_reference: orderId,
      checkout_url: snap.redirect_url,
      snap_token: snap.token,
      amount: totalAmount,
      status: "pending",
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    if (paymentError) return corsJson({ error: paymentError.message }, { status: 500 });

    await supabase.from("messages").insert({
      chat_id: chat.id,
      sender_id: userData.user.id,
      message: `Bill created: ${billTitle}\nAmount: Rp ${amount.toLocaleString("id-ID")}\nOpen the bill in this chat to pay safely through SkillBridge.`,
    });

    return corsJson({
      orderId,
      checkoutUrl: snap.redirect_url,
      token: snap.token,
    });
  } catch (error) {
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
    return corsJson({ error: error instanceof Error ? error.message : "Could not create bill checkout." }, { status: 500 });
  }
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
