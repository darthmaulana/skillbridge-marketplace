import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { mapMidtransPaymentStatus, orderStatusFromPayment, verifyMidtransSignature } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "Payment server is not configured." }, { status: 500 });

  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!payload) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  if (!verifyMidtransSignature(payload)) return NextResponse.json({ error: "Invalid signature." }, { status: 401 });

  const orderId = String(payload.order_id || "");
  const transactionStatus = String(payload.transaction_status || "");
  const fraudStatus = String(payload.fraud_status || "");
  const paymentStatus = mapMidtransPaymentStatus(transactionStatus, fraudStatus);
  const orderStatus = orderStatusFromPayment(paymentStatus);

  const { data: payment, error: paymentLookupError } = await supabase
    .from("payments")
    .select("id,order_id,status")
    .eq("provider", "midtrans")
    .eq("provider_reference", orderId)
    .maybeSingle();

  if (paymentLookupError) return NextResponse.json({ error: paymentLookupError.message }, { status: 500 });
  if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });

  await supabase.from("payment_events").insert({
    payment_id: payment.id,
    provider: "midtrans",
    event_type: transactionStatus || "notification",
    event_payload: payload,
  });

  const paidAt = paymentStatus === "paid" ? new Date().toISOString() : null;
  const { error: paymentUpdateError } = await supabase
    .from("payments")
    .update({
      status: paymentStatus,
      paid_at: paidAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  if (paymentUpdateError) return NextResponse.json({ error: paymentUpdateError.message }, { status: 500 });

  const { error: orderUpdateError } = await supabase
    .from("orders")
    .update({
      status: orderStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.order_id);

  if (orderUpdateError) return NextResponse.json({ error: orderUpdateError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
