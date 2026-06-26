"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminReportsScreen } from "@/app/components/AdminReportsScreen";
import { loadAdminReports, reviewAdminReport, type AdminReport } from "@/lib/admin";

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const result = await loadAdminReports();
    setLoading(false);
    if (result.error) setError(result.error);
    else setReports(result.data ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);
  return <AdminReportsScreen reports={reports} loading={loading} error={error} onBack={() => router.push("/admin")} onRetry={() => void load()} onReview={async (id, status) => {
    const result = await reviewAdminReport(id, status);
    if (!result.error) await load();
    return result;
  }} />;
}
