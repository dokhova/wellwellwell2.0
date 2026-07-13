import { supabase } from "@/app/lib/supabase";

type PlanProgressRow = {
  progress_key: string;
  checked: boolean;
};

export const fetchPlanProgressKeys = async (userId: string): Promise<string[]> => {
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from("plan_progress")
    .select("progress_key, checked")
    .eq("user_id", userId)
    .eq("checked", true)
    .returns<PlanProgressRow[]>();

  if (error) throw error;
  return (data ?? []).map((row) => row.progress_key);
};

export const upsertPlanProgress = async (userId: string, progressKey: string, checked: boolean) => {
  if (!supabase || !userId) return;

  const { error } = await supabase
    .from("plan_progress")
    .upsert({
      user_id: userId,
      progress_key: progressKey,
      checked,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,progress_key" });

  if (error) throw error;
};

export const deleteUserPlanProgress = async (userId: string) => {
  if (!supabase || !userId) return;

  const { error } = await supabase
    .from("plan_progress")
    .delete()
    .eq("user_id", userId);

  if (error) throw error;
};
