import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, Eye, FileImage, RefreshCw, ShieldOff, XCircle } from "lucide-react";
import type {
  AdminVerificationRequest,
  VerificationPreviewUrls,
  VerificationReviewAction,
} from "@/lib/adminVerification";

interface Props {
  requests: AdminVerificationRequest[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onRetry: () => void;
  onLoadPreviews: (request: AdminVerificationRequest) => Promise<{ data?: VerificationPreviewUrls; error?: string }>;
  onReview: (requestId: string, action: VerificationReviewAction, reason?: string) => Promise<{ error?: string }>;
}

export function AdminVerificationScreen({
  requests,
  loading,
  error,
  onBack,
  onRetry,
  onLoadPreviews,
  onReview,
}: Props) {
  const [selected, setSelected] = useState<AdminVerificationRequest | null>(null);
  const [previews, setPreviews] = useState<VerificationPreviewUrls | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [action, setAction] = useState<VerificationReviewAction | null>(null);
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pending = useMemo(() => requests.filter((request) => request.status === "pending"), [requests]);
  const reviewed = useMemo(() => requests.filter((request) => request.status !== "pending"), [requests]);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    setPreviews(null);
    setPreviewError(null);
    setPreviewLoading(true);
    onLoadPreviews(selected).then((result) => {
      if (!active) return;
      setPreviewLoading(false);
      if (result.error) setPreviewError(result.error);
      else setPreviews(result.data ?? null);
    });
    return () => {
      active = false;
    };
  }, [onLoadPreviews, selected]);

  const closeRequest = () => {
    setSelected(null);
    setAction(null);
    setReason("");
    setActionError(null);
    setPreviews(null);
  };

  const review = async (reviewAction: VerificationReviewAction) => {
    if (!selected || submitting) return;
    setSubmitting(true);
    setActionError(null);
    const result = await onReview(selected.id, reviewAction, reason);
    setSubmitting(false);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    closeRequest();
  };

  if (selected) {
    const needsReason = action && action !== "approve";
    return (
      <div className="flex h-full flex-col bg-background">
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 pb-4 pt-5">
          <button onClick={closeRequest} aria-label="Back to requests" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><ChevronLeft size={20} /></button>
          <div className="min-w-0">
            <h1 className="font-bold">Review Verification</h1>
            <p className="truncate text-xs text-muted-foreground">{selected.userName}</p>
          </div>
          <StatusBadge status={selected.status} className="ml-auto" />
        </header>

        <div className="flex-1 overflow-y-auto px-4 pb-10 pt-4">
          <section className="mb-4 rounded-2xl border border-border bg-card p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Account name" value={selected.userName} />
              <Detail label="Legal name" value={selected.legalName} />
              <Detail label="Email" value={selected.userEmail} className="col-span-2" />
              <Detail label="Submitted" value={formatDate(selected.submittedAt)} className="col-span-2" />
              {selected.reviewedAt && <Detail label="Reviewed" value={formatDate(selected.reviewedAt)} className="col-span-2" />}
            </div>
            {selected.isBanned && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-destructive">This account is banned.</p>}
          </section>

          <PrivatePreview
            label="KTP Photo"
            url={previews?.ktpUrl ?? null}
            loading={previewLoading}
            error={previewError}
          />
          <PrivatePreview
            label="Selfie with KTP"
            url={previews?.selfieUrl ?? null}
            loading={previewLoading}
            error={previewError}
          />

          <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs leading-relaxed text-blue-800">
            These images come from private storage through temporary signed links that expire after five minutes. Do not download or share them outside the review process.
          </div>

          {selected.rejectionReason && selected.status === "rejected" && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-destructive">Previous review reason</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-red-700">{selected.rejectionReason}</p>
            </div>
          )}

          {selected.status === "pending" && (
            <>
              {needsReason && (
                <section className="mb-4 rounded-2xl border border-border bg-card p-4">
                  <label className="mb-2 block text-sm font-semibold text-muted-foreground">
                    {action === "ban" ? "Ban reason *" : action === "resubmit" ? "What must be resubmitted? *" : "Rejection reason *"}
                  </label>
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    rows={4}
                    maxLength={1000}
                    placeholder="Give the user a clear and specific explanation."
                    className="field resize-none"
                  />
                </section>
              )}

              {actionError && <div className="mb-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-destructive"><AlertCircle size={17} />{actionError}</div>}

              {action ? (
                <div className="flex flex-col gap-3">
                  <button
                    disabled={submitting || (action !== "approve" && !reason.trim())}
                    onClick={() => void review(action)}
                    className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold text-white disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground ${action === "approve" ? "bg-emerald-500" : action === "ban" ? "bg-destructive" : "bg-amber-600"}`}
                  >
                    {submitting ? "Saving Review..." : `Confirm ${actionLabel(action)}`}
                  </button>
                  <button onClick={() => { setAction(null); setReason(""); setActionError(null); }} className="w-full rounded-2xl border border-border py-3.5 text-sm font-semibold">Cancel</button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <ActionButton onClick={() => setAction("approve")} icon={<CheckCircle2 size={18} />} label="Approve Verification" className="bg-emerald-500 text-white" />
                  <ActionButton onClick={() => setAction("reject")} icon={<XCircle size={18} />} label="Reject" className="border border-destructive/40 text-destructive" />
                  <ActionButton onClick={() => setAction("resubmit")} icon={<RefreshCw size={18} />} label="Request Resubmission" className="border border-amber-200 bg-amber-50 text-amber-700" />
                  <ActionButton onClick={() => setAction("ban")} icon={<ShieldOff size={18} />} label="Ban Suspicious Account" className="border border-red-200 bg-red-50 text-destructive" />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 pb-4 pt-5">
        <button onClick={onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><ChevronLeft size={20} /></button>
        <div>
          <h1 className="font-bold">Verification Requests</h1>
          <p className="text-xs text-muted-foreground">{pending.length} pending review</p>
        </div>
        {pending.length > 0 && <span className="ml-auto flex h-7 min-w-7 items-center justify-center rounded-full bg-amber-500 px-2 text-xs font-bold text-white">{pending.length}</span>}
      </header>

      <div className="flex-1 overflow-y-auto pb-8">
        {loading && <div className="grid h-52 place-items-center text-sm text-muted-foreground">Loading verification requests...</div>}
        {!loading && error && (
          <div className="mx-4 mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
            <AlertCircle size={24} className="mx-auto text-destructive" />
            <p className="mt-2 text-sm text-destructive">{error}</p>
            <button onClick={onRetry} className="mt-3 text-sm font-semibold text-primary">Try again</button>
          </div>
        )}
        {!loading && !error && requests.length === 0 && (
          <div className="mx-4 mt-8 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
            <CheckCircle2 size={30} className="mx-auto text-emerald-500" />
            <h2 className="mt-3 font-semibold">No verification requests</h2>
            <p className="mt-1 text-sm text-muted-foreground">New submissions will appear here.</p>
          </div>
        )}
        {!loading && !error && pending.length > 0 && (
          <RequestSection title="Pending Review" requests={pending} onSelect={setSelected} />
        )}
        {!loading && !error && reviewed.length > 0 && (
          <RequestSection title="Reviewed" requests={reviewed} onSelect={setSelected} />
        )}
      </div>
    </div>
  );
}

function RequestSection({ title, requests, onSelect }: { title: string; requests: AdminVerificationRequest[]; onSelect: (request: AdminVerificationRequest) => void }) {
  return (
    <section className="px-4 pt-5">
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{title}</h2>
      <div className="flex flex-col gap-3">
        {requests.map((request) => (
          <button key={request.id} onClick={() => onSelect(request)} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left active:bg-muted">
            <div className="avatar-fallback flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold">{request.userName.charAt(0)}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{request.userName}</p>
              <p className="truncate text-xs text-muted-foreground">{request.legalName}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(request.submittedAt)}</p>
            </div>
            <StatusBadge status={request.status} />
          </button>
        ))}
      </div>
    </section>
  );
}

function PrivatePreview({ label, url, loading, error }: { label: string; url: string | null; loading: boolean; error: string | null }) {
  return (
    <section className="mb-4 rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold">{label}</span>
        {url && <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary"><Eye size={14} />View full</a>}
      </div>
      <div className="grid h-44 place-items-center overflow-hidden rounded-xl bg-muted">
        {loading ? <span className="text-xs text-muted-foreground">Creating secure preview...</span>
          : error ? <span className="px-4 text-center text-xs text-destructive">{error}</span>
            : url ? <img src={url} alt={label} className="h-full w-full object-contain" />
              : <div className="text-center"><FileImage size={28} className="mx-auto text-muted-foreground" /><p className="mt-2 text-xs text-muted-foreground">Private preview unavailable in demo mode</p></div>}
      </div>
    </section>
  );
}

function Detail({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return <div className={className}><span className="text-xs text-muted-foreground">{label}</span><p className="break-words font-semibold text-foreground">{value}</p></div>;
}

function ActionButton({ onClick, icon, label, className }: { onClick: () => void; icon: React.ReactNode; label: string; className: string }) {
  return <button onClick={onClick} className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold ${className}`}>{icon}{label}</button>;
}

function StatusBadge({ status, className = "" }: { status: AdminVerificationRequest["status"]; className?: string }) {
  const style = status === "approved" ? "bg-emerald-100 text-emerald-700" : status === "rejected" ? "bg-red-100 text-destructive" : "bg-amber-100 text-amber-700";
  return <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${style} ${className}`}>{status}</span>;
}

function actionLabel(action: VerificationReviewAction) {
  if (action === "approve") return "Approval";
  if (action === "resubmit") return "Resubmission Request";
  if (action === "ban") return "Account Ban";
  return "Rejection";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
