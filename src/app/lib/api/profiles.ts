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
  cover_urls: string[] | null;
};

const sanitizePhotoUrls = (urls: string[] | null | undefined) =>
  (urls ?? []).map(sanitizeImageUrl).filter((url): url is string => Boolean(url));

const mapProfileToRow = (profile: ExpertProfile) => {
  const photoUrls = sanitizePhotoUrls(profile.photoUrls);
  const photoUrl = sanitizeImageUrl(profile.photoUrl) ?? photoUrls[0] ?? null;
  const coverUrls = profile.coverUrls === null ? null : sanitizePhotoUrls(profile.coverUrls);

  return {
    id: profile.id,
    telegram_id: profile.telegramId,
    username: profile.username ?? null,
    name: profile.name,
    bio: profile.bio,
    photo_url: photoUrl,
    photo_urls: photoUrls,
    cover_urls: coverUrls,
    updated_at: new Date().toISOString(),
  };
};

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const getSupabaseUnavailableError = (operation: string) =>
  new Error(`Supabase is not configured; ${operation} cannot be completed. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.`);

export const mapRowToProfile = (row: ProfileRow): ExpertProfile => {
  const photoUrl = sanitizeImageUrl(row.photo_url);
  const photoUrls = sanitizePhotoUrls(row.photo_urls);
  const coverUrls = sanitizePhotoUrls(row.cover_urls);

  const profile: ExpertProfile = {
    ...expertProfile,
    id: row.id,
    telegramId: row.telegram_id ?? Number(row.id),
    username: row.username ?? undefined,
    name: row.name || expertProfile.name,
    bio: row.bio ?? "",
    photoUrl,
    photoUrls: photoUrls.length ? photoUrls : photoUrl ? [photoUrl] : [],
    coverUrls: row.cover_urls === null ? null : coverUrls,
    plansCount: 0,
    followersCount: 0,
    followingCount: 0,
    isMe: true,
    isFollowedByMe: false,
  };
  delete profile.cannedReplies;
  delete profile.isDemo;
  delete profile.tags;
  return profile;
};

export const upsertProfile = async (profile: ExpertProfile) => {
  if (!supabase) {
    const error = getSupabaseUnavailableError("profile upsert");
    console.error("Supabase profile upsert failed:", error.message);
    throw error;
  }

  const row = mapProfileToRow(profile);
  const upsertOnce = async () => {
    const { error } = await supabase.from("profiles").upsert(row);
    if (error) throw error;
  };

  try {
    await upsertOnce();
  } catch (error) {
    console.error("Supabase profile upsert failed; retrying once in 3s.", error);
    await wait(3000);
    await upsertOnce();
  }
};

export const acceptProfileTerms = async (profile: ExpertProfile, acceptedAt: string) => {
  if (!supabase) return;

  const row = {
    ...mapProfileToRow(profile),
    terms_accepted_at: acceptedAt,
  };
  const { error } = await supabase.from("profiles").upsert(row);
  if (error) throw error;
};

export const fetchProfile = async (id: string): Promise<ExpertProfile | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, telegram_id, username, name, bio, photo_url, photo_urls, cover_urls")
    .eq("id", id)
    .maybeSingle<ProfileRow>();

  if (error) throw error;
  return data ? mapRowToProfile(data) : null;
};

export const searchProfiles = async (query: string): Promise<ExpertProfile[]> => {
  if (!supabase) throw getSupabaseUnavailableError("profile search");

  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  const escapedQuery = normalizedQuery.replaceAll("%", "\\%").replaceAll("_", "\\_").replaceAll(",", " ");
  const pattern = `%${escapedQuery}%`;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, telegram_id, username, name, bio, photo_url, photo_urls, cover_urls")
    .or(`name.ilike.${pattern},username.ilike.${pattern}`)
    .limit(20)
    .returns<ProfileRow[]>();

  if (error) throw error;
  return (data ?? []).map(mapRowToProfile);
};

export const fetchRecentProfiles = async (): Promise<ExpertProfile[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, telegram_id, username, name, bio, photo_url, photo_urls, cover_urls")
    .order("updated_at", { ascending: false })
    .limit(20)
    .returns<ProfileRow[]>();

  if (error) throw error;
  return (data ?? []).map(mapRowToProfile);
};

export const fetchProfilesByIds = async (ids: string[]): Promise<ExpertProfile[]> => {
  if (!supabase || ids.length === 0) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, telegram_id, username, name, bio, photo_url, photo_urls, cover_urls")
    .in("id", ids)
    .returns<ProfileRow[]>();

  if (error) throw error;
  return (data ?? []).map(mapRowToProfile);
};

export const deleteProfile = async (id: string) => {
  if (!supabase) return;

  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) throw error;
};
