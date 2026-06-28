"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminDashboard } from "@/app/components/AdminDashboard";
import { loadAdminStats, type AdminStats } from "@/lib/admin";

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const result = await loadAdminStats();
    setLoading(false);
    if (result.error) setError(result.error);
    else setStats(result.data ?? null);
  }, []);
  useEffect(() => { void load(); }, [load]);
  return <AdminDashboard
    stats={stats}
    loading={loading}
    error={error}
    onRetry={() => void load()}
    onBack={() => router.push("/home")}
    onVerifications={() => router.push("/admin/verifications")}
    onUsers={() => router.push("/admin/users")}
    onPosts={() => router.push("/admin/posts")}
    onReports={() => router.push("/admin/reports")}
    onPayouts={() => router.push("/admin/payouts")}
  />;
}
