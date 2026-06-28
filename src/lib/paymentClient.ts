import { getSupabaseBrowserClient } from "@/lib/supabase";

export interface CheckoutResult {
  orderId?: string;
  checkoutUrl?: string;
  error?: string;
}

export interface ChatOrder {
  id: string;
  chat_id: string | null;
  buyer_id: string;
  seller_id: string;
  amount: number;
  platform_fee: number;
  total_amount: number;
  currency: string;
  status: string;
  bill_title: string | null;
  bill_note: string | null;
  completion_url: string | null;
  completion_note: string | null;
  completion_submitted_at: string | null;
  accepted_at: string | null;
  created_at: string;
  payments?: Array<{ status: string; checkout_url: string | null; paid_at: string | null }> | null;
}

export async function createPaymentCheckout(postId: string): Promise<CheckoutResult> {
  const token = await getAccessToken();
  if (!token) return { error: "Sign in before paying." };

  const response = await fetch(apiUrl("/api/payments/create"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ postId }),
  });

  const payload = await response.json().catch(() => ({})) as CheckoutResult;
  if (!response.ok) return { error: payload.error || "Could not start checkout." };
  return payload;
}

export async function createBillCheckout(input: { chatId: string; amount: number; title: string; note?: string }): Promise<CheckoutResult> {
  const token = await getAccessToken();
  if (!token) return { error: "Sign in before creating a bill." };

  const response = await fetch(apiUrl("/api/payments/bills"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const payload = await response.json().catch(() => ({})) as CheckoutResult;
  if (!response.ok) return { error: payload.error || "Could not create bill." };
  return payload;
}

export async function loadChatOrders(chatId: string): Promise<{ data?: ChatOrder[]; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: [] };

  const { data, error } = await supabase
    .from("orders")
    .select("id,chat_id,buyer_id,seller_id,amount,platform_fee,total_amount,currency,status,bill_title,bill_note,completion_url,completion_note,completion_submitted_at,accepted_at,created_at,payments(status,checkout_url,paid_at)")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false });

  return error ? { error: error.message } : { data: data as ChatOrder[] };
}

export async function submitOrderCompletion(orderId: string, input: { completionUrl?: string; completionNote?: string }) {
  const token = await getAccessToken();
  if (!token) return { error: "Sign in before submitting completion." };

  const response = await fetch(apiUrl(`/api/orders/${orderId}/completion`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const payload = await response.json().catch(() => ({})) as { error?: string };
  return response.ok ? {} : { error: payload.error || "Could not submit completion." };
}

export async function acceptOrderCompletion(orderId: string) {
  const token = await getAccessToken();
  if (!token) return { error: "Sign in before accepting work." };

  const response = await fetch(apiUrl(`/api/orders/${orderId}/accept`), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const payload = await response.json().catch(() => ({})) as { error?: string };
  return response.ok ? {} : { error: payload.error || "Could not accept work." };
}

export async function cancelOrderBill(orderId: string) {
  const token = await getAccessToken();
  if (!token) return { error: "Sign in before cancelling a bill." };

  const response = await fetch(apiUrl(`/api/orders/${orderId}/cancel`), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const payload = await response.json().catch(() => ({})) as { error?: string };
  return response.ok ? {} : { error: payload.error || "Could not cancel bill." };
}

async function getAccessToken() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return null;

  const expiresAtMs = (session.expires_at ?? 0) * 1000;
  const shouldRefresh = !expiresAtMs || expiresAtMs - Date.now() < 120_000;
  if (!shouldRefresh) return session.access_token;

  const { data: refreshed, error } = await supabase.auth.refreshSession();
  if (error || !refreshed.session) return session.access_token;
  return refreshed.session.access_token;
}

function apiUrl(path: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl || appUrl.includes("localhost") || appUrl.includes("127.0.0.1")) return path;
  return `${appUrl.replace(/\/$/, "")}${path}`;
}
