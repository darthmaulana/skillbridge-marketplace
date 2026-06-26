"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppViewport } from "./AppViewport";
import { BottomNav } from "@/app/components/shared/BottomNav";

const navRoutes = ["/home", "/search", "/chat", "/profile"];
const routeTitles: Record<string, string> = {
  "/home": "/home/fun - skillbridge",
  "/search": "/search - skillbridge",
  "/chat": "/messages - skillbridge",
  "/profile": "/me - skillbridge",
  "/create": "/create-post - skillbridge",
};

export function MobileAppShell({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const pathname = usePathname();
  const showBottomNav = !admin && navRoutes.includes(pathname);
  const title = admin ? "/admin - skillbridge" : routeTitles[pathname] ?? "/skillbridge";

  return (
    <AppViewport>
      <section
        className="indie-window relative mx-auto min-h-screen w-full max-w-md overflow-hidden bg-background lg:my-5 lg:h-[797px] lg:min-h-0 lg:rounded-[1.75rem]"
        style={{ contain: "layout" }}
      >
        <div className="indie-titlebar absolute inset-x-0 top-0 z-[60] flex h-8 items-center justify-between px-3 text-[10px] font-bold">
          <span className="flex items-center gap-1.5">
            <span className="indie-dot" />
            <span className="indie-dot bg-accent" />
          </span>
          <span className="max-w-[220px] truncate">{title}</span>
          <span className="hidden text-muted-foreground sm:inline">enjoy</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 top-8 flex flex-col" style={{ overscrollBehavior: "contain" }}>
          {children}
        </div>
        {showBottomNav && <BottomNav unreadChats={0} />}
      </section>
    </AppViewport>
  );
}
