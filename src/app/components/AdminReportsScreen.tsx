import { useState } from "react";
import type { AdminReport } from "@/lib/admin";
import { AdminPage, AsyncState } from "./AdminUsersScreen";

export function AdminReportsScreen({ reports, loading, error, onBack, onRetry, onReview }: {
  reports: AdminReport[]; loading: boolean; error: string | null; onBack: () => void; onRetry: () => void; onReview: (id: string, status: AdminReport["status"]) => Promise<{ error?: string }>;
}) {
  const [actionError, setActionError] = useState<string | null>(null);
  const review = async (id: string, status: AdminReport["status"]) => {
    setActionError(null);
    const result = await onReview(id, status);
    if (result.error) setActionError(result.error);
  };
  return <AdminPage title="Manage Reports" subtitle={`${reports.filter((report) => report.status === "open" || report.status === "reviewing").length} need attention`} onBack={onBack}>
    {actionError && <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-destructive">{actionError}</p>}
    <AsyncState loading={loading} error={error} empty={!reports.length} onRetry={onRetry} emptyText="No reports found." />
    {!loading && !error && <div className="flex flex-col gap-3">{reports.map((report) => <div key={report.id} className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{report.reason}</h2><p className="mt-1 text-xs text-muted-foreground">Reported by {report.reporterName}</p></div><span className={`rounded-full px-2 py-1 text-xs capitalize ${report.status === "resolved" ? "bg-emerald-50 text-emerald-700" : report.status === "dismissed" ? "bg-muted text-muted-foreground" : "bg-amber-50 text-amber-700"}`}>{report.status}</span></div>
      <p className="mt-3 text-sm text-muted-foreground">{report.description || "No additional details."}</p>
      <p className="mt-2 text-xs text-muted-foreground">{report.postTitle ? `Post: ${report.postTitle}` : report.reportedUserName ? `User: ${report.reportedUserName}` : "General safety report"}</p>
      {(report.status === "open" || report.status === "reviewing") && <div className="mt-4 flex gap-2"><button onClick={() => void review(report.id, "reviewing")} className="flex-1 rounded-xl border border-amber-200 bg-amber-50 py-2 text-xs font-semibold text-amber-700">Reviewing</button><button onClick={() => void review(report.id, "resolved")} className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white">Resolve</button><button onClick={() => void review(report.id, "dismissed")} className="flex-1 rounded-xl border border-border py-2 text-xs font-semibold">Dismiss</button></div>}
    </div>)}</div>}
  </AdminPage>;
}
