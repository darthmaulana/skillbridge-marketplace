import { AlertCircle, ChevronLeft, ChevronRight, FileText, Flag, Shield, Users } from "lucide-react";
import type { AdminStats } from "@/lib/admin";

interface Props {
  stats: AdminStats | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onRetry: () => void;
  onUsers: () => void;
  onPosts: () => void;
  onReports: () => void;
  onVerifications: () => void;
}

export function AdminDashboard({ stats, loading, error, onBack, onRetry, onUsers, onPosts, onReports, onVerifications }: Props) {
  const cards = [
    { label: "Total Users", value: stats?.users ?? 0, icon: Users, color: "bg-blue-100 text-primary" },
    { label: "Active Posts", value: stats?.activePosts ?? 0, icon: FileText, color: "bg-emerald-100 text-emerald-600" },
    { label: "Open Reports", value: stats?.openReports ?? 0, icon: Flag, color: "bg-red-100 text-destructive" },
    { label: "Pending KTP", value: stats?.pendingVerifications ?? 0, icon: Shield, color: "bg-amber-100 text-amber-600" },
  ];
  const actions = [
    { label: "Review KTP Verifications", count: stats?.pendingVerifications ?? 0, onClick: onVerifications },
    { label: "Manage Reports", count: stats?.openReports ?? 0, onClick: onReports },
    { label: "Manage Posts", count: stats?.activePosts ?? 0, onClick: onPosts },
    { label: "Manage Users", count: stats?.users ?? 0, onClick: onUsers },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <header className="flex items-center gap-3 bg-foreground px-4 pb-4 pt-5">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"><ChevronLeft size={20} className="text-white" /></button>
        <div>
          <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
          <p className="text-xs text-white/60">SkillBridge moderation panel</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-8">
        {error && (
          <div className="mx-4 mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
            <AlertCircle className="mx-auto text-destructive" size={22} />
            <p className="mt-2 text-sm text-destructive">{error}</p>
            <button onClick={onRetry} className="mt-2 text-sm font-semibold text-primary">Try again</button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 p-4">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-4">
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}><Icon size={18} /></div>
              <div className="text-2xl font-bold text-foreground">{loading ? "..." : value}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        <section className="px-4">
          <h2 className="mb-3 font-bold text-foreground">Management</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {actions.map((item, index) => (
              <button key={item.label} onClick={item.onClick} className={`flex w-full items-center justify-between px-4 py-4 text-left active:bg-muted ${index ? "border-t border-border" : ""}`}>
                <span className="text-sm font-semibold text-foreground">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{loading ? "..." : item.count}</span>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
