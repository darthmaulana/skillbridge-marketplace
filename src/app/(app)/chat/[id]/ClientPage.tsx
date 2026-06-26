"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatDetailScreen } from "@/app/components/ChatDetailScreen";
import { useAppState } from "@/components/providers/AppStateProvider";
import { loadChatThread, sendChatMessage, subscribeToChatMessages, type ChatThread } from "@/lib/chat";

export default function ClientPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { posts, profile } = useAppState();
  const [thread, setThread] = useState<ChatThread | null>(null);
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
    });
    const unsubscribe = subscribeToChatMessages(params.id, profile.id, (message) => {
      if (!active) return;
      setThread((current) => current ? {
        ...current,
        messages: current.messages.some((item) => item.id === message.id) ? current.messages : [...current.messages, message],
      } : current);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [params.id, posts, profile]);

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
      onBack={() => router.push("/chat")}
      onSend={(message) => sendChatMessage(params.id, message, profile)}
    />
  );
}
