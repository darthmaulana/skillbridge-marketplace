import type { ReactNode } from "react";

export function AppViewport({ children }: { children: ReactNode }) {
  return (
    <main className="indie-wallpaper flex min-h-screen items-start justify-center overflow-hidden px-3 lg:px-6">
      <aside className="pointer-events-none fixed left-5 top-5 hidden rounded-2xl border-2 border-foreground bg-card/90 p-3 shadow-[4px_4px_0_#26231d] lg:block">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]">SkillBridge OS</p>
        <p className="mt-1 text-xs text-muted-foreground">jobs / skills / local</p>
      </aside>
      {children}
    </main>
  );
}
