import { useMemo, useState } from "react";
import { AlertCircle, ChevronLeft, Search, Shield, ShieldOff, UserCheck } from "lucide-react";
import type { AdminUser } from "@/lib/admin";

interface Props {
  users: AdminUser[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onRetry: () => void;
  onBan: (userId: string, banned: boolean, reason?: string) => Promise<{ error?: string }>;
}

export function AdminUsersScreen({ users, loading, error, onBack, onRetry, onBan }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const filtered = useMemo(() => users.filter((user) => `${user.fullName} ${user.email}`.toLowerCase().includes(query.toLowerCase())), [query, users]);

  const submit = async () => {
    if (!selected) return;
    setSaving(true);
    setActionError(null);
    const result = await onBan(selected.id, !selected.isBanned, reason);
    setSaving(false);
    if (result.error) return setActionError(result.error);
    setSelected(null);
    setReason("");
  };

  return (
    <AdminPage title="Manage Users" subtitle={`${users.length} accounts`} onBack={onBack}>
      <SearchBox value={query} onChange={setQuery} placeholder="Search name or email..." />
      <AsyncState loading={loading} error={error} empty={!filtered.length} onRetry={onRetry} emptyText="No users found." />
      {!loading && !error && <div className="flex flex-col gap-3">{filtered.map((user) => (
        <button key={user.id} onClick={() => { setSelected(user); setReason(user.banReason ?? ""); }} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left">
          <div className="avatar-fallback flex h-11 w-11 items-center justify-center rounded-full font-bold">{user.fullName.charAt(0)}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5"><p className="truncate font-semibold">{user.fullName}</p>{user.verificationStatus === "approved" && <Shield size={13} className="text-emerald-500" />}</div>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-xs capitalize text-muted-foreground">{user.role} / {user.verificationStatus}</p>
          </div>
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${user.isBanned ? "bg-red-100 text-destructive" : "bg-emerald-50 text-emerald-700"}`}>{user.isBanned ? "Restricted" : "Active"}</span>
        </button>
      ))}</div>}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-card p-5">
            <h2 className="font-bold">{selected.isBanned ? "Restore account" : "Restrict account"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{selected.fullName}</p>
            {!selected.isBanned && <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="field mt-4 resize-none" placeholder="Reason for restriction *" />}
            {actionError && <p className="mt-3 text-sm text-destructive">{actionError}</p>}
            <div className="mt-4 flex gap-3">
              <button onClick={() => { setSelected(null); setActionError(null); }} className="flex-1 rounded-2xl border border-border py-3 font-semibold">Cancel</button>
              <button disabled={saving || (!selected.isBanned && !reason.trim())} onClick={() => void submit()} className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-white disabled:bg-muted ${selected.isBanned ? "bg-emerald-600" : "bg-destructive"}`}>
                {selected.isBanned ? <UserCheck size={17} /> : <ShieldOff size={17} />}{saving ? "Saving..." : selected.isBanned ? "Restore" : "Restrict"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPage>
  );
}

export function AdminPage({ title, subtitle, onBack, children }: { title: string; subtitle: string; onBack: () => void; children: React.ReactNode }) {
  return <div className="flex h-full flex-col bg-background"><header className="flex items-center gap-3 border-b border-border bg-card px-4 pb-4 pt-5"><button onClick={onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><ChevronLeft size={20} /></button><div><h1 className="font-bold">{title}</h1><p className="text-xs text-muted-foreground">{subtitle}</p></div></header><div className="flex-1 overflow-y-auto p-4">{children}</div></div>;
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div className="relative mb-4"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-xl bg-muted py-2.5 pl-9 pr-4 text-sm focus:outline-none" /></div>;
}

export function AsyncState({ loading, error, empty, onRetry, emptyText }: { loading: boolean; error: string | null; empty: boolean; onRetry: () => void; emptyText: string }) {
  if (loading) return <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center"><AlertCircle className="mx-auto text-destructive" /><p className="mt-2 text-sm text-destructive">{error}</p><button onClick={onRetry} className="mt-3 text-sm font-semibold text-primary">Try again</button></div>;
  if (empty) return <div className="rounded-2xl border border-dashed border-border bg-card py-10 text-center text-sm text-muted-foreground">{emptyText}</div>;
  return null;
}

