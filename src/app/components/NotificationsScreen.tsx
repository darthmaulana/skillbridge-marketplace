import { Bell, Briefcase, CheckCircle2, ChevronLeft, MessageCircle, Shield, UserCheck } from "lucide-react";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "message" | "verification" | "post" | "safety";
  unread: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

interface Props {
  notifications: NotificationItem[];
  onBack: () => void;
  onMarkAllRead: () => void;
}

export function NotificationsScreen({ notifications, onBack, onMarkAllRead }: Props) {
  const unreadCount = notifications.filter((item) => item.unread).length;

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 pb-4 pt-12">
        <button onClick={onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <ChevronLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-foreground">Notifications</h1>
          <p className="text-xs text-muted-foreground">{unreadCount ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}` : "You are all caught up"}</p>
        </div>
        <button onClick={onMarkAllRead} disabled={!unreadCount} className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground disabled:opacity-50">
          Mark read
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
        {notifications.length === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <div>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Bell size={28} className="text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground">No notifications yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Messages, verification updates, and safety alerts will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map((item) => (
              <article key={item.id} className={`rounded-2xl border p-4 ${item.unread ? "border-primary/20 bg-blue-50" : "border-border bg-card"}`}>
                <div className="flex gap-3">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${iconStyle[item.type]}`}>
                    <NotificationIcon type={item.type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-sm font-bold text-foreground">{item.title}</h2>
                      {item.unread && <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                      {item.actionLabel && item.onAction && (
                        <button onClick={item.onAction} className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white">
                          {item.actionLabel}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const iconStyle: Record<NotificationItem["type"], string> = {
  message: "bg-sky-100 text-sky-600",
  verification: "bg-emerald-100 text-emerald-600",
  post: "bg-blue-100 text-primary",
  safety: "bg-amber-100 text-amber-700",
};

function NotificationIcon({ type }: { type: NotificationItem["type"] }) {
  if (type === "message") return <MessageCircle size={19} />;
  if (type === "verification") return <UserCheck size={19} />;
  if (type === "post") return <Briefcase size={19} />;
  if (type === "safety") return <Shield size={19} />;
  return <CheckCircle2 size={19} />;
}
