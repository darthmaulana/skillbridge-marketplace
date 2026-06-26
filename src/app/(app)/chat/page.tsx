"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatListScreen } from "@/app/components/ChatListScreen";
import { useAppState } from "@/components/providers/AppStateProvider";
import { loadChats, type ChatSummary } from "@/lib/chat";

export default function ChatPage() {
  const router = useRouter();
  const { profile, posts } = useAppState();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    const result = await loadChats(profile, posts);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setChats(result.data ?? []);
  }, [posts, profile]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <ChatListScreen
      chats={chats}
      loading={loading}
      error={error}
      onRetry={() => void reload()}
      onChat={(chatId) => router.push(`/chat/${chatId}`)}
    />
  );
}
