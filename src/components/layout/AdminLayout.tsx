"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/providers/AppStateProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { initialized, isAuthenticated, role, profile, user } = useAppState();
  const [freshRole, setFreshRole] = useState<"user" | "admin" | null>(null);
  const [checkingFreshRole, setCheckingFreshRole] = useState(false);

  const activeRole = freshRole ?? role;

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) router.replace("/login");
  }, [initialized, isAuthenticated, router]);

  useEffect(() => {
    if (!initialized || !isAuthenticated || !user || role === "admin") return;

    let cancelled = false;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setCheckingFreshRole(true);
    void (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("role,is_banned")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;
        setFreshRole(data?.role === "admin" && !data.is_banned ? "admin" : "user");
      } finally {
        if (!cancelled) setCheckingFreshRole(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialized, isAuthenticated, role, user]);

  useEffect(() => {
    if (!initialized || !isAuthenticated || checkingFreshRole) return;
    if (activeRole !== "admin" || profile?.is_banned) router.replace("/home");
  }, [activeRole, checkingFreshRole, initialized, isAuthenticated, profile?.is_banned, router]);

  if (!initialized || !isAuthenticated || checkingFreshRole || activeRole !== "admin" || profile?.is_banned) {
    return <div className="grid h-full place-items-center text-sm text-muted-foreground">Checking admin access...</div>;
  }

  return children;
}
