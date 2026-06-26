"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VerificationScreen } from "@/app/components/VerificationScreen";
import { useAppState } from "@/components/providers/AppStateProvider";
import { loadLatestVerification, submitVerification, type VerificationRequest } from "@/lib/verification";

export default function VerificationPage() {
  const router = useRouter();
  const { verificationStatus, setVerificationStatus, profile } = useAppState();
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setLoadError(null);
    const result = await loadLatestVerification(profile);
    setLoading(false);
    if (result.error) {
      setLoadError(result.error);
      return;
    }
    setRequest(result.data ?? null);
    if (result.data) setVerificationStatus(result.data.status);
  }, [profile, setVerificationStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <VerificationScreen
      status={verificationStatus}
      request={request}
      loading={loading}
      loadError={loadError}
      onRetry={() => void load()}
      onSubmit={async (input) => {
        if (!profile) return { error: "Your profile is still loading." };
        const result = await submitVerification(input, profile);
        if (result.data) {
          setRequest(result.data);
          setVerificationStatus("pending");
        }
        return result;
      }}
      onBack={() => router.push("/profile")}
    />
  );
}
