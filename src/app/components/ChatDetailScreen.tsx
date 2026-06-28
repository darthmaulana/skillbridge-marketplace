import { useEffect, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle, ChevronLeft, CreditCard, Link2, Plus, Send, Shield, Trash2, Wifi, Users } from "lucide-react";
import type { ChatMessage, ChatThread } from "@/lib/chat";
import type { ChatOrder } from "@/lib/paymentClient";

interface Props {
  thread: ChatThread;
  currentUserId: string;
  orders: ChatOrder[];
  onBack: () => void;
  onOpenPost: () => void;
  onSend: (message: string) => Promise<{ data?: ChatMessage; error?: string }>;
  onCreateBill: (input: { amount: number; title: string; note?: string }) => Promise<string | void>;
  onSubmitCompletion: (orderId: string, input: { completionUrl?: string; completionNote?: string }) => Promise<string | void>;
  onAcceptCompletion: (orderId: string) => Promise<string | void>;
  onCancelBill: (orderId: string) => Promise<string | void>;
}

export function ChatDetailScreen({ thread, currentUserId, orders, onBack, onOpenPost, onSend, onCreateBill, onSubmitCompletion, onAcceptCompletion, onCancelBill }: Props) {
  const [messages, setMessages] = useState(thread.messages);
  const [input, setInput] = useState("");
  const [billOpen, setBillOpen] = useState(false);
  const [billTitle, setBillTitle] = useState(thread.chat.postTitle);
  const [billAmount, setBillAmount] = useState("");
  const [billNote, setBillNote] = useState("");
  const [completionByOrder, setCompletionByOrder] = useState<Record<string, { url: string; note: string }>>({});
  const [sending, setSending] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const isPostOwner = thread.chat.postOwnerId === currentUserId;
  const canCreateBill = thread.chat.postType === "skill"
    ? isPostOwner
    : thread.chat.postType === "job"
      ? !isPostOwner && Boolean(thread.chat.postOwnerId)
      : false;
  const billButtonLabel = thread.chat.postType === "job" ? "Send Work Bill" : "Create Bill";
  const billHint = thread.chat.postType === "job"
    ? "For job posts, the worker sends a bill to the job poster."
    : "For skill posts, the skill owner sends a bill to the requester.";

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

  const createBill = async () => {
    const amount = Number(billAmount);
    if (!billTitle.trim() || !Number.isFinite(amount) || amount < 1000 || working) {
      setError("Add a bill title and amount of at least Rp 1.000.");
      return;
    }
    setWorking(true);
    setError(null);
    const result = await onCreateBill({ amount, title: billTitle, note: billNote });
    setWorking(false);
    if (result) {
      setError(result);
      return;
    }
    setBillOpen(false);
    setBillAmount("");
    setBillNote("");
  };

  const submitCompletion = async (orderId: string) => {
    const completion = completionByOrder[orderId] ?? { url: "", note: "" };
    if (!completion.url.trim() && !completion.note.trim()) {
      setError("Add a link or note before submitting completion.");
      return;
    }
    setWorking(true);
    setError(null);
    const result = await onSubmitCompletion(orderId, { completionUrl: completion.url, completionNote: completion.note });
    setWorking(false);
    if (result) setError(result);
  };

  const acceptCompletion = async (orderId: string) => {
    setWorking(true);
    setError(null);
    const result = await onAcceptCompletion(orderId);
    setWorking(false);
    if (result) setError(result);
  };

  const cancelBill = async (orderId: string) => {
    setWorking(true);
    setError(null);
    const result = await onCancelBill(orderId);
    setWorking(false);
    if (result) setError(result);
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

      <button
        onClick={onOpenPost}
        disabled={!thread.chat.postId}
        className="mx-4 mt-3 flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left disabled:cursor-default"
      >
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${thread.chat.postMode === "offline" ? "bg-orange-100 text-orange-600" : "bg-sky-100 text-sky-600"}`}>
          {thread.chat.postMode === "offline" ? <Users size={19} /> : <Wifi size={19} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Chatting about</p>
          <p className="truncate text-sm font-semibold text-foreground">{thread.chat.postTitle}</p>
        </div>
        {thread.chat.postMode && <span className="rounded-full bg-muted px-2 py-1 text-xs capitalize text-muted-foreground">{thread.chat.postMode}</span>}
        {thread.chat.postId && <ChevronLeft size={18} className="rotate-180 text-muted-foreground" />}
      </button>

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
        {(canCreateBill || orders.length > 0) && (
          <section className="mb-2 rounded-2xl border-2 border-foreground bg-card p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold">Safe payment bills</p>
                <p className="text-xs text-muted-foreground">{billHint}</p>
              </div>
              {canCreateBill && (
                <button onClick={() => setBillOpen((open) => !open)} className="flex items-center gap-1 rounded-full border border-foreground bg-[#f3c969] px-3 py-1.5 text-xs font-bold">
                  <Plus size={13} /> Bill
                </button>
              )}
            </div>

            {billOpen && (
              <div className="mb-3 space-y-2 rounded-xl border border-border bg-muted p-3">
                <input value={billTitle} onChange={(event) => setBillTitle(event.target.value)} maxLength={120} placeholder="Bill title" className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none" />
                <input value={billAmount} onChange={(event) => setBillAmount(event.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" placeholder="Amount, for example 150000" className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none" />
                <textarea value={billNote} onChange={(event) => setBillNote(event.target.value)} maxLength={1000} placeholder="Optional note about scope, deadline, or deliverables" className="min-h-20 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none" />
                <button onClick={() => void createBill()} disabled={working} className="w-full rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">
                  {working ? "Creating..." : billButtonLabel}
                </button>
              </div>
            )}

            <div className="space-y-2">
              {orders.length === 0 && <p className="text-xs text-muted-foreground">No bill yet. Create one after both users agree on price.</p>}
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  currentUserId={currentUserId}
                  working={working}
                  completion={completionByOrder[order.id] ?? { url: "", note: "" }}
                  onCompletionChange={(completion) => setCompletionByOrder((current) => ({ ...current, [order.id]: completion }))}
                  onSubmitCompletion={() => void submitCompletion(order.id)}
                  onAccept={() => void acceptCompletion(order.id)}
                  onCancel={() => void cancelBill(order.id)}
                />
              ))}
            </div>
          </section>
        )}

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

function OrderCard({
  order,
  currentUserId,
  working,
  completion,
  onCompletionChange,
  onSubmitCompletion,
  onAccept,
  onCancel,
}: {
  order: ChatOrder;
  currentUserId: string;
  working: boolean;
  completion: { url: string; note: string };
  onCompletionChange: (completion: { url: string; note: string }) => void;
  onSubmitCompletion: () => void;
  onAccept: () => void;
  onCancel: () => void;
}) {
  const payment = order.payments?.[0];
  const isBuyer = order.buyer_id === currentUserId;
  const isSeller = order.seller_id === currentUserId;
  const canPay = isBuyer && order.status === "pending_payment" && payment?.checkout_url;
  const canCancel = (isSeller || isBuyer) && order.status === "pending_payment";
  const canComplete = isSeller && ["paid_held", "in_progress", "release_requested"].includes(order.status);
  const canAccept = isBuyer && order.status === "release_requested";

  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold">{order.bill_title || "SkillBridge bill"}</p>
          {order.bill_note && <p className="mt-1 text-xs text-muted-foreground">{order.bill_note}</p>}
        </div>
        <span className="rounded-full bg-muted px-2 py-1 text-xs capitalize text-muted-foreground">{order.status.replace(/_/g, " ")}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <BillAmount label="Work" value={order.amount} />
        <BillAmount label="Total" value={order.total_amount} strong />
      </div>

      {canPay && (
        <a href={payment.checkout_url!} className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">
          <CreditCard size={15} /> Pay Bill Safely
        </a>
      )}

      {canCancel && (
        <button onClick={onCancel} disabled={working} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 disabled:opacity-60">
          <Trash2 size={15} /> Cancel Bill
        </button>
      )}

      {canComplete && (
        <div className="mt-3 space-y-2">
          <input value={completion.url} onChange={(event) => onCompletionChange({ ...completion, url: event.target.value })} placeholder="Completion link, e.g. Drive/Figma/GitHub" className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none" />
          <textarea value={completion.note} onChange={(event) => onCompletionChange({ ...completion, note: event.target.value })} placeholder="Completion note" className="min-h-16 w-full rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none" />
          <button onClick={onSubmitCompletion} disabled={working} className="w-full rounded-xl border border-foreground bg-[#f3c969] px-3 py-2 text-sm font-bold disabled:opacity-60">
            Submit Completion
          </button>
        </div>
      )}

      {(order.completion_url || order.completion_note) && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <p className="mb-1 flex items-center gap-1 font-bold"><CheckCircle size={13} /> Completion submitted</p>
          {order.completion_url && <a href={order.completion_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline"><Link2 size={12} />Open completion link</a>}
          {order.completion_note && <p className="mt-1 whitespace-pre-wrap">{order.completion_note}</p>}
        </div>
      )}

      {canAccept && (
        <button onClick={onAccept} disabled={working} className="mt-3 w-full rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-60">
          Accept Work and Release
        </button>
      )}
    </div>
  );
}

function BillAmount({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="rounded-lg bg-muted px-2 py-1.5">
      <p className="text-muted-foreground">{label}</p>
      <p className={strong ? "font-bold text-primary" : "font-semibold text-foreground"}>Rp {Number(value).toLocaleString("id-ID")}</p>
    </div>
  );
}
