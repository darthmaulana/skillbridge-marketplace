import { useEffect, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, ChevronLeft, Send, Shield, Wifi, Users } from "lucide-react";
import type { ChatMessage, ChatThread } from "@/lib/chat";

interface Props {
  thread: ChatThread;
  onBack: () => void;
  onSend: (message: string) => Promise<{ data?: ChatMessage; error?: string }>;
}

export function ChatDetailScreen({ thread, onBack, onSend }: Props) {
  const [messages, setMessages] = useState(thread.messages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMessages(thread.messages), [thread.messages]);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const send = async () => {
    if (!input.trim() || sending || !thread.canMessage) return;
    const message = input;
    setSending(true);
    setError(null);
    const result = await onSend(message);
    setSending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.data) {
      setMessages((current) => current.some((item) => item.id === result.data?.id) ? current : [...current, result.data!]);
      setInput("");
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 pb-3 pt-12">
        <button onClick={onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><ChevronLeft size={20} /></button>
        {thread.chat.otherAvatarUrl ? (
          <img src={thread.chat.otherAvatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="avatar-fallback flex h-10 w-10 items-center justify-center rounded-full font-bold">
            {thread.chat.otherName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-semibold text-foreground">{thread.chat.otherName}</span>
            {thread.chat.otherVerified && (
              <span className="flex flex-shrink-0 items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-600">
                <Shield size={10} />Verified
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Marketplace conversation</p>
        </div>
      </header>

      <section className="mx-4 mt-3 flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${thread.chat.postMode === "offline" ? "bg-orange-100 text-orange-600" : "bg-sky-100 text-sky-600"}`}>
          {thread.chat.postMode === "offline" ? <Users size={19} /> : <Wifi size={19} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Chatting about</p>
          <p className="truncate text-sm font-semibold text-foreground">{thread.chat.postTitle}</p>
        </div>
        {thread.chat.postMode && <span className="rounded-full bg-muted px-2 py-1 text-xs capitalize text-muted-foreground">{thread.chat.postMode}</span>}
      </section>

      {thread.chat.postMode === "offline" && (
        <div className="mx-4 mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
          <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-700">Meet in public first. Do not share payment details or a precise home address before trust is established.</p>
        </div>
      )}

      {!thread.canMessage && (
        <div className="mx-4 mt-2 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-destructive" />
          <p className="text-xs leading-relaxed text-destructive">{thread.accessMessage}</p>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="my-auto text-center text-sm text-muted-foreground">No messages yet. Start the conversation.</div>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 ${message.mine ? "rounded-tr-sm bg-primary text-white" : "rounded-tl-sm border border-border bg-card text-foreground"}`}>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.message}</p>
              <p className={`mt-1 text-xs ${message.mine ? "text-white/60" : "text-muted-foreground"}`}>
                {new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.createdAt))}
              </p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <footer className="border-t border-border bg-card px-4 py-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
        <div className="flex items-end gap-2">
          <div className="flex min-h-[42px] flex-1 items-center rounded-2xl bg-muted px-4 py-2.5">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
              disabled={!thread.canMessage || sending}
              maxLength={5000}
              placeholder={thread.canMessage ? "Type a message..." : "Messaging unavailable"}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
            />
          </div>
          <button
            onClick={() => void send()}
            disabled={!thread.canMessage || !input.trim() || sending}
            aria-label="Send message"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary disabled:cursor-not-allowed disabled:bg-muted"
          >
            <Send size={16} className={thread.canMessage && input.trim() ? "text-white" : "text-muted-foreground"} />
          </button>
        </div>
      </footer>
    </div>
  );
}
