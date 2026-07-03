import { expertProfile, type ExpertProfile } from "@/app/data/profile";
import { supabase } from "@/app/lib/supabase";

type ProfileRow = {
  id: string;
  telegram_id: number | null;
  username: string | null;
  name: string | null;
  bio: string | null;
  photo_url: string | null;
  photo_urls: string[] | null;
};

const mapProfileToRow = (profile: ExpertProfile) => ({
  id: profile.id,
  telegram_id: profile.telegramId,
  username: profile.username ?? null,
  name: profile.name,
  bio: profile.bio,
  photo_url: profile.photoUrl,
  photo_urls: profile.photoUrls,
  updated_at: new Date().toISOString(),
});

const mapRowToProfile = (row: ProfileRow): ExpertProfile => ({
  ...expertProfile,
  id: row.id,
  telegramId: row.telegram_id ?? Number(row.id),
  username: row.username ?? undefined,
  name: row.name || expertProfile.name,
  bio: row.bio ?? "",
  photoUrl: row.photo_url,
  photoUrls: Array.isArray(row.photo_urls) ? row.photo_urls : row.photo_url ? [row.photo_url] : [],
  plansCount: 0,
  followersCount: 0,
  followingCount: 0,
  isMe: true,
  isFollowedByMe: false,
});

export const upsertProfile = async (profile: ExpertProfile) => {
  if (!supabase) return;

  const { error } = await supabase.from("profiles").upsert(mapProfileToRow(profile));
  if (error) throw error;
};

export const fetchProfile = async (id: string): Promise<ExpertProfile | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, telegram_id, username, name, bio, photo_url, photo_urls")
    .eq("id", id)
    .maybeSingle<ProfileRow>();

  if (error) throw error;
  return data ? mapRowToProfile(data) : null;
};
