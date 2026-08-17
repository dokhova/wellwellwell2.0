import { useSyncExternalStore } from "react";
import { track } from "@/app/lib/analytics";

export type CoinAction =
  | "plan_created"
  | "plan_shared"
  | "plan_joined"
  | "comment_sent"
  | "comment_liked"
  | "user_followed";

export const COIN_REWARDS: Record<CoinAction, number> = {
  plan_created: 10,
  plan_shared: 15,
  plan_joined: 5,
  comment_sent: 3,
  comment_liked: 2,
  user_followed: 3,
};

export const COIN_ACTION_LABELS: Record<CoinAction, string> = {
  plan_created: "Создал план",
  plan_shared: "Поделился планом",
  plan_joined: "Присоединился к плану",
  comment_sent: "Оставил комментарий",
  comment_liked: "Лайкнул комментарий",
  user_followed: "Подписался на человека",
};

export type CoinLedgerEntry = {
  action: CoinAction;
  amount: number;
  dedupeKey: string;
  createdAt: number;
};

const BALANCE_STORAGE_KEY = "www_coins_balance_v1";
const LEDGER_STORAGE_KEY = "www_coins_ledger_v1";
const AWARDED_STORAGE_KEY = "www_coins_awarded_v1";

const listeners = new Set<() => void>();

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  try {
    if (typeof window === "undefined") return false;
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`localStorage write failed for ${key}`, error);
    return false;
  }
};

const readRecord = <T,>(key: string): Record<string, T> => {
  const value = readJson<unknown>(key, {});
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, T> : {};
};

export const getBalance = (userId: string): number => {
  const balances = readRecord<number>(BALANCE_STORAGE_KEY);
  const balance = balances[userId];
  return typeof balance === "number" && Number.isFinite(balance) ? balance : 0;
};

export const getLedger = (userId: string): CoinLedgerEntry[] => {
  const ledgers = readRecord<CoinLedgerEntry[]>(LEDGER_STORAGE_KEY);
  return Array.isArray(ledgers[userId]) ? ledgers[userId] : [];
};

export const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const awardCoins = (userId: string, action: CoinAction, dedupeKey: string): number => {
  const fullKey = `${userId}:${action}:${dedupeKey}`;
  const storedAwardedKeys = readJson<unknown>(AWARDED_STORAGE_KEY, []);
  const awardedKeys = Array.isArray(storedAwardedKeys) ? storedAwardedKeys.filter((key): key is string => typeof key === "string") : [];
  if (awardedKeys.includes(fullKey)) return getBalance(userId);

  const amount = COIN_REWARDS[action];
  const balances = readRecord<number>(BALANCE_STORAGE_KEY);
  const ledgers = readRecord<CoinLedgerEntry[]>(LEDGER_STORAGE_KEY);
  const currentBalance = typeof balances[userId] === "number" && Number.isFinite(balances[userId]) ? balances[userId] : 0;
  const nextBalance = currentBalance + amount;
  const entry: CoinLedgerEntry = { action, amount, dedupeKey, createdAt: Date.now() };

  const balanceWritten = writeJson(BALANCE_STORAGE_KEY, { ...balances, [userId]: nextBalance });
  const currentLedger = Array.isArray(ledgers[userId]) ? ledgers[userId] : [];
  const ledgerWritten = writeJson(LEDGER_STORAGE_KEY, { ...ledgers, [userId]: [...currentLedger, entry] });
  const awardedWritten = writeJson(AWARDED_STORAGE_KEY, [...awardedKeys, fullKey]);

  if (!balanceWritten || !ledgerWritten || !awardedWritten) return getBalance(userId);

  track("coins_awarded", { action, amount });
  listeners.forEach((listener) => listener());
  return nextBalance;
};

export const useCoinBalance = (userId: string): number => useSyncExternalStore(
  subscribe,
  () => getBalance(userId),
  () => 0,
);
