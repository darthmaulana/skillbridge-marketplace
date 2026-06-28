"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TermsScreen } from "@/app/components/TermsScreen";
import { useAppState } from "@/components/providers/AppStateProvider";
import { acceptTerms, hasAcceptedTerms } from "@/lib/terms";

export default function TermsPage() {
  const router = useRouter();
  const { profile } = useAppState();
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    setAccepted(hasAcceptedTerms(profile?.id));
  }, [profile?.id]);

  return (
    <TermsScreen
      onBack={() => router.back()}
      onAccept={accepted ? undefined : () => {
        acceptTerms(profile?.id);
        setAccepted(true);
        router.push("/home");
      }}
    />
  );
}
