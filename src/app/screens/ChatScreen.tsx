import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import type { ChatMessage, ChatPeer, ChatThread } from "@/app/types";
import { GREEN, GREEN_LIGHT, UNSPLASH } from "@/app/data/constants";

const QUICK_MESSAGES = [
  "Привет! Готов(а) начать?",
  "Как проходит план?",
  "Увидимся на тренировке 👍",
  "Есть вопрос по плану",
];

const formatChatTime = (value: number) =>
  new Date(value).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

function PeerAvatar({ peer, size = 44 }: { peer: ChatPeer; size?: number }) {
  if (peer.avatarUrl) {
    return <img src={peer.avatarUrl} alt={peer.name} className="flex-shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
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
}: {
  threads: ChatThread[];
  onOpenThread: (peer: ChatPeer) => void;
}) {
  const visibleThreads = [...threads].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-14 flex-shrink-0 items-center px-4">
        <h1 className="text-[24px] font-bold leading-7 text-foreground">Чаты</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-5">
        {visibleThreads.length === 0 ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl bg-card px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: GREEN_LIGHT }}>
              <MessageCircle size={24} strokeWidth={1.9} color={GREEN} />
            </div>
            <p className="text-[17px] font-semibold text-foreground">Пока нет диалогов</p>
            <p className="mt-2 text-[14px] leading-5 text-muted-foreground">Напишите автору плана или участнику события, и чат появится здесь.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {visibleThreads.map((thread) => {
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
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatScreen({
  peer,
  messages,
  onBack,
  onSendMessage,
}: {
  peer: ChatPeer;
  messages: ChatMessage[];
  onBack: () => void;
  onSendMessage: (peer: ChatPeer, text: string, sender: ChatMessage["sender"]) => void;
}) {
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, typing]);

  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, []);

  const send = (value: string) => {
    const body = value.trim();
    if (!body) return;
    onSendMessage(peer, body, "me");
    setText("");

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
            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[78%] rounded-2xl px-3.5 py-2.5"
                  style={mine ? { backgroundColor: GREEN, color: "#fff" } : { backgroundColor: "var(--card)", color: "var(--foreground)" }}
                >
                  <p className="text-[14px] leading-5">{message.text}</p>
                  <p className={`mt-1 text-right text-[10px] ${mine ? "text-white/70" : "text-muted-foreground"}`}>{formatChatTime(message.createdAt)}</p>
                </div>
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
                className="flex-shrink-0 rounded-full bg-muted px-3.5 py-2 text-[13px] font-medium text-foreground active:opacity-85"
              >
                {message}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-input px-3 py-2">
          <img src={UNSPLASH.userAvatar} alt="" className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") send(text);
            }}
            placeholder="Сообщение"
            className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => send(text)}
            disabled={!text.trim()}
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
