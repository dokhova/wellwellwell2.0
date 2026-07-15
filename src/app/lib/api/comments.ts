import { supabase } from "@/app/lib/supabase";

export type CommentRow = {
  id: string;
  plan_id: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  text: string;
  mentioned_user_ids: string[] | null;
  photo_url: string | null;
  parent_id: string | null;
  created_at: string;
};

export type CommentLikeRow = { comment_id: string; user_id: string; created_at: string };

export type AddCommentInput = {
  planId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  text: string;
  mentionedUserIds?: string[];
  photoUrl?: string | null;
  parentId?: string | null;
};

type SupabaseSchemaError = { code?: string; message?: string } | null;

const isMissingSchemaObject = (error: SupabaseSchemaError, objectName: string) => {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? "";
  return ["42703", "42P01", "PGRST204", "PGRST205"].includes(error.code ?? "")
    || (message.includes(objectName.toLowerCase()) && (message.includes("does not exist") || message.includes("schema cache")));
};

const LEGACY_COMMENT_SELECT = "id, plan_id, author_id, author_name, author_avatar_url, text, mentioned_user_ids, photo_url, created_at";
const COMMENT_SELECT = `${LEGACY_COMMENT_SELECT}, parent_id`;

export const fetchComments = async (planId: string): Promise<CommentRow[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("comments")
    .select(COMMENT_SELECT)
    .eq("plan_id", planId)
    .order("created_at", { ascending: true })
    .returns<CommentRow[]>();

  if (error && isMissingSchemaObject(error, "parent_id")) {
    const { data: legacyData, error: legacyError } = await supabase
      .from("comments")
      .select(LEGACY_COMMENT_SELECT)
      .eq("plan_id", planId)
      .order("created_at", { ascending: true });
    if (legacyError) throw legacyError;
    return (legacyData ?? []).map((row) => ({ ...row, parent_id: null })) as CommentRow[];
  }
  if (error) throw error;
  return data ?? [];
};

export const addComment = async (input: AddCommentInput): Promise<CommentRow | null> => {
  if (!supabase) return null;

  const payload = {
    plan_id: input.planId,
    author_id: input.authorId,
    author_name: input.authorName,
    author_avatar_url: input.authorAvatarUrl,
    text: input.text,
    mentioned_user_ids: input.mentionedUserIds ?? [],
    photo_url: input.photoUrl ?? null,
    parent_id: input.parentId ?? null,
  };
  const { data, error } = await supabase
    .from("comments")
    .insert(payload)
    .select(COMMENT_SELECT)
    .single<CommentRow>();

  if (error && !input.parentId && isMissingSchemaObject(error, "parent_id")) {
    const { parent_id: _parentId, ...legacyPayload } = payload;
    const { data: legacyData, error: legacyError } = await supabase
      .from("comments")
      .insert(legacyPayload)
      .select(LEGACY_COMMENT_SELECT)
      .single();
    if (legacyError) throw legacyError;
    return legacyData ? { ...legacyData, parent_id: null } as CommentRow : null;
  }
  if (error) throw error;
  return data;
};

export const fetchCommentLikes = async (planId: string): Promise<CommentLikeRow[]> => {
  if (!supabase) return [];
  const { data: comments, error: commentsError } = await supabase.from("comments").select("id").eq("plan_id", planId).returns<Array<{ id: string }>>();
  if (commentsError) throw commentsError;
  const ids = (comments ?? []).map((comment) => comment.id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("comment_likes").select("comment_id, user_id, created_at").in("comment_id", ids).returns<CommentLikeRow[]>();
  if (error && isMissingSchemaObject(error, "comment_likes")) return [];
  if (error) throw error;
  return data ?? [];
};

export const likeComment = async (commentId: string, userId: string) => {
  if (!supabase) return;
  const { error } = await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: userId });
  if (error) {
    console.error("Supabase comment_likes insert failed", error);
    throw error;
  }
};

export const unlikeComment = async (commentId: string, userId: string) => {
  if (!supabase) return;
  const { error } = await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", userId);
  if (error) throw error;
};

export const deleteComment = async (id: string) => {
  if (!supabase) return;

  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw error;
};

export const deleteCommentsByAuthor = async (authorId: string) => {
  if (!supabase) return;

  const { error } = await supabase.from("comments").delete().eq("author_id", authorId);
  if (error) throw error;
};
