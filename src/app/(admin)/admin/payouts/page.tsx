"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPayoutsScreen } from "@/app/components/AdminPayoutsScreen";
import { loadAdminPayouts, markAdminPayoutPaid, type AdminPayout } from "@/lib/adminPayouts";

export default function AdminPayoutsPage() {
  const router = useRouter();
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await loadAdminPayouts();
    setLoading(false);
    if (result.error) setError(result.error);
    else setPayouts(result.data ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminPayoutsScreen
      payouts={payouts}
      loading={loading}
      error={error}
      onBack={() => router.push("/admin")}
      onRetry={() => void load()}
      onMarkPaid={async (orderId, notes) => {
        const result = await markAdminPayoutPaid(orderId, notes);
        if (!result.error) await load();
        return result;
      }}
    />
  );
}
