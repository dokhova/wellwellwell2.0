import { useEffect, useSyncExternalStore } from "react";
import { awardCoinsRemote, fetchCoinStateRemote, redeemRewardRemote } from "@/app/lib/api/coins";
import { track } from "@/app/lib/analytics";

export type CoinAction = "plan_created" | "friend_invited" | "plan_joined" | "comment_added" | "message_sent";
export type RewardKind = "code" | "booking" | "pickup";
export type Reward = { id: string; title: string; sub: string; cost: number; kind: RewardKind; gradient: [string, string] };
export type ClaimedReward = { rewardId: string; title: string; code: string; kind: RewardKind; claimedAt: string; pending?: boolean };
export type CoinLedgerEntry = { action: CoinAction | "reward_redeemed"; amount: number; dedupeKey: string; createdAt: number; pending?: boolean };
export type CoinState = { balance: number; ledger: CoinLedgerEntry[]; claimed: ClaimedReward[] };

export const COIN_REWARDS: Record<CoinAction, number> = {
  plan_created: 100,
  friend_invited: 150,
  plan_joined: 30,
  comment_added: 20,
  message_sent: 10,
};

export const COIN_ACTION_LABELS: Record<CoinAction, string> = {
  plan_created: "Создать план",
  friend_invited: "Пригласить друга",
  plan_joined: "Присоединиться к плану",
  comment_added: "Оставить комментарий",
  message_sent: "Отправить сообщение",
};

export const REWARDS: Reward[] = [
  { id: "shu", title: "Скидка 15% SHU", sub: "Промокод участника", cost: 500, kind: "code", gradient: ["#33383E", "#0E1114"] },
  { id: "slot", title: "Слот на забег", sub: "Бесплатное участие", cost: 800, kind: "booking", gradient: ["#0E7A6F", "#053B38"] },
  { id: "tee", title: "Футболка WWW", sub: "Забрать на пробежке", cost: 1500, kind: "pickup", gradient: ["#1B6C97", "#0A2636"] },
  { id: "bottle", title: "Бутылка WWW", sub: "Забрать на пробежке", cost: 2000, kind: "pickup", gradient: ["#0E8B7E", "#04302C"] },
  { id: "marathon", title: "Слот на марафон", sub: "Городской старт", cost: 6000, kind: "booking", gradient: ["#A0721F", "#3D2A0A"] },
];

const STATE_STORAGE_KEY = "www_coins_state_v2";
const stateByUser = new Map<string, CoinState>();
const listeners = new Set<() => void>();
const hydratingUsers = new Set<string>();
const redeeming = new Set<string>();
const EMPTY_STATE: CoinState = { balance: 0, ledger: [], claimed: [] };

const readStoredStates = (): Record<string, CoinState> => {
  try {
    const raw = typeof window === "undefined" ? null : window.localStorage.getItem(STATE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) as Record<string, CoinState> : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch { return {}; }
};

const getState = (userId: string): CoinState => {
  const cached = stateByUser.get(userId);
  if (cached) return cached;
  const stored = readStoredStates()[userId];
  const state = stored && typeof stored.balance === "number" && Array.isArray(stored.ledger) && Array.isArray(stored.claimed) ? stored : EMPTY_STATE;
  stateByUser.set(userId, state);
  return state;
};

const setState = (userId: string, state: CoinState) => {
  stateByUser.set(userId, state);
  try {
    const stored = readStoredStates();
    window.localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify({ ...stored, [userId]: state }));
  } catch (error) { console.error("Coin cache write failed", error); }
  listeners.forEach((listener) => listener());
};

const hydrate = async (userId: string) => {
  if (!userId || hydratingUsers.has(userId)) return;
  hydratingUsers.add(userId);
  try {
    const cached = getState(userId);
    for (const entry of cached.ledger.filter((item) => item.pending && item.action !== "reward_redeemed")) {
      await awardCoinsRemote(userId, entry.action, entry.dedupeKey);
    }
    for (const reward of cached.claimed.filter((item) => item.pending)) {
      await redeemRewardRemote({ userId, rewardId: reward.rewardId, code: reward.code });
    }
    const remote = await fetchCoinStateRemote(userId);
    if (!remote) return;
    const ledger: CoinLedgerEntry[] = remote.transactions.map((entry) => ({
      action: entry.action as CoinLedgerEntry["action"], amount: entry.amount, dedupeKey: entry.dedupe_key, createdAt: new Date(entry.created_at).getTime(),
    }));
    setState(userId, {
      balance: ledger.reduce((sum, entry) => sum + entry.amount, 0),
      ledger,
      claimed: remote.claimed.map((reward) => ({ rewardId: reward.reward_id, title: reward.title, code: reward.code, kind: reward.kind, claimedAt: reward.claimed_at })),
    });
  } catch (error) { console.warn("Supabase coins hydrate failed; using cached state", error); }
  finally { hydratingUsers.delete(userId); }
};

