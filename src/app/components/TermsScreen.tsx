import { ChevronLeft, ShieldCheck } from "lucide-react";
import { TERMS_VERSION } from "@/lib/terms";

interface Props {
  onBack: () => void;
  onAccept?: () => void;
}

const sections = [
  {
    title: "Platform Role",
    body: "SkillBridge connects users who post jobs with users who offer skills or services. SkillBridge is a platform intermediary, not the direct employer or service provider.",
  },
  {
    title: "Accounts and Verification",
    body: "Users must provide accurate account information. Offline work may require identity verification before contact details or exact locations are shared.",
  },
  {
    title: "Posts and Chat",
    body: "Posts and chats must be honest, lawful, respectful, and related to jobs or skills. Fraud, spam, harassment, illegal services, and misleading content are not allowed.",
  },
  {
    title: "Safe Payment",
    body: "When safe payment is available, users should pay through SkillBridge. For skill posts, the skill owner sends the bill. For job posts, the worker sends the bill to the job poster.",
  },
  {
    title: "Cancellation and Disputes",
    body: "Unpaid bills can be cancelled before payment. Paid orders may require admin review, refund handling, or dispute resolution before funds are released.",
  },
  {
    title: "Safety",
    body: "For offline work, meet in public first, protect personal information, and report suspicious behavior. Do not share passwords, OTP codes, or sensitive payment information.",
  },
  {
    title: "Data and Third Parties",
    body: "SkillBridge uses services such as Supabase, Vercel, and payment providers like Midtrans. Sensitive payment card data is handled by the payment provider, not stored by SkillBridge.",
  },
];

export function TermsScreen({ onBack, onAccept }: Props) {
  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-3 border-b-2 border-foreground bg-card px-4 pb-4 pt-12">
        <button onClick={onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold">Terms and Conditions</h1>
          <p className="text-xs text-muted-foreground">Version {TERMS_VERSION}</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-28 pt-4">
        <section className="rounded-3xl border-2 border-foreground bg-[#fff0b8] p-5 shadow-[5px_5px_0_#26231d]">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-foreground bg-[#f3c969]">
            <ShieldCheck size={23} />
          </div>
          <h2 className="text-xl font-bold">SkillBridge user agreement</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This page summarizes the in-app terms. The fuller legal draft is also saved in the project as TERMS_AND_CONDITIONS.md.
          </p>
        </section>

        <div className="mt-4 flex flex-col gap-3">
          {sections.map((section, index) => (
            <section key={section.title} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-bold text-primary">Section {index + 1}</p>
              <h3 className="mt-1 font-bold text-foreground">{section.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-4 rounded-2xl border border-border bg-card p-4">
          <h3 className="font-bold">Contact</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            For questions, reports, payment issues, or dispute help, contact SkillBridge through the About page.
          </p>
        </section>
      </main>

      {onAccept && (
        <footer className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-border bg-card px-4 py-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <button onClick={onAccept} className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground">
            Agree to Terms
          </button>
        </footer>
      )}
    </div>
  );
}
