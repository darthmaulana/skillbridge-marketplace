"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/providers/AppStateProvider";

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { initialized, isAuthenticated, profile } = useAppState();

  useEffect(() => {
    if (initialized && !isAuthenticated) router.replace("/login");
  }, [initialized, isAuthenticated, router]);

  if (!initialized || !isAuthenticated) {
    return <div className="grid h-full place-items-center text-sm text-muted-foreground">Checking your session...</div>;
  }

  if (profile?.is_banned) {
    return (
      <div className="grid h-full place-items-center px-6 text-center">
        <div>
          <h1 className="font-bold text-destructive">Account restricted</h1>
          <p className="mt-2 text-sm text-muted-foreground">{profile.ban_reason || "This account has been restricted by an administrator."}</p>
        </div>
      </div>
    );
  }

  return children;
}
