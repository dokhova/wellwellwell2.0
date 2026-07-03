import { supabase } from "@/app/lib/supabase";

export type MessageRow = {
  id: string;
  thread_id: string;
  sender_id: string;
  text: string;
  photo_url: string | null;
  created_at: string;
};

export type SendMessageInput = {
  threadId: string;
  senderId: string;
  text: string;
  photoUrl?: string | null;
};

export const makeThreadId = (a: string, b: string) => [a, b].sort((left, right) => left.localeCompare(right)).join("_");

export const fetchMessages = async (threadId: string): Promise<MessageRow[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("messages")
    .select("id, thread_id, sender_id, text, photo_url, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .returns<MessageRow[]>();

  if (error) throw error;
  return data ?? [];
};

export const sendMessage = async (input: SendMessageInput): Promise<MessageRow | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("messages")
    .insert({
      thread_id: input.threadId,
      sender_id: input.senderId,
      text: input.text,
      photo_url: input.photoUrl ?? null,
    })
    .select("id, thread_id, sender_id, text, photo_url, created_at")
    .single<MessageRow>();

  if (error) throw error;
  return data;
};

export const subscribeToThread = (threadId: string, onMessage: (message: MessageRow) => void) => {
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
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
};
