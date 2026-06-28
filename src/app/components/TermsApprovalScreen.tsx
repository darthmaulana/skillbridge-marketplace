import { useState } from "react";
import { FileText, Info, ShieldCheck } from "lucide-react";

interface Props {
  onAccept: () => void;
  onTerms: () => void;
  onAbout: () => void;
}

export function TermsApprovalScreen({ onAccept, onTerms, onAbout }: Props) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex h-full flex-col bg-background px-5 pb-6 pt-14">
      <div className="rounded-3xl border-2 border-foreground bg-card p-5 shadow-[5px_5px_0_#26231d]">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-foreground bg-[#f3c969]">
          <ShieldCheck size={26} />
        </div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Before continuing</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Please approve SkillBridge Terms</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          SkillBridge connects job posters and skill providers. Please read and approve the rules for accounts, posts, chat, verification, safe payment, cancellation, and disputes.
        </p>

        <div className="mt-5 grid gap-2">
          <button onClick={onTerms} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3 text-left">
            <FileText size={18} className="text-primary" />
            <div>
              <p className="text-sm font-bold">Terms and Conditions</p>
              <p className="text-xs text-muted-foreground">Read the platform rules.</p>
            </div>
          </button>
          <button onClick={onAbout} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3 text-left">
            <Info size={18} className="text-primary" />
            <div>
              <p className="text-sm font-bold">About SkillBridge</p>
              <p className="text-xs text-muted-foreground">Company info and contact.</p>
            </div>
          </button>
        </div>

        <label className="mt-5 flex items-start gap-3 rounded-2xl border border-border bg-muted p-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            className="mt-1 h-4 w-4 accent-primary"
          />
          <span className="text-sm leading-relaxed text-foreground">
            I have read and agree to the SkillBridge Terms and Conditions, including safe payment and dispute rules.
          </span>
        </label>

        <button
          onClick={onAccept}
          disabled={!checked}
          className="mt-4 w-full rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          Agree and Continue
        </button>
      </div>
    </div>
  );
}
