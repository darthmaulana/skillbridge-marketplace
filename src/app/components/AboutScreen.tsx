import { ChevronLeft, Globe, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  onBack: () => void;
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://skillbridge-marketplace.vercel.app";

export function AboutScreen({ onBack }: Props) {
  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-3 border-b-2 border-foreground bg-card px-4 pb-4 pt-12">
        <button onClick={onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold">About SkillBridge</h1>
          <p className="text-xs text-muted-foreground">Job and skill marketplace</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
        <section className="rounded-3xl border-2 border-foreground bg-[#d6f0ea] p-5 shadow-[5px_5px_0_#26231d]">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-foreground bg-[#f3c969]">
            <ShieldCheck size={27} />
          </div>
          <h2 className="text-2xl font-bold text-foreground">SkillBridge</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            SkillBridge helps people find jobs, offer skills, chat safely, verify identity for offline work, and use platform-tracked payments for safer transactions.
          </p>
        </section>

        <section className="mt-4 rounded-2xl border border-border bg-card p-4">
          <h3 className="font-bold">What this app does</h3>
          <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <p>Users can create job posts when they need help from others.</p>
            <p>Users can create skill posts when they want to offer a service.</p>
            <p>Chat is used to agree on scope, price, and work details before payment.</p>
            <p>Safe payment lets the platform track paid orders until completion or dispute review.</p>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-border bg-card p-4">
          <h3 className="font-bold">Contact</h3>
          <div className="mt-3 flex flex-col gap-3 text-sm">
            <ContactRow icon={<Phone size={16} />} label="Phone / WhatsApp" value="+62 812-0000-0000" />
            <ContactRow icon={<Mail size={16} />} label="Email" value="support@skillbridge.app" />
            <ContactRow icon={<Globe size={16} />} label="Website" value={appUrl} />
            <ContactRow icon={<MapPin size={16} />} label="Service area" value="Indonesia" />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Replace the phone and email with your official business contact before public launch.
          </p>
        </section>

        <section className="mt-4 rounded-2xl border border-border bg-card p-4">
          <h3 className="font-bold">Support topics</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Account access and profile help</li>
            <li>Verification review</li>
            <li>Post, chat, and safety reports</li>
            <li>Payment, bill, completion, and dispute questions</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

function ContactRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-muted p-3">
      <span className="mt-0.5 text-primary">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="break-words font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
