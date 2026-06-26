import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Post } from "@/app/components/shared/PostCard";
import { DEMO_PUBLIC_PROFILES, type PublicProfile, type UserProfile } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { getDemoBlockedUserIds } from "@/lib/safety";

export interface ChatSummary {
  id: string;
  postId: string | null;
  postTitle: string;
  postMode: "online" | "offline" | null;
  otherUserId: string;
  otherName: string;
  otherAvatarUrl: string | null;
  otherVerified: boolean;
  lastMessage: string;
  lastMessageAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  message: string;
  createdAt: string;
  mine: boolean;
}

export interface ChatThread {
  chat: ChatSummary;
  messages: ChatMessage[];
  canMessage: boolean;
  accessMessage?: string;
}

export interface ChatResult<T> {
  data?: T;
  error?: string;
}

interface ChatRow {
  id: string;
  post_id: string | null;
  participant_one_id: string;
  participant_two_id: string;
  created_at: string;
}

interface MessageRow {
  id: string;
  chat_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

interface DemoChatState {
  chats: ChatRow[];
  messages: MessageRow[];
}

const DEMO_CHAT_KEY = "skillbridge-chats";

const DEMO_CHAT_STATE: DemoChatState = {
  chats: [
    { id: "demo-chat-rizky", post_id: "1", participant_one_id: "demo-ayu", participant_two_id: "demo-rizky", created_at: "2026-06-14T08:00:00Z" },
    { id: "demo-chat-budi", post_id: "5", participant_one_id: "demo-ayu", participant_two_id: "demo-budi", created_at: "2026-06-13T07:00:00Z" },
    { id: "demo-chat-farhan", post_id: "3", participant_one_id: "demo-ayu", participant_two_id: "demo-farhan", created_at: "2026-06-12T05:00:00Z" },
  ],
  messages: [
    { id: "demo-message-1", chat_id: "demo-chat-rizky", sender_id: "demo-ayu", message: "Hi! I saw your post about the leaking pipe.", created_at: "2026-06-14T08:02:00Z" },
    { id: "demo-message-2", chat_id: "demo-chat-rizky", sender_id: "demo-rizky", message: "Sure, when can you come?", created_at: "2026-06-14T08:05:00Z" },
    { id: "demo-message-3", chat_id: "demo-chat-budi", sender_id: "demo-budi", message: "I've sent the Figma file link.", created_at: "2026-06-13T09:00:00Z" },
    { id: "demo-message-4", chat_id: "demo-chat-farhan", sender_id: "demo-ayu", message: "I can help with the translation project.", created_at: "2026-06-12T06:00:00Z" },
    { id: "demo-message-5", chat_id: "demo-chat-farhan", sender_id: "demo-farhan", message: "Great, I will send the article details here.", created_at: "2026-06-12T06:08:00Z" },
  ],
};

export async function loadChats(profile: UserProfile, posts: Post[]): Promise<ChatResult<ChatSummary[]>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    const state = loadDemoChatState();
    const blockedIds = getDemoBlockedUserIds();
    const visibleChats = state.chats.filter((chat) => {
      const otherUserId = chat.participant_one_id === profile.id ? chat.participant_two_id : chat.participant_one_id;
      return !blockedIds.has(otherUserId);
    });
    return { data: mapChatRows(visibleChats, state.messages, profile, posts) };
  }

  const { data: chatRows, error: chatError } = await supabase
    .from("chats")
    .select("id,post_id,participant_one_id,participant_two_id,created_at")
    .order("created_at", { ascending: false });
  if (chatError) return { error: chatError.message };
  if (!chatRows?.length) return { data: [] };

  const rows = chatRows as ChatRow[];
  const otherUserIds = [...new Set(rows.map((chat) => chat.participant_one_id === profile.id ? chat.participant_two_id : chat.participant_one_id))];
  const chatIds = rows.map((chat) => chat.id);
  const [{ data: publicProfiles, error: profileError }, { data: messageRows, error: messageError }] = await Promise.all([
    supabase.from("public_profiles").select("id,full_name,avatar_url,bio,skills,portfolio_url,location,verification_status,created_at").in("id", otherUserIds),
    supabase.from("messages").select("id,chat_id,sender_id,message,created_at").in("chat_id", chatIds).order("created_at", { ascending: true }),
  ]);
  if (profileError) return { error: profileError.message };
  if (messageError) return { error: messageError.message };

  return {
    data: mapChatRows(rows, messageRows as MessageRow[], profile, posts, publicProfiles as PublicProfile[]),
  };
}

export async function loadChatThread(chatId: string, profile: UserProfile, posts: Post[]): Promise<ChatResult<ChatThread>> {
  const chatResult = await loadChats(profile, posts);
  if (chatResult.error) return { error: chatResult.error };
  const chat = chatResult.data?.find((item) => item.id === chatId);
  if (!chat) return { error: "Conversation not found." };

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    const state = loadDemoChatState();
    const canMessage = chat.postMode !== "offline" || (profile.verification_status === "approved" && profile.offline_job_access && chat.otherVerified);
    return {
      data: {
        chat,
        messages: state.messages.filter((message) => message.chat_id === chatId).map((message) => mapMessage(message, profile.id)),
        canMessage,
        accessMessage: canMessage ? undefined : "Both users must be verified before messaging about offline work.",
      },
    };
  }

  const [{ data: messageRows, error: messageError }, { data: canMessage, error: accessError }] = await Promise.all([
    supabase.from("messages").select("id,chat_id,sender_id,message,created_at").eq("chat_id", chatId).order("created_at", { ascending: true }),
    supabase.rpc("can_message_chat", { target_chat_id: chatId, target_user_id: profile.id }),
  ]);
  if (messageError) return { error: messageError.message };
  if (accessError) return { error: accessError.message };

  return {
    data: {
      chat,
      messages: (messageRows as MessageRow[]).map((message) => mapMessage(message, profile.id)),
      canMessage: Boolean(canMessage),
      accessMessage: canMessage ? undefined : "Messaging is unavailable because of verification or account blocking rules.",
    },
  };
}

