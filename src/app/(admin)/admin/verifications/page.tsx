"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminVerificationScreen } from "@/app/components/AdminVerificationScreen";
import {
  createVerificationPreviewUrls,
  loadAdminVerificationRequests,
  reviewVerificationRequest,
  type AdminVerificationRequest,
} from "@/lib/adminVerification";

export default function AdminVerificationsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<AdminVerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await loadAdminVerificationRequests();
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setRequests(result.data ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminVerificationScreen
      requests={requests}
      loading={loading}
      error={error}
      onBack={() => router.push("/admin")}
      onRetry={() => void load()}
      onLoadPreviews={createVerificationPreviewUrls}
      onReview={async (requestId, action, reason) => {
        const result = await reviewVerificationRequest(requestId, action, reason);
        if (!result.error) await load();
        return result;
      }}
    />
  );
}
