import { useMemo, useState } from "react";
import { AlertCircle, MessageCircle, Search, Shield } from "lucide-react";
import type { ChatSummary } from "@/lib/chat";

interface Props {
  chats: ChatSummary[];
  loading: boolean;
  error: string | null;
  onChat: (chatId: string) => void;
  onRetry: () => void;
}

export function ChatListScreen({ chats, loading, error, onChat, onRetry }: Props) {
  const [query, setQuery] = useState("");
  const filteredChats = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return chats;
    return chats.filter((chat) =>
      chat.otherName.toLowerCase().includes(cleanQuery)
      || chat.postTitle.toLowerCase().includes(cleanQuery)
      || chat.lastMessage.toLowerCase().includes(cleanQuery),
    );
  }, [chats, query]);

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="border-b border-border bg-card px-4 pb-4 pt-12">
        <h1 className="mb-4 text-xl font-bold">Messages</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations..."
            className="w-full rounded-xl bg-muted py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        {loading && <div className="grid h-48 place-items-center text-sm text-muted-foreground">Loading conversations...</div>}

        {!loading && error && (
          <div className="mx-4 mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
            <AlertCircle className="mx-auto text-destructive" size={24} />
            <p className="mt-2 text-sm text-destructive">{error}</p>
            <button onClick={onRetry} className="mt-3 text-sm font-semibold text-primary">Try again</button>
          </div>
        )}

        {!loading && !error && filteredChats.length === 0 && (
          <div className="mx-4 mt-8 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
            <MessageCircle className="mx-auto text-muted-foreground" size={30} />
            <h2 className="mt-3 font-semibold">{query ? "No matching conversations" : "No conversations yet"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {query ? "Try another name, post, or message." : "Open a post and tap Contact / Chat to start one."}
            </p>
          </div>
        )}

        {!loading && !error && filteredChats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onChat(chat.id)}
            className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left transition-colors active:bg-muted"
          >
            <div className="relative flex-shrink-0">
              {chat.otherAvatarUrl ? (
                <img src={chat.otherAvatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="avatar-fallback flex h-12 w-12 items-center justify-center rounded-full font-bold">
                  {chat.otherName.charAt(0).toUpperCase()}
                </div>
              )}
              {chat.otherVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
                  <Shield size={10} className="text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center justify-between">
                <span className={`truncate ${chat.unread ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>{chat.otherName}</span>
                <span className={`ml-2 flex-shrink-0 text-xs ${chat.unread ? "font-bold text-primary" : "text-muted-foreground"}`}>{formatChatTime(chat.lastMessageAt)}</span>
              </div>
              <p className="mb-0.5 truncate text-xs font-medium text-primary">{chat.postTitle}</p>
              <div className="flex items-center gap-2">
                <p className={`truncate text-sm ${chat.unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{chat.lastMessage}</p>
                {chat.unread && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function formatChatTime(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(date);
  }
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}
