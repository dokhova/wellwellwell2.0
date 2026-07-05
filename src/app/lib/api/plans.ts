import type { HomeFeedPlan } from "@/app/types";
import { supabase } from "@/app/lib/supabase";

type PlanRow = {
  id: string;
  author_id: string;
  title: string;
  description: string;
  cover_url: string | null;
  starts_at: string | null;
  payload: HomeFeedPlan | null;
  hidden: boolean | null;
  created_at: string;
};

export type PlanParticipantRow = {
  plan_id: string;
  user_id: string;
  status: "invited" | "joined" | "declined";
};

const getStartsAt = (plan: HomeFeedPlan) => {
  if (plan.schedule.start) return new Date(plan.schedule.start).toISOString();
  return null;
};

const mapPlanRows = (rows: PlanRow[] | null): HomeFeedPlan[] =>
  (rows ?? []).map((row) => row.payload ? { ...row.payload, id: row.id, hidden: row.hidden ?? false } : null).filter((plan): plan is HomeFeedPlan => Boolean(plan));

export const createPlanRemote = async (plan: HomeFeedPlan): Promise<HomeFeedPlan | null> => {
  if (!supabase) return null;

  const id = crypto.randomUUID();
  const remotePlan: HomeFeedPlan = {
    ...plan,
    id,
    shareUrl: `https://wellwellwell.app/plans/${id}`,
  };

  const { error } = await supabase.from("plans").insert({
    id,
    author_id: plan.author.id ?? "",
    title: plan.title,
    description: plan.description,
    cover_url: plan.coverUrl ?? null,
    starts_at: getStartsAt(plan),
    payload: remotePlan,
    hidden: false,
  });

  if (error) throw error;
  return remotePlan;
};

export const updatePlanRemote = async (plan: HomeFeedPlan): Promise<HomeFeedPlan | null> => {
  if (!supabase) return null;

  const { error } = await supabase
    .from("plans")
    .update({
      title: plan.title,
      description: plan.description,
      cover_url: plan.coverUrl ?? null,
      starts_at: getStartsAt(plan),
      payload: plan,
    })
    .eq("id", String(plan.id));

  if (error) throw error;
  return plan;
};

export const fetchPublicPlans = async (): Promise<HomeFeedPlan[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("plans")
    .select("id, author_id, title, description, cover_url, starts_at, payload, hidden, created_at")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<PlanRow[]>();

  if (error) throw error;
  return mapPlanRows(data);
};

export const fetchPlan = async (planId: string): Promise<HomeFeedPlan | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("plans")
    .select("id, author_id, title, description, cover_url, starts_at, payload, hidden, created_at")
    .eq("id", planId)
    .maybeSingle<PlanRow>();

  if (error) throw error;
  return data?.payload ? { ...data.payload, id: data.id, hidden: data.hidden ?? false } : null;
};

export const fetchPlansByAuthor = async (authorId: string): Promise<HomeFeedPlan[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("plans")
    .select("id, author_id, title, description, cover_url, starts_at, payload, hidden, created_at")
    .eq("author_id", authorId)
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .returns<PlanRow[]>();

  if (error) throw error;
  return mapPlanRows(data);
};

export const fetchParticipants = async (planId: string): Promise<PlanParticipantRow[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("plan_participants")
    .select("plan_id, user_id, status")
    .eq("plan_id", planId)
    .returns<PlanParticipantRow[]>();

  if (error) throw error;
  return data ?? [];
};

export const countJoined = async (planId: string): Promise<number> => {
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("plan_participants")
    .select("plan_id", { count: "exact", head: true })
    .eq("plan_id", planId)
    .eq("status", "joined");

  if (error) throw error;
  return count ?? 0;
};

export const upsertPlanParticipant = async (planId: string, userId: string, status: PlanParticipantRow["status"]) => {
  if (!supabase) return;

  const { error } = await supabase
    .from("plan_participants")
    .upsert({ plan_id: planId, user_id: userId, status }, { onConflict: "plan_id,user_id" });

  if (error) throw error;
};

export const deletePlanParticipant = async (planId: string, userId: string) => {
  if (!supabase) return;

  const { error } = await supabase
    .from("plan_participants")
    .delete()
    .eq("plan_id", planId)
    .eq("user_id", userId);

  if (error) throw error;
};

export const deletePlanRemote = async (planId: string) => {
  if (!supabase) return;

  const { error: participantsError } = await supabase
    .from("plan_participants")
    .delete()
    .eq("plan_id", planId);

  if (participantsError) throw participantsError;

  const { error } = await supabase
    .from("plans")
    .delete()
    .eq("id", planId);

  if (error) throw error;
};

export const setPlanHidden = async (planId: string, hidden: boolean) => {
  if (!supabase) return;

  const { error } = await supabase
    .from("plans")
    .update({ hidden })
    .eq("id", planId);

  if (error) throw error;
};

export const subscribeToPlanParticipants = (planId: string, onChange: () => void) => {
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`plan-participants:${planId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "plan_participants", filter: `plan_id=eq.${planId}` },
      () => onChange()
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
};
