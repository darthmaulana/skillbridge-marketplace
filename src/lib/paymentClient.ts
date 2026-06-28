import { getSupabaseBrowserClient } from "@/lib/supabase";

export interface CheckoutResult {
  orderId?: string;
  checkoutUrl?: string;
  error?: string;
}

export async function createPaymentCheckout(postId: string): Promise<CheckoutResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: "Payments require Supabase mode." };

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { error: "Sign in before paying." };

  const response = await fetch("/api/payments/create", {
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
