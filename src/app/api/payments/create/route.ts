import { randomUUID } from "node:crypto";
import { corsJson, corsOptions } from "@/lib/apiCors";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { calculatePlatformFee, createMidtransSnapTransaction } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreatePaymentBody {
  postId?: string;
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
  if (!token) return corsJson({ error: "Sign in before paying." }, { status: 401 });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return corsJson({ error: "Your session is not valid. Please sign out, sign in again, and make sure Vercel uses the same Supabase project keys as the app." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as CreatePaymentBody;
  if (!body.postId) return corsJson({ error: "Post id is required." }, { status: 400 });

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id,user_id,title,budget_or_price,work_type")
    .eq("id", body.postId)
    .maybeSingle();

  if (postError) return corsJson({ error: postError.message }, { status: 500 });
  if (!post) return corsJson({ error: "Post not found." }, { status: 404 });
  if (post.user_id === userData.user.id) return corsJson({ error: "You cannot pay for your own post." }, { status: 400 });

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id,full_name,email,verification_status,offline_job_access,is_banned")
    .in("id", [userData.user.id, post.user_id]);

  if (profileError) return corsJson({ error: profileError.message }, { status: 500 });
  const buyer = profiles?.find((profile) => profile.id === userData.user.id);
  const seller = profiles?.find((profile) => profile.id === post.user_id);

  if (!buyer || !seller) return corsJson({ error: "Buyer or seller profile is missing." }, { status: 400 });
  if (buyer.is_banned || seller.is_banned) return corsJson({ error: "Payments are unavailable for restricted accounts." }, { status: 403 });

  if (post.work_type === "offline") {
    const buyerVerified = buyer.verification_status === "approved" && buyer.offline_job_access;
    const sellerVerified = seller.verification_status === "approved" && seller.offline_job_access;
    if (!buyerVerified || !sellerVerified) {
      return corsJson({ error: "Both users must be verified before paying for offline work." }, { status: 403 });
    }
  }

  const amount = Math.round(Number(post.budget_or_price));
  if (!Number.isFinite(amount) || amount < 1000) return corsJson({ error: "Post amount is not valid for checkout." }, { status: 400 });

  const platformFee = calculatePlatformFee(amount);
  const totalAmount = amount + platformFee;
  const orderId = randomUUID();

  const { error: orderError } = await supabase.from("orders").insert({
    id: orderId,
    post_id: post.id,
    buyer_id: userData.user.id,
    seller_id: post.user_id,
    amount,
    platform_fee: platformFee,
    total_amount: totalAmount,
    currency: "IDR",
    status: "pending_payment",
  });

  if (orderError) return corsJson({ error: orderError.message }, { status: 500 });

  try {
    const snap = await createMidtransSnapTransaction({
      orderId,
      grossAmount: totalAmount,
      postTitle: post.title,
      buyerName: buyer.full_name,
      buyerEmail: buyer.email || userData.user.email,
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

    return corsJson({
      orderId,
      checkoutUrl: snap.redirect_url,
      token: snap.token,
    });
  } catch (error) {
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
    return corsJson({ error: error instanceof Error ? error.message : "Could not create checkout." }, { status: 500 });
  }
}
