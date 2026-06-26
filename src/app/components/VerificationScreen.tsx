import { useRef, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, Clock, FileImage, Shield, Upload, X, XCircle } from "lucide-react";
import type { VerificationStatus } from "../data";
import type { VerificationRequest, VerificationSubmission } from "@/lib/verification";

interface Props {
  onBack: () => void;
  status: VerificationStatus;
  request: VerificationRequest | null;
  loading: boolean;
  loadError: string | null;
  onRetry: () => void;
  onSubmit: (input: VerificationSubmission) => Promise<{ data?: VerificationRequest; error?: string }>;
}

const statusConfig: Record<VerificationStatus, { color: string; bg: string; border: string; icon: ReactNode; label: string; description: string }> = {
  unverified: {
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
    icon: <AlertCircle size={20} />,
    label: "Not Verified",
    description: "Submit your documents to unlock offline job features.",
  },
  pending: {
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: <Clock size={20} />,
    label: "Pending Review",
    description: "Your documents are waiting for manual admin review.",
  },
  approved: {
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: <CheckCircle2 size={20} />,
    label: "Verified",
    description: "Your identity is approved and offline job features are available.",
  },
  rejected: {
    color: "text-destructive",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: <XCircle size={20} />,
    label: "Submission Rejected",
    description: "Review the reason below and submit new, clearer documents.",
  },
};

export function VerificationScreen({ onBack, status, request, loading, loadError, onRetry, onSubmit }: Props) {
  const ktpInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const [agreed, setAgreed] = useState(false);
  const [legalName, setLegalName] = useState(request?.legalName ?? "");
  const [ktpImage, setKtpImage] = useState<File | null>(null);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const canSubmit = agreed && legalName.trim().length >= 3 && ktpImage && selfieImage && !submitting;
  const canShowForm = status === "unverified" || status === "rejected";
  const config = statusConfig[status];

  const submit = async () => {
    if (!canSubmit || !ktpImage || !selfieImage) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = await onSubmit({ legalName, ktpImage, selfieImage, consent: agreed });
    setSubmitting(false);
    if (result.error) setSubmitError(result.error);
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 pb-4 pt-12">
        <button onClick={onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><ChevronLeft size={20} /></button>
        <h1 className="text-lg font-bold">Identity Verification</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-4">
        {loading && <div className="grid h-48 place-items-center text-sm text-muted-foreground">Loading verification status...</div>}

        {!loading && loadError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
            <AlertCircle size={24} className="mx-auto text-destructive" />
            <p className="mt-2 text-sm text-destructive">{loadError}</p>
            <button onClick={onRetry} className="mt-3 text-sm font-semibold text-primary">Try again</button>
          </div>
        )}

        {!loading && !loadError && (
          <>
            <div className={`mb-5 flex gap-3 rounded-2xl border p-4 ${config.bg} ${config.border}`}>
              <div className={config.color}>{config.icon}</div>
              <div>
                <p className={`font-bold ${config.color}`}>{config.label}</p>
                <p className={`mt-0.5 text-sm opacity-80 ${config.color}`}>{config.description}</p>
                {request && <p className={`mt-2 text-xs ${config.color}`}>Submitted {formatDate(request.submittedAt)}</p>}
              </div>
            </div>

            {status === "rejected" && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-destructive">Reason for rejection</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-red-700">
                  {request?.rejectionReason || "No detailed reason was provided. Submit clearer photos or contact support if you need help."}
                </p>
              </div>
            )}

            <div className="mb-5 flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <Shield size={18} className="mt-0.5 flex-shrink-0 text-primary" />
              <p className="text-sm leading-relaxed text-blue-700">
                <span className="font-bold">KTP and selfie are only used for account verification.</span> They will never be shown publicly. Files are stored privately and only authorized administrators can review them.
              </p>
            </div>

            {canShowForm && (
              <div className="flex flex-col gap-4">
                <section className="rounded-2xl border border-border bg-card p-4">
                  <label className="mb-2 block text-sm font-semibold text-muted-foreground">Legal full name (as on KTP) *</label>
                  <input
                    value={legalName}
                    onChange={(event) => setLegalName(event.target.value)}
                    maxLength={120}
                    placeholder="e.g. Ayu Setiawati Putri"
                    className="field"
                  />
                </section>

                <input ref={ktpInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => setKtpImage(event.target.files?.[0] ?? null)} />
                <FileUpload
                  label="KTP photo *"
                  description="Use a clear, well-lit photo with all card edges visible."
                  file={ktpImage}
                  onChoose={() => ktpInputRef.current?.click()}
                  onRemove={() => {
                    setKtpImage(null);
                    if (ktpInputRef.current) ktpInputRef.current.value = "";
                  }}
                />

                <input ref={selfieInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => setSelfieImage(event.target.files?.[0] ?? null)} />
                <FileUpload
                  label="Selfie holding KTP *"
                  description="Your face and the KTP must both be clearly visible."
                  file={selfieImage}
                  onChoose={() => selfieInputRef.current?.click()}
                  onRemove={() => {
                    setSelfieImage(null);
                    if (selfieInputRef.current) selfieInputRef.current.value = "";
                  }}
                />

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-4">
                  <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
                  <span className="text-sm leading-relaxed text-foreground">I consent to private storage and manual review of these documents solely for account verification.</span>
                </label>

                {submitError && (
                  <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-destructive">
                    <AlertCircle size={17} className="mt-0.5 flex-shrink-0" />{submitError}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {!loading && !loadError && canShowForm && (
        <footer className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-border bg-card px-4 pb-4 pt-4" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
          <button
            onClick={() => void submit()}
            disabled={!canSubmit}
            className="w-full rounded-2xl bg-primary py-4 font-semibold text-white disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          >
            {submitting ? "Uploading Securely..." : status === "rejected" ? "Resubmit for Verification" : "Submit for Verification"}
          </button>
        </footer>
      )}
    </div>
  );
}

function FileUpload({ label, description, file, onChoose, onRemove }: {
  label: string;
  description: string;
  file: File | null;
  onChoose: () => void;
  onRemove: () => void;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <label className="mb-1 block text-sm font-semibold text-muted-foreground">{label}</label>
      <p className="mb-3 text-xs text-muted-foreground">{description}</p>
      {file ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
          <FileImage size={22} className="flex-shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-emerald-800">{file.name}</p>
            <p className="text-xs text-emerald-700">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
          <button onClick={onRemove} aria-label={`Remove ${label}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70"><X size={15} /></button>
        </div>
      ) : (
        <button onClick={onChoose} className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border py-7">
          <Upload size={26} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Choose private image</span>
          <span className="text-xs text-muted-foreground">JPG, PNG, or WebP up to 8 MB</span>
        </button>
      )}
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

