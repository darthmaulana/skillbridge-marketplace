import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, ExternalLink, Wallet } from "lucide-react";
import type { AdminPayout } from "@/lib/adminPayouts";
import { toExternalUrl } from "@/lib/url";
import { AdminPage, AsyncState, SearchBox } from "./AdminUsersScreen";

interface Props {
  payouts: AdminPayout[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onRetry: () => void;
  onMarkPaid: (orderId: string, notes?: string) => Promise<{ error?: string }>;
}

export function AdminPayoutsScreen({ payouts, loading, error, onBack, onRetry, onMarkPaid }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminPayout | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const clean = query.toLowerCase();
    return payouts.filter((payout) => `${payout.postTitle} ${payout.sellerName} ${payout.buyerName} ${payout.payoutStatus}`.toLowerCase().includes(clean));
  }, [payouts, query]);
  const pendingCount = payouts.filter((payout) => payout.status === "released" && payout.payoutStatus !== "paid").length;

  const markPaid = async () => {
    if (!selected) return;
    setSaving(true);
    setActionError(null);
    const result = await onMarkPaid(selected.id, notes);
    setSaving(false);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    setSelected(null);
    setNotes("");
  };

  return (
    <AdminPage title="Payouts" subtitle={`${pendingCount} order${pendingCount === 1 ? "" : "s"} need payout`} onBack={onBack}>
      <SearchBox value={query} onChange={setQuery} placeholder="Search order, seller, buyer..." />
      <AsyncState loading={loading} error={error} empty={!filtered.length} onRetry={onRetry} emptyText="No accepted orders found." />

      {!loading && !error && (
        <div className="flex flex-col gap-3">
          {filtered.map((payout) => {
            const needsPayout = payout.status === "released" && payout.payoutStatus !== "paid";
            const hasPayoutDetails = Boolean(payout.sellerPayoutMethod && payout.sellerPayoutProvider && payout.sellerPayoutAccountName && payout.sellerPayoutAccountNumber);
            const completionHref = toExternalUrl(payout.completionUrl);
            return (
              <article key={payout.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${needsPayout ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {needsPayout ? <Wallet size={20} /> : <CheckCircle2 size={20} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Badge tone={needsPayout ? "warning" : "success"}>{needsPayout ? "Needs payout" : "Paid"}</Badge>
                      <Badge>{payout.postType || "order"}</Badge>
                    </div>
                    <h2 className="font-semibold text-foreground">{payout.billTitle || payout.postTitle}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Seller: {payout.sellerName} {payout.sellerEmail ? `(${payout.sellerEmail})` : ""}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Buyer: {payout.buyerName}</p>
                    <div className={`mt-3 rounded-xl border p-3 text-xs ${hasPayoutDetails ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                      <p className="font-bold">{hasPayoutDetails ? "Seller payout account" : "Seller payout account missing"}</p>
                      {hasPayoutDetails ? (
                        <div className="mt-1 space-y-0.5">
                          <p>Method: <span className="font-semibold capitalize">{payout.sellerPayoutMethod}</span></p>
                          <p>Provider: <span className="font-semibold">{payout.sellerPayoutProvider}</span></p>
                          <p>Name: <span className="font-semibold">{payout.sellerPayoutAccountName}</span></p>
                          <p>Number: <span className="font-semibold">{payout.sellerPayoutAccountNumber}</span></p>
                          {payout.sellerPayoutNotes && <p>Note: {payout.sellerPayoutNotes}</p>}
                        </div>
                      ) : (
                        <p className="mt-1">Ask the seller to add Money details in their Profile before you transfer.</p>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <AmountBox label="Payout to seller" value={payout.amount} strong />
                      <AmountBox label="Platform fee" value={payout.platformFee} />
                    </div>
                    {completionHref && (
                      <a href={completionHref} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        View completion proof <ExternalLink size={12} />
                      </a>
                    )}
                    {payout.completionUrl && !completionHref && <p className="mt-2 rounded-xl bg-muted p-2 text-xs text-muted-foreground">Completion proof: {payout.completionUrl}</p>}
                    {payout.completionNote && <p className="mt-2 rounded-xl bg-muted p-2 text-xs text-muted-foreground">{payout.completionNote}</p>}
                    {payout.acceptedAt && <p className="mt-2 text-xs text-muted-foreground">Accepted {formatDateTime(payout.acceptedAt)}</p>}
                    {payout.payoutNotes && <p className="mt-2 text-xs text-muted-foreground">Payout note: {payout.payoutNotes}</p>}
                  </div>
                </div>
                {needsPayout && (
                  <button
                    onClick={() => { setSelected(payout); setNotes(""); setActionError(null); }}
                    disabled={!hasPayoutDetails}
                    className="mt-4 w-full rounded-2xl bg-primary py-2.5 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                  >
                    Mark Manual Payout Paid
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-card p-5">
            <h2 className="font-bold">Confirm payout paid</h2>
            <p className="mt-1 text-sm text-muted-foreground">Transfer {formatMoney(selected.amount)} to {selected.sellerName}, then mark it paid here.</p>
            <div className="mt-3 rounded-xl bg-muted p-3 text-sm">
              <p><span className="text-muted-foreground">Provider:</span> <span className="font-semibold">{selected.sellerPayoutProvider}</span></p>
              <p><span className="text-muted-foreground">Account name:</span> <span className="font-semibold">{selected.sellerPayoutAccountName}</span></p>
              <p><span className="text-muted-foreground">Account number:</span> <span className="font-semibold">{selected.sellerPayoutAccountNumber}</span></p>
            </div>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="field mt-4 resize-none" placeholder="Optional payout reference or bank transfer note" />
            {actionError && <p className="mt-3 text-sm text-destructive">{actionError}</p>}
            <div className="mt-4 flex gap-3">
              <button onClick={() => setSelected(null)} className="flex-1 rounded-2xl border border-border py-3 font-semibold">Cancel</button>
              <button disabled={saving} onClick={() => void markPaid()} className="flex-1 rounded-2xl bg-emerald-600 py-3 font-semibold text-white disabled:bg-muted">
                {saving ? "Saving..." : "Mark Paid"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPage>
  );
}

function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warning" | "success" }) {
  const className = tone === "warning"
    ? "bg-amber-50 text-amber-700"
    : tone === "success"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${className}`}>{children}</span>;
}

function AmountBox({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="rounded-xl bg-muted p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className={strong ? "font-bold text-primary" : "font-semibold text-foreground"}>{formatMoney(value)}</p>
    </div>
  );
}

function formatMoney(value: number) {
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
