import { expertProfile, type ExpertProfile } from "@/app/data/profile";
import { sanitizeImageUrl } from "@/app/lib/api/storage";
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

const sanitizePhotoUrls = (urls: string[] | null | undefined) =>
  (urls ?? []).map(sanitizeImageUrl).filter((url): url is string => Boolean(url));

const mapProfileToRow = (profile: ExpertProfile) => {
  const photoUrls = sanitizePhotoUrls(profile.photoUrls);
  const photoUrl = sanitizeImageUrl(profile.photoUrl) ?? photoUrls[0] ?? null;

  return {
    id: profile.id,
    telegram_id: profile.telegramId,
    username: profile.username ?? null,
    name: profile.name,
    bio: profile.bio,
    photo_url: photoUrl,
    photo_urls: photoUrls,
    updated_at: new Date().toISOString(),
  };
};

export const mapRowToProfile = (row: ProfileRow): ExpertProfile => {
  const photoUrl = sanitizeImageUrl(row.photo_url);
  const photoUrls = sanitizePhotoUrls(row.photo_urls);

  const profile: ExpertProfile = {
    ...expertProfile,
    id: row.id,
    telegramId: row.telegram_id ?? Number(row.id),
    username: row.username ?? undefined,
    name: row.name || expertProfile.name,
    bio: row.bio ?? "",
    photoUrl,
    photoUrls: photoUrls.length ? photoUrls : photoUrl ? [photoUrl] : [],
    plansCount: 0,
    followersCount: 0,
    followingCount: 0,
    isMe: true,
    isFollowedByMe: false,
  };
  delete profile.cannedReplies;
  return profile;
};

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

export const searchProfiles = async (query: string): Promise<ExpertProfile[]> => {
  if (!supabase) return [];

  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  const escapedQuery = normalizedQuery.replaceAll("%", "\\%").replaceAll("_", "\\_").replaceAll(",", " ");
  const pattern = `%${escapedQuery}%`;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, telegram_id, username, name, bio, photo_url, photo_urls")
    .or(`name.ilike.${pattern},username.ilike.${pattern}`)
    .limit(20)
    .returns<ProfileRow[]>();

  if (error) throw error;
  return (data ?? []).map(mapRowToProfile);
};
