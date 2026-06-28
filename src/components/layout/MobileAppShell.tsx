"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppViewport } from "./AppViewport";
import { BottomNav } from "@/app/components/shared/BottomNav";
import { useAppState } from "@/components/providers/AppStateProvider";
import { loadChats } from "@/lib/chat";
import { CHAT_READ_EVENT } from "@/lib/chatRead";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const navRoutes = ["/home", "/search", "/chat", "/profile"];
const routeTitles: Record<string, string> = {
  "/home": "/home/fun - skillbridge",
  "/search": "/search - skillbridge",
  "/chat": "/messages - skillbridge",
  "/profile": "/me - skillbridge",
  "/create": "/create-post - skillbridge",
  "/terms": "/terms - skillbridge",
  "/about": "/about - skillbridge",
};

export function MobileAppShell({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const pathname = usePathname();
  const { posts, profile } = useAppState();
  const [unreadChats, setUnreadChats] = useState(0);
  const showBottomNav = !admin && navRoutes.includes(pathname);
  const title = admin ? "/admin - skillbridge" : routeTitles[pathname] ?? "/skillbridge";

  useEffect(() => {
    if (!profile || admin) {
      setUnreadChats(0);
      return;
    }

    let active = true;
    const refreshUnread = () => {
      void loadChats(profile, posts).then((result) => {
        if (!active || result.error) return;
        setUnreadChats(result.data?.filter((chat) => chat.unread).length ?? 0);
      });
    };

    refreshUnread();
    window.addEventListener(CHAT_READ_EVENT, refreshUnread);
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      ?.channel("mobile-shell-unread-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, refreshUnread)
      .subscribe();

    return () => {
      active = false;
      window.removeEventListener(CHAT_READ_EVENT, refreshUnread);
      if (supabase && channel) void supabase.removeChannel(channel);
    };
  }, [admin, pathname, posts, profile]);

  return (
    <AppViewport>
      <section
        className="relative mx-auto min-h-screen w-full max-w-md overflow-hidden bg-background lg:indie-window lg:my-5 lg:h-[797px] lg:min-h-0 lg:rounded-[1.75rem]"
        style={{ contain: "layout" }}
      >
        <div className="indie-titlebar absolute inset-x-0 top-0 z-[60] hidden h-8 items-center justify-between px-3 text-[10px] font-bold lg:flex">
          <span className="flex items-center gap-1.5">
            <span className="indie-dot" />
            <span className="indie-dot bg-accent" />
          </span>
          <span className="max-w-[220px] truncate">{title}</span>
          <span className="hidden text-muted-foreground sm:inline">enjoy</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col lg:top-8" style={{ overscrollBehavior: "contain" }}>
          {children}
        </div>
        {showBottomNav && <BottomNav unreadChats={unreadChats} />}
      </section>
    </AppViewport>
  );
}
