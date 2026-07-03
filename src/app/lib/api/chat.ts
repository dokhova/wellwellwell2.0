import { supabase } from "@/app/lib/supabase";

export type MessageRow = {
  id: string;
  thread_id: string;
  sender_id: string;
  text: string;
  photo_url: string | null;
  created_at: string;
  read_at: string | null;
  kind: "text" | "invite" | null;
  plan_id: string | null;
  invite_status: "accepted" | "declined" | null;
};

export type SendMessageInput = {
  id: string;
  threadId: string;
  senderId: string;
  text: string;
  photoUrl?: string | null;
  kind?: "text" | "invite";
  planId?: string | null;
  inviteStatus?: "accepted" | "declined" | null;
};

export const makeThreadId = (a: string, b: string) => [a, b].sort((left, right) => left.localeCompare(right)).join("_");

export const fetchMessages = async (threadId: string): Promise<MessageRow[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("messages")
    .select("id, thread_id, sender_id, text, photo_url, created_at, read_at, kind, plan_id, invite_status")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .returns<MessageRow[]>();

  if (error) throw error;
  return data ?? [];
};

export const fetchUserThreadMessages = async (currentUserId: string): Promise<MessageRow[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("messages")
    .select("id, thread_id, sender_id, text, photo_url, created_at, read_at, kind, plan_id, invite_status")
    .or(`thread_id.like.${currentUserId}_%,thread_id.like.%_${currentUserId}`)
    .order("created_at", { ascending: false })
    .returns<MessageRow[]>();

  if (error) throw error;
  return data ?? [];
};

export const sendMessage = async (input: SendMessageInput): Promise<MessageRow | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("messages")
    .insert({
      id: input.id,
      thread_id: input.threadId,
      sender_id: input.senderId,
      text: input.text,
      photo_url: input.photoUrl ?? null,
      kind: input.kind ?? "text",
      plan_id: input.planId ?? null,
      invite_status: input.inviteStatus ?? null,
    })
    .select("id, thread_id, sender_id, text, photo_url, created_at, read_at, kind, plan_id, invite_status")
    .single<MessageRow>();

  if (error) throw error;
  return data;
};

export const updateInviteStatus = async (messageId: string, status: "accepted" | "declined"): Promise<MessageRow | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("messages")
    .update({ invite_status: status })
    .eq("id", messageId)
    .select("id, thread_id, sender_id, text, photo_url, created_at, read_at, kind, plan_id, invite_status")
    .single<MessageRow>();

  if (error) throw error;
  return data;
};

export const markThreadMessagesRead = async (threadId: string, currentUserId: string) => {
  if (!supabase) return;

  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("thread_id", threadId)
    .neq("sender_id", currentUserId)
    .is("read_at", null);

  if (error) throw error;
};

export const subscribeToThread = (
  threadId: string,
  onMessage: (message: MessageRow) => void,
  onMessageUpdate?: (message: MessageRow) => void,
) => {
  if (!supabase) return () => undefined;

  const channel = supabase
    .channel(`messages:${threadId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
      (payload) => {
        onMessage(payload.new as MessageRow);
      },
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
      (payload) => {
        onMessageUpdate?.(payload.new as MessageRow);
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
};

export const subscribeToUserMessages = (currentUserId: string, onMessage: (message: MessageRow) => void) => {
  if (!supabase) return () => undefined;

  const channel = supabase
    .channel(`messages:user:${currentUserId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      (payload) => {
        const message = payload.new as MessageRow;
        if (message.thread_id.startsWith(`${currentUserId}_`) || message.thread_id.endsWith(`_${currentUserId}`)) {
          onMessage(message);
        }
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
};
