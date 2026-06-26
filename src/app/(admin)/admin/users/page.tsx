"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminUsersScreen } from "@/app/components/AdminUsersScreen";
import { loadAdminUsers, setAdminUserBan, type AdminUser } from "@/lib/admin";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const result = await loadAdminUsers();
    setLoading(false);
    if (result.error) setError(result.error);
    else setUsers(result.data ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);
  return <AdminUsersScreen users={users} loading={loading} error={error} onBack={() => router.push("/admin")} onRetry={() => void load()} onBan={async (id, banned, reason) => {
    const result = await setAdminUserBan(id, banned, reason);
    if (!result.error) await load();
    return result;
  }} />;
}
