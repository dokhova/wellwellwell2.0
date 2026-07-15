import type { PlanRepeat, Schedule } from "@/app/types";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}/;

export const toIsoDate = (value?: string) => value?.match(ISO_DATE_PATTERN)?.[0];

const addCalendarDays = (start: string | undefined, days: number) => {
  const isoStart = toIsoDate(start);
  if (!isoStart) return undefined;
  const date = new Date(`${isoStart}T12:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const normalizePlanRepeat = (repeat: PlanRepeat | undefined, start?: string): PlanRepeat => {
  if (!repeat || repeat.type === "none") return { type: "none" };
  if (repeat.type === "weekly") {
    const until = toIsoDate(repeat.until);
    return until ? { type: "weekly", until } : { type: "weekly" };
  }
  if (repeat.type === "forever") return { type: "weekly" };
  const durationDays = repeat.type === "days"
    ? Math.max(1, repeat.days)
    : Math.max(1, repeat.week) * 7;
  const until = addCalendarDays(start, durationDays - 1);
  return until ? { type: "weekly", until } : { type: "weekly" };
};

export const normalizeSchedule = (schedule: Schedule): Schedule => ({
  ...schedule,
  repeat: normalizePlanRepeat(schedule.repeat, schedule.start),
  repeatUntilDate: undefined,
});

export const getRepeatUntil = (schedule: Schedule) => {
  const repeat = normalizePlanRepeat(schedule.repeat, schedule.start);
  return repeat.type === "weekly" ? repeat.until : undefined;
};

export const toLocalIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const isScheduleActiveOn = (schedule: Schedule, date: Date) => {
  const until = getRepeatUntil(schedule);
  if (!until) return true;
  return toLocalIsoDate(date) <= until;
};

export const isSchedulePastRepeatEnd = (schedule: Schedule, from: Date = new Date()) => {
  const until = getRepeatUntil(schedule);
  return Boolean(until && toLocalIsoDate(from) > until);
};
