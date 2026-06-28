"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatDetailScreen } from "@/app/components/ChatDetailScreen";
import { useAppState } from "@/components/providers/AppStateProvider";
import { loadChatThread, sendChatMessage, subscribeToChatMessages, type ChatThread } from "@/lib/chat";
import { markChatRead } from "@/lib/chatRead";
import { acceptOrderCompletion, cancelOrderBill, createBillCheckout, loadChatOrders, submitOrderCompletion, type ChatOrder } from "@/lib/paymentClient";

export default function ClientPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { posts, profile } = useAppState();
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [orders, setOrders] = useState<ChatOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    setLoading(true);
    loadChatThread(params.id, profile, posts).then((result) => {
      if (!active) return;
      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      setThread(result.data ?? null);
      markChatRead(params.id);
    });
    const unsubscribe = subscribeToChatMessages(params.id, profile.id, (message) => {
      if (!active) return;
      setThread((current) => current ? {
        ...current,
        messages: current.messages.some((item) => item.id === message.id) ? current.messages : [...current.messages, message],
      } : current);
      if (!message.mine) markChatRead(params.id);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [params.id, posts, profile]);

  const refreshOrders = async () => {
    const result = await loadChatOrders(params.id);
    if (result.data) setOrders(result.data);
  };

  useEffect(() => {
    void refreshOrders();
  }, [params.id]);

  if (loading || !profile) {
    return <div className="grid h-full place-items-center text-sm text-muted-foreground">Loading conversation...</div>;
  }

  if (error || !thread) {
    return (
      <div className="grid h-full place-items-center px-6 text-center">
        <div>
          <h1 className="font-bold">Conversation unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error || "This conversation could not be loaded."}</p>
          <button onClick={() => router.replace("/chat")} className="mt-4 text-sm font-semibold text-primary">Return to messages</button>
        </div>
      </div>
    );
  }

  return (
    <ChatDetailScreen
      thread={thread}
      currentUserId={profile.id}
      orders={orders}
      onBack={() => router.push("/chat")}
      onOpenPost={() => {
        if (thread.chat.postId) router.push(`/posts/${thread.chat.postId}`);
      }}
      onSend={(message) => sendChatMessage(params.id, message, profile)}
      onCreateBill={async (input) => {
        const result = await createBillCheckout({ chatId: params.id, ...input });
        await refreshOrders();
        return result.error;
      }}
      onSubmitCompletion={async (orderId, input) => {
        const result = await submitOrderCompletion(orderId, input);
        await refreshOrders();
        return result.error;
      }}
      onAcceptCompletion={async (orderId) => {
        const result = await acceptOrderCompletion(orderId);
        await refreshOrders();
        return result.error;
      }}
      onCancelBill={async (orderId) => {
        const result = await cancelOrderBill(orderId);
        await refreshOrders();
        return result.error;
      }}
    />
  );
}
