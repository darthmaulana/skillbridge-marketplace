const CHAT_READ_KEY = "skillbridge-chat-read-at";
export const CHAT_READ_EVENT = "skillbridge-chat-read-change";

type ChatReadState = Record<string, string>;

export function getChatReadAt(chatId: string) {
  return readState()[chatId] ?? null;
}

export function markChatRead(chatId: string, readAt = new Date().toISOString()) {
  if (typeof window === "undefined") return;
  const state = readState();
  state[chatId] = readAt;
  localStorage.setItem(CHAT_READ_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(CHAT_READ_EVENT, { detail: { chatId, readAt } }));
}

export function markChatsRead(chatIds: string[]) {
  if (typeof window === "undefined" || chatIds.length === 0) return;
  const state = readState();
  const readAt = new Date().toISOString();
  for (const chatId of chatIds) state[chatId] = readAt;
  localStorage.setItem(CHAT_READ_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(CHAT_READ_EVENT, { detail: { chatIds, readAt } }));
}

function readState(): ChatReadState {
  if (typeof window === "undefined") return {};
  const saved = localStorage.getItem(CHAT_READ_KEY);
  if (!saved) return {};
  try {
    return JSON.parse(saved) as ChatReadState;
  } catch {
    localStorage.removeItem(CHAT_READ_KEY);
    return {};
  }
}
