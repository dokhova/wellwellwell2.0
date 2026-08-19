import { supabase } from "@/app/lib/supabase";

export type CoinTransactionRow = {
  action: string;
  amount: number;
  dedupe_key: string;
  created_at: string;
};

export type ClaimedRewardRow = {
  reward_id: string;
  title: string;
  code: string;
  kind: "code" | "booking" | "pickup";
  claimed_at: string;
};

export const fetchCoinStateRemote = async (userId: string) => {
  if (!supabase) return null;
  const [transactionsResult, rewardsResult] = await Promise.all([
    supabase.from("coin_transactions").select("action, amount, dedupe_key, created_at").eq("user_id", userId).order("created_at", { ascending: true }).returns<CoinTransactionRow[]>(),
    supabase.from("claimed_rewards").select("reward_id, title, code, kind, claimed_at").eq("user_id", userId).order("claimed_at", { ascending: false }).returns<ClaimedRewardRow[]>(),
  ]);
  if (transactionsResult.error) throw transactionsResult.error;
  if (rewardsResult.error) throw rewardsResult.error;
  return { transactions: transactionsResult.data ?? [], claimed: rewardsResult.data ?? [] };
};

export const awardCoinsRemote = async (userId: string, action: string, dedupeKey: string) => {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("award_coins", { p_user_id: userId, p_action: action, p_dedupe_key: dedupeKey });
  if (error) throw error;
  return typeof data === "number" ? data : Number(data);
};

export const hasCoinAwardRemote = async (userId: string, action: string, dedupeKey: string) => {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("coin_transactions")
    .select("dedupe_key")
    .eq("user_id", userId)
    .eq("action", action)
    .eq("dedupe_key", dedupeKey)
    .maybeSingle<{ dedupe_key: string }>();
  if (error) throw error;
  return Boolean(data);
};

export const redeemRewardRemote = async ({ userId, rewardId, code }: {
  userId: string;
  rewardId: string;
  code: string;
}) => {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("redeem_reward", {
    p_user_id: userId, p_reward_id: rewardId, p_code: code,
  });
  if (error) throw error;
  return data as { balance: number; claimed_at: string; code: string };
};
