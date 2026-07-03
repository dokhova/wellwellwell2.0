import { supabase } from "@/app/lib/supabase";

export type CommentRow = {
  id: string;
  plan_id: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  text: string;
  photo_url: string | null;
  created_at: string;
};

export type AddCommentInput = {
  planId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  text: string;
  photoUrl?: string | null;
};

export const fetchComments = async (planId: string): Promise<CommentRow[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("comments")
    .select("id, plan_id, author_id, author_name, author_avatar_url, text, photo_url, created_at")
    .eq("plan_id", planId)
    .order("created_at", { ascending: true })
    .returns<CommentRow[]>();

  if (error) throw error;
  return data ?? [];
};

export const addComment = async (input: AddCommentInput): Promise<CommentRow | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("comments")
    .insert({
      plan_id: input.planId,
      author_id: input.authorId,
      author_name: input.authorName,
      author_avatar_url: input.authorAvatarUrl,
      text: input.text,
      photo_url: input.photoUrl ?? null,
    })
    .select("id, plan_id, author_id, author_name, author_avatar_url, text, photo_url, created_at")
    .single<CommentRow>();

  if (error) throw error;
  return data;
};
