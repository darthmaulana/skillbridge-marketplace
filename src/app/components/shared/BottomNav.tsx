import { Home, Search, PlusCircle, MessageCircle, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavTab = "home" | "search" | "create" | "chat" | "profile";

interface Props {
  unreadChats?: number;
}

const items: { id: NavTab; label: string; href: string; Icon: typeof Home }[] = [
  { id: "home", label: "Home", href: "/home", Icon: Home },
  { id: "search", label: "Search", href: "/search", Icon: Search },
  { id: "create", label: "Create", href: "/create", Icon: PlusCircle },
  { id: "chat", label: "Chat", href: "/chat", Icon: MessageCircle },
  { id: "profile", label: "Profile", href: "/profile", Icon: User },
];

export function BottomNav({ unreadChats = 0 }: Props) {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-md rounded-t-[1.4rem] border-2 border-b-0 border-foreground bg-card" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {items.map(({ id, label, href, Icon }) => {
        const isActive = pathname === href;
        const isCreate = id === "create";
        return (
          <Link
            key={id}
            href={href}
            className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${isActive && !isCreate ? "text-foreground" : "text-muted-foreground"}`}
          >
            {isCreate ? (
              <div className="flex h-11 w-11 -mt-2 items-center justify-center rounded-2xl border-2 border-foreground bg-[#f3c969]">
                <Icon size={20} className="text-foreground" />
              </div>
            ) : (
              <>
                <div className={`relative rounded-xl px-2 py-1 ${isActive ? "bg-accent" : ""}`}>
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 1.7} />
                  {id === "chat" && unreadChats > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center" style={{ fontSize: "9px", fontWeight: 700 }}>
                      {unreadChats}
                    </span>
                  )}
                </div>
                <span className={`text-xs ${isActive ? "text-foreground" : "text-muted-foreground"}`} style={{ fontWeight: isActive ? 700 : 500, fontSize: "10px" }}>{label}</span>
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
