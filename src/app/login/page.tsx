"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthScreen } from "@/app/components/AuthScreen";
import { AppViewport } from "@/components/layout/AppViewport";
import { useAppState } from "@/components/providers/AppStateProvider";

export default function LoginPage() {
  const router = useRouter();
  const { initialized, isAuthenticated, isDemoMode, resetPassword, signIn, signInWithGoogle, signUp } = useAppState();

  useEffect(() => {
    if (initialized && isAuthenticated) router.replace("/home");
  }, [initialized, isAuthenticated, router]);

  return (
    <AppViewport>
      <section className="indie-window relative mx-auto min-h-screen w-full max-w-md overflow-hidden bg-background lg:my-5 lg:h-[797px] lg:min-h-0 lg:rounded-[1.75rem]">
        <div className="indie-titlebar absolute inset-x-0 top-0 z-[60] flex h-8 items-center justify-between px-3 text-[10px] font-bold">
          <span className="flex items-center gap-1.5">
            <span className="indie-dot" />
            <span className="indie-dot bg-accent" />
          </span>
          <span>/login - skillbridge</span>
          <span className="text-muted-foreground">enjoy</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 top-8">
          <AuthScreen
            isDemoMode={isDemoMode}
            onSignIn={signIn}
            onSignUp={signUp}
            onGoogle={signInWithGoogle}
            onResetPassword={resetPassword}
            onAuthenticated={() => router.replace("/home")}
          />
        </div>
      </section>
    </AppViewport>
  );
}
