import { useState } from "react";
import { AlertCircle, ChevronLeft, CreditCard, Save } from "lucide-react";
import type { ProfileResult, UserProfile } from "@/lib/auth";

interface Props {
  profile: UserProfile;
  onBack: () => void;
  onSubmit: (input: {
    payoutMethod: string;
    payoutProvider: string;
    payoutAccountName: string;
    payoutAccountNumber: string;
    payoutNotes: string;
  }) => Promise<ProfileResult>;
}

export function PayoutSettingsScreen({ profile, onBack, onSubmit }: Props) {
  const [payoutMethod, setPayoutMethod] = useState(profile.payout_method ?? "");
  const [payoutProvider, setPayoutProvider] = useState(profile.payout_provider ?? "");
  const [payoutAccountName, setPayoutAccountName] = useState(profile.payout_account_name ?? "");
  const [payoutAccountNumber, setPayoutAccountNumber] = useState(profile.payout_account_number ?? "");
  const [payoutNotes, setPayoutNotes] = useState(profile.payout_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    const result = await onSubmit({ payoutMethod, payoutProvider, payoutAccountName, payoutAccountNumber, payoutNotes });
    setSaving(false);
    if (result.error) setError(result.error);
    else onBack();
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 pb-4 pt-12">
        <button onClick={onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold">Payout Account</h1>
          <p className="text-xs text-muted-foreground">Private money transfer details</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-28 pt-4">
        <section className="rounded-3xl border-2 border-foreground bg-card p-5 shadow-[5px_5px_0_#26231d]">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-foreground bg-[#f3c969]">
            <CreditCard size={22} />
          </div>
          <h2 className="font-bold">Where should admin send your payout?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This information is private. It is only shown to admin when your completed work is accepted and ready for manual payout.
          </p>
        </section>

        <section className="mt-4 grid gap-3 rounded-2xl border border-border bg-card p-4">
          <select value={payoutMethod} onChange={(event) => setPayoutMethod(event.target.value)} className="field">
            <option value="">Select payout method</option>
            <option value="bank">Bank transfer</option>
            <option value="ewallet">E-wallet</option>
          </select>
          <input value={payoutProvider} onChange={(event) => setPayoutProvider(event.target.value)} maxLength={80} className="field" placeholder="Bank/e-wallet name, e.g. BCA, Mandiri, GoPay" />
          <input value={payoutAccountName} onChange={(event) => setPayoutAccountName(event.target.value)} maxLength={120} className="field" placeholder="Account holder name" />
          <input value={payoutAccountNumber} onChange={(event) => setPayoutAccountNumber(event.target.value)} maxLength={80} className="field" placeholder="Account number / phone number" />
          <textarea value={payoutNotes} onChange={(event) => setPayoutNotes(event.target.value)} maxLength={300} rows={3} className="field resize-none" placeholder="Optional payout note" />
        </section>

        {error && <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-destructive"><AlertCircle size={17} className="mt-0.5 flex-shrink-0" />{error}</div>}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-border bg-card px-4 pb-4 pt-4" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
        <button onClick={save} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-white disabled:bg-muted">
          <Save size={18} />{saving ? "Saving..." : "Save Payout Account"}
        </button>
      </footer>
    </div>
  );
}
