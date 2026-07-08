import { supabase } from "@/app/lib/supabase";

type FollowRow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};

export const follow = async (followerId: string, followingId: string) => {
  if (!supabase) return;

  const { error } = await supabase
    .from("follows")
    .upsert({ follower_id: followerId, following_id: followingId }, { onConflict: "follower_id,following_id" });

  if (error) throw error;
};

export const unfollow = async (followerId: string, followingId: string) => {
  if (!supabase) return;

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);

  if (error) throw error;
};

export const fetchFollowing = async (userId: string): Promise<string[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("follows")
    .select("follower_id, following_id, created_at")
    .eq("follower_id", userId)
    .returns<FollowRow[]>();

  if (error) throw error;
  return (data ?? []).map((row) => row.following_id);
};

export const fetchFollowers = async (userId: string): Promise<string[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("follows")
    .select("follower_id, following_id, created_at")
    .eq("following_id", userId)
    .returns<FollowRow[]>();

  if (error) throw error;
  return (data ?? []).map((row) => row.follower_id);
};

export const deleteUserFollows = async (userId: string) => {
  if (!supabase) return;

  const { error } = await supabase
    .from("follows")
    .delete()
    .or(`follower_id.eq.${userId},following_id.eq.${userId}`);

  if (error) throw error;
};
