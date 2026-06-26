import { useState } from "react";
import { AlertCircle, Check, ChevronLeft, Flag, UserX } from "lucide-react";
import type { SafetyReportInput, SafetyResult } from "@/lib/safety";

const REASONS = [
  "Spam or misleading post",
  "Fake or fraudulent listing",
  "Inappropriate content",
  "Harassment or abuse",
  "Safety concern",
  "Scam or fraud attempt",
  "Other",
];

interface Props {
  onBack: () => void;
  targetName: string;
  postId?: string;
  reportedUserId: string;
  onSubmit: (input: SafetyReportInput) => Promise<SafetyResult>;
}

export function ReportScreen({ onBack, targetName, postId, reportedUserId, onSubmit }: Props) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await onSubmit({ postId, reportedUserId, reason, description, blockUser: blocked });
    setSubmitting(false);
    if (result.error) return setError(result.error);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background px-8 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100"><Flag size={32} className="text-emerald-600" /></div>
        <h2 className="text-xl font-bold text-foreground">Report submitted</h2>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
          Our moderation team can now review this report.{blocked ? " The user has also been blocked and hidden from your account." : ""}
        </p>
        <button onClick={onBack} className="mt-8 rounded-2xl bg-primary px-8 py-3 font-semibold text-white">Back to app</button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 pb-4 pt-12">
        <button onClick={onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><ChevronLeft size={20} /></button>
        <h1 className="text-lg font-bold">Report</h1>
      </header>
      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-4">
        <p className="mb-5 text-sm text-muted-foreground">You are reporting <span className="font-semibold text-foreground">{targetName}</span>.</p>
        <div className="mb-4 overflow-hidden rounded-2xl border border-border bg-card">
          {REASONS.map((item, index) => (
            <label key={item} className={`flex cursor-pointer items-center gap-3 px-4 py-3.5 ${index ? "border-t border-border" : ""}`}>
              <input type="radio" name="report-reason" checked={reason === item} onChange={() => setReason(item)} className="h-4 w-4 accent-primary" />
              <span className="text-sm text-foreground">{item}</span>
            </label>
          ))}
        </div>
        <section className="mb-4 rounded-2xl border border-border bg-card p-4">
          <label className="mb-2 block text-sm font-semibold text-muted-foreground">Additional details</label>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} rows={4} placeholder="Describe what happened..." className="field resize-none" />
          <p className="mt-1 text-right text-xs text-muted-foreground">{description.length}/2000</p>
        </section>
        <button onClick={() => setBlocked((current) => !current)} className={`flex w-full items-center gap-3 rounded-2xl border p-4 ${blocked ? "border-red-200 bg-red-50" : "border-border bg-card"}`}>
          <UserX size={20} className={blocked ? "text-destructive" : "text-muted-foreground"} />
          <div className="flex-1 text-left"><p className={`text-sm font-semibold ${blocked ? "text-destructive" : "text-foreground"}`}>{blocked ? "User will be blocked" : "Also block this user"}</p><p className="mt-0.5 text-xs text-muted-foreground">Their posts, profile, and conversations will be hidden.</p></div>
          <span className={`flex h-5 w-5 items-center justify-center rounded border-2 ${blocked ? "border-destructive bg-destructive text-white" : "border-border"}`}>{blocked ? <Check size={13} strokeWidth={3} /> : null}</span>
        </button>
        {error && <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-destructive"><AlertCircle size={17} />{error}</div>}
      </div>
      <footer className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-border bg-card px-4 pb-4 pt-4" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
        <button onClick={() => void submit()} disabled={!reason || submitting} className="w-full rounded-2xl bg-destructive py-4 font-semibold text-white disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground">{submitting ? "Submitting..." : "Submit Report"}</button>
      </footer>
    </div>
  );
}


