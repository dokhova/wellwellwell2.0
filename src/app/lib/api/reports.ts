import { supabase } from "@/app/lib/supabase";

export const addReport = async ({
  planId,
  reporterId,
}: {
  planId: string;
  reporterId: string;
}) => {
  if (!supabase) return;

  const { error } = await supabase
    .from("reports")
    .insert({
      plan_id: planId,
      reporter_id: reporterId,
    });

  if (error) throw error;
};