export async function openChatForPost(post: Post, profile: UserProfile): Promise<ChatResult<string>> {
  if (post.userId === profile.id || post.owner) return { error: "You cannot start a chat on your own post." };

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    if (getDemoBlockedUserIds().has(post.userId)) return { error: "Chat is unavailable because this user is blocked." };
    if (post.mode === "offline" && (profile.verification_status !== "approved" || !profile.offline_job_access || !post.verified)) {
      return { error: "Both users must be verified before starting an offline chat." };
    }
    const state = loadDemoChatState();
    const existing = state.chats.find((chat) => chat.post_id === post.id && [chat.participant_one_id, chat.participant_two_id].includes(profile.id));
    if (existing) return { data: existing.id };

    const id = crypto.randomUUID();
    state.chats.unshift({
      id,
      post_id: post.id,
      participant_one_id: profile.id,
      participant_two_id: post.userId,
      created_at: new Date().toISOString(),
    });
    saveDemoChatState(state);
    return { data: id };
  }

  const { data, error } = await supabase.rpc("open_chat_for_post", { target_post_id: post.id });
  return error ? { error: error.message } : { data: data as string };
}

export async function sendChatMessage(chatId: string, message: string, profile: UserProfile): Promise<ChatResult<ChatMessage>> {
  const cleanMessage = message.trim();
  if (!cleanMessage) return { error: "Message cannot be empty." };
  if (cleanMessage.length > 5000) return { error: "Message must be 5,000 characters or fewer." };

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    const state = loadDemoChatState();
    const chat = state.chats.find((item) => item.id === chatId);
    if (!chat || ![chat.participant_one_id, chat.participant_two_id].includes(profile.id)) return { error: "Conversation not found." };
    const otherUserId = chat.participant_one_id === profile.id ? chat.participant_two_id : chat.participant_one_id;
    if (getDemoBlockedUserIds().has(otherUserId)) return { error: "Messaging is unavailable because this user is blocked." };

    const row: MessageRow = {
      id: crypto.randomUUID(),
      chat_id: chatId,
      sender_id: profile.id,
      message: cleanMessage,
      created_at: new Date().toISOString(),
    };
    state.messages.push(row);
    saveDemoChatState(state);
    return { data: mapMessage(row, profile.id) };
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({ chat_id: chatId, sender_id: profile.id, message: cleanMessage })
    .select("id,chat_id,sender_id,message,created_at")
    .single();
  return error ? { error: error.message } : { data: mapMessage(data as MessageRow, profile.id) };
}

export function subscribeToChatMessages(chatId: string, currentUserId: string, onMessage: (message: ChatMessage) => void) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return () => {};

  const channel: RealtimeChannel = supabase
    .channel(`chat:${chatId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
      (payload) => onMessage(mapMessage(payload.new as MessageRow, currentUserId)),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

function mapChatRows(
  chats: ChatRow[],
  messages: MessageRow[],
  profile: UserProfile,
  posts: Post[],
  publicProfiles: PublicProfile[] = Object.values(DEMO_PUBLIC_PROFILES),
) {
  const postById = new Map(posts.map((post) => [post.id, post]));
  const publicProfileById = new Map(publicProfiles.map((item) => [item.id, item]));
  const lastMessageByChat = new Map<string, MessageRow>();
  for (const message of messages) lastMessageByChat.set(message.chat_id, message);

  return chats.map((chat): ChatSummary => {
    const otherUserId = chat.participant_one_id === profile.id ? chat.participant_two_id : chat.participant_one_id;
    const otherProfile = publicProfileById.get(otherUserId);
    const post = chat.post_id ? postById.get(chat.post_id) : undefined;
    const lastMessage = lastMessageByChat.get(chat.id);
    const otherName = otherProfile?.full_name || post?.userName || "SkillBridge user";

    return {
      id: chat.id,
      postId: chat.post_id,
      postTitle: post?.title || "General conversation",
      postMode: post?.mode ?? null,
      otherUserId,
      otherName,
      otherAvatarUrl: otherProfile?.avatar_url ?? null,
      otherVerified: otherProfile?.verification_status === "approved" || Boolean(post?.verified),
      lastMessage: lastMessage?.message || "No messages yet. Say hello!",
      lastMessageAt: lastMessage?.created_at || chat.created_at,
    };
  }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

function mapMessage(row: MessageRow, currentUserId: string): ChatMessage {
  return {
    id: row.id,
    chatId: row.chat_id,
    senderId: row.sender_id,
    message: row.message,
    createdAt: row.created_at,
    mine: row.sender_id === currentUserId,
  };
}

function loadDemoChatState(): DemoChatState {
  if (typeof window === "undefined") return structuredClone(DEMO_CHAT_STATE);
  const saved = localStorage.getItem(DEMO_CHAT_KEY);
  if (!saved) {
    saveDemoChatState(DEMO_CHAT_STATE);
    return structuredClone(DEMO_CHAT_STATE);
  }
  try {
    return JSON.parse(saved) as DemoChatState;
  } catch {
    localStorage.removeItem(DEMO_CHAT_KEY);
    return structuredClone(DEMO_CHAT_STATE);
  }
}

function saveDemoChatState(state: DemoChatState) {
  if (typeof window !== "undefined") localStorage.setItem(DEMO_CHAT_KEY, JSON.stringify(state));
}
