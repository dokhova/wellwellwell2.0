import { supabase } from "@/app/lib/supabase";

export type BackendHealth =
  | { ok: true }
  | { ok: false; reason: string };

export const checkBackendHealth = async (): Promise<BackendHealth> => {
  if (!supabase) {
    return {
      ok: false,
      reason: "Supabase env vars are missing: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    };
  }

  try {
    const { error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (error) {
      return { ok: false, reason: error.message };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
};