export const subscribe = (cb: () => void) => { listeners.add(cb); return () => listeners.delete(cb); };
export const getBalance = (userId: string) => getState(userId).balance;
export const getCoinState = (userId: string) => getState(userId);

export const awardCoins = async (userId: string, action: CoinAction, dedupeKey: string): Promise<number> => {
  if (!userId || !dedupeKey) return getBalance(userId);
  const state = getState(userId);
  if (state.ledger.some((entry) => entry.action === action && entry.dedupeKey === dedupeKey)) return state.balance;
  const amount = COIN_REWARDS[action];
  try {
    const remoteBalance = await awardCoinsRemote(userId, action, dedupeKey);
    if (remoteBalance !== null) {
      setState(userId, { ...state, balance: remoteBalance, ledger: [...state.ledger, { action, amount, dedupeKey, createdAt: Date.now() }] });
      await hydrate(userId);
      track("coins_awarded", { action, amount });
      return remoteBalance;
    }
  } catch (error) { console.warn("Supabase coin award failed; caching pending award", error); }
  const latest = getState(userId);
  if (latest.ledger.some((entry) => entry.action === action && entry.dedupeKey === dedupeKey)) return latest.balance;
  setState(userId, { ...latest, balance: latest.balance + amount, ledger: [...latest.ledger, { action, amount, dedupeKey, createdAt: Date.now(), pending: true }] });
  track("coins_awarded", { action, amount });
  return latest.balance + amount;
};

const makeVoucherCode = () => {
  const part = () => Math.random().toString(36).slice(2, 5).toUpperCase().padEnd(3, "X");
  return `WWW-${part()}-${part()}${Math.floor(Math.random() * 10)}`;
};

export const redeem = async (userId: string, reward: Reward): Promise<ClaimedReward> => {
  const lockKey = `${userId}:${reward.id}`;
  if (redeeming.has(lockKey)) throw new Error("already_redeeming");
  const current = getState(userId);
  const existing = current.claimed.find((item) => item.rewardId === reward.id);
  if (existing) return existing;
  if (current.balance < reward.cost) throw new Error("insufficient_balance");
  redeeming.add(lockKey);
  const code = makeVoucherCode();
  try {
    let remote: Awaited<ReturnType<typeof redeemRewardRemote>> = null;
    try {
      remote = await redeemRewardRemote({ userId, rewardId: reward.id, code });
    } catch (error) { console.warn("Supabase reward redeem failed; caching pending reward", error); }
    const claimed = { rewardId: reward.id, title: reward.title, code: remote?.code ?? code, kind: reward.kind, claimedAt: remote?.claimed_at ?? new Date().toISOString(), pending: remote ? undefined : true };
    const latest = getState(userId);
    setState(userId, {
      balance: remote?.balance ?? latest.balance - reward.cost,
      claimed: [claimed, ...latest.claimed.filter((item) => item.rewardId !== reward.id)],
      ledger: [...latest.ledger.filter((entry) => !(entry.action === "reward_redeemed" && entry.dedupeKey === reward.id)), { action: "reward_redeemed", amount: -reward.cost, dedupeKey: reward.id, createdAt: Date.now(), pending: remote ? undefined : true }],
    });
    if (remote) await hydrate(userId);
    return claimed;
  } finally { redeeming.delete(lockKey); }
};

export const useCoinState = (userId: string) => {
  const state = useSyncExternalStore(subscribe, () => getState(userId), () => EMPTY_STATE);
  useEffect(() => { void hydrate(userId); }, [userId]);
  return state;
};
export const useCoinBalance = (userId: string): number => useCoinState(userId).balance;
