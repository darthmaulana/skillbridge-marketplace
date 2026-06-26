"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/providers/AppStateProvider";
import { AppViewport } from "@/components/layout/AppViewport";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { initialized, isAuthenticated } = useAppState();

  useEffect(() => {
    if (!initialized) return;
    router.replace(isAuthenticated ? "/home" : "/login");
  }, [initialized, isAuthenticated, router]);

  return (
    <AppViewport>
      <div className="grid min-h-screen w-full max-w-md place-items-center bg-background text-sm text-muted-foreground">
        Completing sign in...
      </div>
    </AppViewport>
  );
}
