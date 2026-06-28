"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TermsApprovalScreen } from "@/app/components/TermsApprovalScreen";
import { useAppState } from "@/components/providers/AppStateProvider";
import { acceptTerms, hasAcceptedTerms } from "@/lib/terms";

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { initialized, isAuthenticated, profile } = useAppState();
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    setTermsAccepted(hasAcceptedTerms(profile?.id));
    const onAccepted = () => setTermsAccepted(true);
    window.addEventListener("skillbridge-terms-accepted", onAccepted);
    return () => window.removeEventListener("skillbridge-terms-accepted", onAccepted);
  }, [profile?.id]);

  useEffect(() => {
    if (initialized && !isAuthenticated) router.replace("/login");
  }, [initialized, isAuthenticated, router]);

  if (!initialized || !isAuthenticated) {
    return <div className="grid h-full place-items-center text-sm text-muted-foreground">Checking your session...</div>;
  }

  if (profile?.is_banned) {
    return (
      <div className="grid h-full place-items-center px-6 text-center">
        <div>
          <h1 className="font-bold text-destructive">Account restricted</h1>
          <p className="mt-2 text-sm text-muted-foreground">{profile.ban_reason || "This account has been restricted by an administrator."}</p>
        </div>
      </div>
    );
  }

  if (!termsAccepted && pathname !== "/terms" && pathname !== "/about") {
    return (
      <TermsApprovalScreen
        onTerms={() => router.push("/terms")}
        onAbout={() => router.push("/about")}
        onAccept={() => {
          acceptTerms(profile?.id);
          setTermsAccepted(true);
        }}
      />
    );
  }

  return children;
}
