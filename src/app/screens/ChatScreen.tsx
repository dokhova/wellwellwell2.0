import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, CheckCheck, MessageCircle, Search, Send, X } from "lucide-react";
import type { ChatMessage, ChatPeer, ChatThread } from "@/app/types";
import { GREEN, GREEN_LIGHT, UNSPLASH } from "@/app/data/constants";
import { fetchMessages, makeThreadId, markThreadMessagesRead, sendMessage, subscribeToThread, type MessageRow } from "@/app/lib/api/chat";
import { searchProfiles } from "@/app/lib/api/profiles";
import { sanitizeImageUrl } from "@/app/lib/api/storage";

const QUICK_MESSAGES = [
  "Привет! Готов(а) начать?",
  "Как проходит план?",
  "Увидимся на тренировке 👍",
  "Есть вопрос по плану",
];

const formatChatTime = (value: number) =>
  new Date(value).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

const mapMessageRow = (message: MessageRow, currentUserId: string): ChatMessage => ({
  id: message.id,
  sender: message.sender_id === currentUserId ? "me" : "peer",
  text: message.text,
  createdAt: new Date(message.created_at).getTime(),
  readAt: message.read_at ? new Date(message.read_at).getTime() : null,
  status: "sent",
});

function PeerAvatar({ peer, size = 44 }: { peer: ChatPeer; size?: number }) {
  if (peer.avatarUrl) {
    return <img loading="lazy" decoding="async" src={peer.avatarUrl} alt={peer.name} className="flex-shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }

  const initials = peer.name.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return (
    <div className="flex flex-shrink-0 items-center justify-center rounded-full" style={{ width: size, height: size, backgroundColor: GREEN_LIGHT }}>
      <span className="text-[13px] font-bold" style={{ color: GREEN }}>{initials}</span>
    </div>
  );
}

export function ChatsScreen({
  threads,
  onOpenThread,
  currentUserId,
  availablePeers = [],
}: {
  threads: ChatThread[];
  onOpenThread: (peer: ChatPeer) => void;
  currentUserId: string;
  availablePeers?: ChatPeer[];
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remotePeers, setRemotePeers] = useState<ChatPeer[]>([]);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleThreads = [...threads].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.updatedAt - a.updatedAt);
  const matchingThreads = normalizedQuery
    ? visibleThreads.filter((thread) => thread.peer.name.toLowerCase().includes(normalizedQuery))
    : visibleThreads;
  const existingPeerIds = new Set(threads.map((thread) => thread.peer.id));
  useEffect(() => {
    if (!normalizedQuery) {
      setRemotePeers([]);
      return;
    }

    let cancelled = false;
    const loadProfiles = async () => {
      try {
        const profiles = await searchProfiles(normalizedQuery);
        if (cancelled) return;
        setRemotePeers(profiles
          .filter((profile) => profile.id !== currentUserId)
          .map((profile) => ({
            id: profile.id,
            name: profile.name,
            avatarUrl: sanitizeImageUrl(profile.photoUrl),
            realUser: true,
          })));
      } catch (error) {
        console.error("Supabase chat profile search failed", error);
      }
    };

    void loadProfiles();
    return () => {
      cancelled = true;
    };
  }, [currentUserId, normalizedQuery]);

  const newPeerMatches = normalizedQuery
    ? [...remotePeers, ...availablePeers]
        .filter((peer) => !existingPeerIds.has(peer.id))
        .filter((peer, index, items) => items.findIndex((item) => item.id === peer.id) === index)
        .filter((peer) => peer.name.toLowerCase().includes(normalizedQuery))
    : [];

  return (
      <div className="flex h-full flex-col bg-surface">
      <div className="flex h-14 flex-shrink-0 items-center gap-3 px-4">
        <h1 className="text-[24px] font-semibold leading-7 text-foreground">Чаты</h1>
        <div className="ml-auto flex min-w-0 items-center justify-end">
          {searchOpen ? (
            <div className="flex h-10 min-w-0 items-center gap-2 rounded-full bg-card px-3">
              <Search size={17} strokeWidth={1.9} className="flex-shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск"
                className="w-[150px] min-w-0 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={() => {
                  setQuery("");
                  setSearchOpen(false);
                }}
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground"
                aria-label="Закрыть поиск"
              >
                <X size={15} strokeWidth={2.1} />
              </button>
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="w-[22px] h-[22px] flex items-center justify-center text-muted-foreground" aria-label="Поиск">
              <Search size={22} strokeWidth={1.8} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-5">
        {visibleThreads.length === 0 && !normalizedQuery ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl bg-card px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: GREEN_LIGHT }}>
              <MessageCircle size={24} strokeWidth={1.9} color={GREEN} />
            </div>
            <p className="text-[17px] font-semibold text-foreground">Пока нет диалогов</p>
            <p className="mt-2 text-[14px] leading-5 text-muted-foreground">Напишите автору плана или участнику события, и чат появится здесь.</p>
          </div>
        ) : matchingThreads.length > 0 || newPeerMatches.length > 0 ? (
          <div className="space-y-2.5">
            {matchingThreads.map((thread) => {
              const lastMessage = thread.messages[thread.messages.length - 1];
              return (
                <button
                  key={thread.peer.id}
                  onClick={() => onOpenThread(thread.peer)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-card px-3.5 py-3 text-left active:opacity-90"
                >
                  <PeerAvatar peer={thread.peer} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground">{thread.peer.name}</p>
                      <span className="text-[12px] text-muted-foreground">{formatChatTime(thread.updatedAt)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[13px] leading-4 text-muted-foreground">
                      {lastMessage?.sender === "me" ? "Вы: " : ""}{lastMessage?.text ?? ""}
                    </p>
                  </div>
                  {Boolean(thread.unreadCount) && (
                    <span className="flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white" style={{ backgroundColor: GREEN }}>
                      {thread.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
            {newPeerMatches.map((peer) => (
              <button
                key={peer.id}
                onClick={() => onOpenThread(peer)}
                className="flex w-full items-center gap-3 rounded-2xl bg-card px-3.5 py-3 text-left active:opacity-90"
              >
                <PeerAvatar peer={peer} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-foreground">{peer.name}</p>
                  <p className="mt-0.5 text-[13px] leading-4 text-muted-foreground">Начать новый чат</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-card px-6 py-12 text-center">
            <p className="text-[16px] font-semibold text-foreground">Ничего не найдено</p>
            <p className="mt-2 text-[14px] leading-5 text-muted-foreground">Попробуйте имя автора или участника.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatScreen({
  peer,
  messages,
  currentUserId,
  myAvatarUrl,
  onBack,
  onSendMessage,
  onReceiveRemoteMessage,
  onConfirmRemoteMessage,
}: {
  peer: ChatPeer;
  messages: ChatMessage[];
  currentUserId: string;
  myAvatarUrl: string | null;
  onBack: () => void;
  onSendMessage: (peer: ChatPeer, text: string, sender: ChatMessage["sender"], status?: ChatMessage["status"], messageId?: string) => ChatMessage | null;
  onReceiveRemoteMessage: (peer: ChatPeer, message: ChatMessage) => void;
  onConfirmRemoteMessage: (peer: ChatPeer, localId: string, message: ChatMessage) => void;
}) {
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isRealPeer = !peer.cannedReplies?.length;
  const threadId = isRealPeer ? makeThreadId(currentUserId, peer.id) : "";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, typing]);

  useEffect(() => {
    if (!isRealPeer || !threadId) return;
    let cancelled = false;

    const loadMessages = async () => {
      try {
        const rows = await fetchMessages(threadId);
        if (cancelled) return;
        rows.forEach((row) => {
          onReceiveRemoteMessage(peer, mapMessageRow(row, currentUserId));
        });
        await markThreadMessagesRead(threadId, currentUserId);
      } catch (error) {
        console.error("Supabase chat fetch failed", error);
      }
    };

    void loadMessages();
    const unsubscribe = subscribeToThread(threadId, (message) => {
      if (message.sender_id === currentUserId) return;
      onReceiveRemoteMessage(peer, mapMessageRow(message, currentUserId));
      void markThreadMessagesRead(threadId, currentUserId).catch((error) => {
        console.error("Supabase chat mark read failed", error);
      });
    }, (message) => {
      onReceiveRemoteMessage(peer, mapMessageRow(message, currentUserId));
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [currentUserId, isRealPeer, onReceiveRemoteMessage, peer, threadId]);

  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, []);

  const send = (value: string) => {
    const body = value.trim();
    if (!body || (isRealPeer && sending)) return;
    const messageId = crypto.randomUUID();
    const localMessage = onSendMessage(peer, body, "me", isRealPeer ? "sending" : undefined, messageId);
    setText("");

    if (isRealPeer && threadId) {
      setSending(true);
      void sendMessage({ id: messageId, threadId, senderId: currentUserId, text: body, photoUrl: null }).then((message) => {
        if (message && localMessage) onConfirmRemoteMessage(peer, localMessage.id, mapMessageRow(message, currentUserId));
      }).catch((error) => {
        console.error("Supabase chat send failed", error);
      }).finally(() => {
        setSending(false);
      });
    }

    if (peer.cannedReplies?.length) {
      setTyping(true);
      const replyIndex = messages.filter((message) => message.sender === "peer").length % peer.cannedReplies.length;
      timeoutRef.current = window.setTimeout(() => {
        onSendMessage(peer, peer.cannedReplies?.[replyIndex] ?? "", "peer");
        setTyping(false);
      }, 1100 + Math.round(Math.random() * 400));
    }
  };

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-border bg-card px-4">
        <button onClick={onBack} className="flex h-10 w-8 items-center justify-start active:opacity-80">
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <PeerAvatar peer={peer} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold text-foreground">{peer.name}</p>
          <p className="text-[12px] leading-4 text-muted-foreground">{peer.cannedReplies?.length ? "демо-ответы включены" : "чат готов к реальному собеседнику"}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="mb-4 rounded-2xl bg-card px-4 py-3 text-[13px] leading-5 text-muted-foreground">
            Это локальный демо-чат. Сообщения сохраняются только на этом устройстве.
          </div>
        )}
        <div className="space-y-2.5">
          {messages.map((message) => {
            const mine = message.sender === "me";
            const myPeer: ChatPeer = { id: "me", name: "Вы", avatarUrl: myAvatarUrl };
            return (
              <div key={message.id} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && <PeerAvatar peer={peer} size={28} />}
                <div
                  className="max-w-[78%] rounded-2xl px-3.5 py-2.5"
                  style={mine ? { backgroundColor: GREEN, color: "#fff" } : { backgroundColor: "var(--card)", color: "var(--foreground)" }}
                >
                  <p className="text-[14px] leading-5">{message.text}</p>
                  <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-white/70" : "text-muted-foreground"}`}>
                    <span>{formatChatTime(message.createdAt)}</span>
                    {mine && isRealPeer && message.status === "sent" && (
                      message.readAt ? <CheckCheck size={12} strokeWidth={2.2} /> : <Check size={12} strokeWidth={2.2} />
                    )}
                  </div>
                </div>
                {mine && <PeerAvatar peer={myPeer} size={28} />}
              </div>
            );
          })}
          {typing && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-card px-3.5 py-2.5 text-[13px] text-muted-foreground">{peer.name} печатает...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-border bg-card px-4 pb-4 pt-3">
        <div className="-mx-4 mb-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-2">
            {QUICK_MESSAGES.map((message) => (
              <button
                key={message}
                onClick={() => send(message)}
                disabled={isRealPeer && sending}
                className="flex-shrink-0 rounded-full bg-muted px-3.5 py-2 text-[13px] font-medium text-foreground active:opacity-85"
              >
                {message}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-input px-3 py-2">
          <PeerAvatar peer={{ id: "me", name: "Вы", avatarUrl: myAvatarUrl ?? UNSPLASH.userAvatar }} size={32} />
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !(isRealPeer && sending)) send(text);
            }}
            placeholder="Сообщение"
            className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => send(text)}
            disabled={!text.trim() || (isRealPeer && sending)}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full disabled:opacity-50"
            style={{ backgroundColor: GREEN }}
          >
            <Send size={15} strokeWidth={2.2} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}
