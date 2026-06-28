import "server-only";

import crypto from "node:crypto";
import { getAppUrl, serverEnv } from "@/lib/serverEnv";

export type PaymentStatus = "pending" | "paid" | "failed" | "expired" | "cancelled" | "refunded";
export type OrderStatus = "pending_payment" | "paid_held" | "in_progress" | "completed" | "release_requested" | "released" | "disputed" | "cancelled" | "refunded";

interface CreateSnapInput {
  orderId: string;
  grossAmount: number;
  postTitle: string;
  buyerName: string;
  buyerEmail?: string | null;
}

interface SnapResponse {
  token: string;
  redirect_url: string;
}

export function calculatePlatformFee(amount: number) {
  return Math.max(1000, Math.round(amount * 0.05));
}

export function getMidtransApiBaseUrl() {
  return serverEnv.midtransIsProduction
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";
}

export async function createMidtransSnapTransaction(input: CreateSnapInput) {
  if (!serverEnv.midtransSecretKey) {
    throw new Error("MIDTRANS_SECRET_KEY is not configured.");
  }

  const appUrl = getAppUrl();
  const response = await fetch(`${getMidtransApiBaseUrl()}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${serverEnv.midtransSecretKey}:`).toString("base64")}`,
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: input.orderId,
        gross_amount: input.grossAmount,
      },
      item_details: [
        {
          id: input.orderId,
          price: input.grossAmount,
          quantity: 1,
          name: input.postTitle.slice(0, 50),
        },
      ],
      customer_details: {
        first_name: input.buyerName,
        email: input.buyerEmail || undefined,
      },
      callbacks: {
        finish: `${appUrl}/orders/${input.orderId}`,
      },
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error_messages?.join(" ") || payload?.message || "Could not create Midtrans checkout.";
    throw new Error(message);
  }

  return payload as SnapResponse;
}

export function verifyMidtransSignature(payload: Record<string, unknown>) {
  if (!serverEnv.midtransSecretKey) return false;
  const orderId = String(payload.order_id || "");
  const statusCode = String(payload.status_code || "");
  const grossAmount = String(payload.gross_amount || "");
  const signature = String(payload.signature_key || "");
  if (!orderId || !statusCode || !grossAmount || !signature) return false;

  const expected = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverEnv.midtransSecretKey}`)
    .digest("hex");

  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function mapMidtransPaymentStatus(transactionStatus?: string, fraudStatus?: string): PaymentStatus {
  if (transactionStatus === "capture") return fraudStatus === "challenge" ? "pending" : "paid";
  if (transactionStatus === "settlement") return "paid";
  if (transactionStatus === "pending") return "pending";
  if (transactionStatus === "expire") return "expired";
  if (transactionStatus === "cancel") return "cancelled";
  if (transactionStatus === "deny" || transactionStatus === "failure") return "failed";
  if (transactionStatus === "refund" || transactionStatus === "partial_refund") return "refunded";
  return "pending";
}

export function orderStatusFromPayment(status: PaymentStatus): OrderStatus {
  if (status === "paid") return "paid_held";
  if (status === "expired" || status === "cancelled") return "cancelled";
  if (status === "refunded") return "refunded";
  return "pending_payment";
}
