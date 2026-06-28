"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ChevronLeft, Clock, CreditCard, ShieldCheck } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface OrderRow {
  id: string;
  amount: number;
  platform_fee: number;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
  posts?: { title?: string | null } | null;
  payments?: Array<{ status: string; checkout_url: string | null; paid_at: string | null }> | null;
}

export default function ClientPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Orders require Supabase mode.");
      setLoading(false);
      return;
    }

    void (async () => {
      setLoading(true);
      setError(null);
      const { data, error: orderError } = await supabase
        .from("orders")
        .select("id,amount,platform_fee,total_amount,currency,status,created_at,posts(title),payments(status,checkout_url,paid_at)")
        .eq("id", params.id)
        .maybeSingle();

      if (orderError) setError(orderError.message);
      else setOrder(data as OrderRow | null);
      setLoading(false);
    })();
  }, [params.id]);

  const payment = order?.payments?.[0];

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-3 border-b-2 border-foreground bg-card px-4 pb-4 pt-12">
        <button onClick={() => router.replace("/home")} aria-label="Back home" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="font-bold">Order Status</h1>
          <p className="text-xs text-muted-foreground">Safe payment tracking</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {loading && <div className="grid h-48 place-items-center text-sm text-muted-foreground">Loading order...</div>}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
            <AlertCircle className="mx-auto text-destructive" />
            <p className="mt-2 text-sm text-destructive">{error}</p>
          </div>
        )}

        {!loading && !error && !order && (
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <p className="font-semibold">Order not found</p>
            <p className="mt-1 text-sm text-muted-foreground">It may still be processing or unavailable for your account.</p>
          </div>
        )}

        {order && (
          <div className="flex flex-col gap-4">
            <section className="rounded-2xl border-2 border-foreground bg-card p-5 shadow-[4px_4px_0_#26231d]">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-foreground bg-[#f3c969]">
                  <ShieldCheck size={21} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Order</p>
                  <h2 className="font-bold">{order.posts?.title || "SkillBridge order"}</h2>
                </div>
              </div>
              <StatusPill status={order.status} />
              <div className="mt-5 space-y-2 text-sm">
                <Row label="Work amount" value={formatMoney(order.amount)} />
                <Row label="Platform fee" value={formatMoney(order.platform_fee)} />
                <Row label="Total paid" value={formatMoney(order.total_amount)} />
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <CreditCard size={18} className="mt-0.5 text-primary" />
                <div>
                  <p className="font-semibold">Payment status: {payment?.status || "pending"}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Paid orders are held by the platform workflow until completion or admin dispute resolution.
                  </p>
                  {payment?.checkout_url && payment.status === "pending" && (
                    <a href={payment.checkout_url} className="mt-3 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                      Continue Payment
                    </a>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock size={14} />
                Created {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.created_at))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  const className = status === "paid_held" || status === "released"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : status === "disputed"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : status === "cancelled" || status === "refunded"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-border bg-muted text-muted-foreground";

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${className}`}>{label}</span>;
}

function formatMoney(value: number) {
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
}
