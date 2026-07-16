import type { HomeFeedPlan } from "@/app/types";
import { getNearestWeekdayDate, toLocalIsoDate } from "@/app/lib/schedule";

export const PLAN_START_DATE = new Date();
PLAN_START_DATE.setHours(0, 0, 0, 0);
export const PAST_DAYS = 30;

export const getDateKey = (date: Date) => toLocalIsoDate(date);

export const calendarDays = Array.from({ length: 31 }, (_, index) => {
  const date = new Date(PLAN_START_DATE);
  date.setDate(PLAN_START_DATE.getDate() + index);
  const jsDay = date.getDay();

  return {
    date,
    dateKey: getDateKey(date),
    dayIndex: index,
    dayNumber: date.getDate(),
    monthName: date.toLocaleDateString("ru-RU", { month: "long" }),
    weekday: jsDay === 0 ? 7 : jsDay,
  };
});

export const pastCalendarDays = Array.from({ length: PAST_DAYS }, (_, index) => {
  const dayIndex = index - PAST_DAYS;
  const date = new Date(PLAN_START_DATE);
  date.setDate(PLAN_START_DATE.getDate() + dayIndex);
  const jsDay = date.getDay();

  return {
    date,
    dateKey: getDateKey(date),
    dayIndex,
    dayNumber: date.getDate(),
    monthName: date.toLocaleDateString("ru-RU", { month: "long" }),
    weekday: jsDay === 0 ? 7 : jsDay,
  };
});

const getScheduleStartKey = (start?: string) => {
  if (!start) return null;
  const date = new Date(start);
  return Number.isNaN(date.getTime()) ? null : getDateKey(date);
};

const getScheduleEndKey = (plan: HomeFeedPlan, startKey: string | null) => {
  if (plan.schedule.repeat?.type === "days" && plan.schedule.start) {
    const startDate = new Date(plan.schedule.start);
    if (Number.isNaN(startDate.getTime())) return null;
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + Math.max(1, plan.schedule.repeat.days) - 1);
    return getDateKey(endDate);
  }
  if (typeof plan.schedule.end === "string") return getScheduleStartKey(plan.schedule.end);
  return plan.schedule.repeat?.type === "none" ? startKey : null;
};

export const getPlanWeekItems = (plans: HomeFeedPlan[]) => {
  const sourceOrder = new Map(plans.map((plan, index) => [plan.id, index]));
  const partOfDayOrder: Record<string, number> = { morning: 0, day: 1, noon: 1, evening: 2 };

  return plans
    .flatMap((plan) => {
      const startKey = getScheduleStartKey(plan.schedule.start);
      const endKey = getScheduleEndKey(plan, startKey);
      if (plan.schedule.repeat?.type === "none") {
        if (plan.schedule.weekdays.length > 1) {
          const matchingDays = calendarDays.filter((day) =>
            plan.schedule.weekdays.includes(day.weekday)
            && (!startKey || day.dateKey >= startKey)
            && (!endKey || day.dateKey <= endKey)
          );
          return matchingDays.map((day) => ({
            plan,
            date: day.date,
            dateKey: day.dateKey,
            dayIndex: day.dayIndex,
            dayNumber: day.dayNumber,
            monthName: day.monthName,
            sortKey: day.dayIndex,
            progressKey: `${day.dateKey}:${plan.id}`,
          }));
        }
        const occurrenceKey = startKey ?? getDateKey(getNearestWeekdayDate(plan.schedule.weekdays, PLAN_START_DATE));
        const day = calendarDays.find((item) => item.dateKey === occurrenceKey);
        return day ? [{
          plan,
          date: day.date,
          dateKey: day.dateKey,
          dayIndex: day.dayIndex,
          dayNumber: day.dayNumber,
          monthName: day.monthName,
          sortKey: day.dayIndex,
          progressKey: `${day.dateKey}:${plan.id}`,
        }] : [];
      }

      const startDay = startKey ? calendarDays.find((day) => day.dateKey === startKey) : null;
      const weekdays = plan.schedule.weekdays.length
        ? plan.schedule.weekdays
        : plan.schedule.repeat?.type === "days" && startKey
          ? []
          : [startDay?.weekday ?? calendarDays[0].weekday];
      const matchingDays = calendarDays.filter((day) =>
        (weekdays.length === 0 || weekdays.includes(day.weekday))
        && (!startKey || day.dateKey >= startKey)
        && (!endKey || day.dateKey <= endKey)
      );

      return matchingDays.map((day) => ({
        plan,
        date: day.date,
        dateKey: day.dateKey,
        dayIndex: day.dayIndex,
        dayNumber: day.dayNumber,
        monthName: day.monthName,
        sortKey: day.dayIndex,
        progressKey: `${day.dateKey}:${plan.id}`,
      }));
    })
    .sort((a, b) => {
      const aTime = a.plan.schedule.partOfDay ? partOfDayOrder[a.plan.schedule.partOfDay] ?? 3 : 3;
      const bTime = b.plan.schedule.partOfDay ? partOfDayOrder[b.plan.schedule.partOfDay] ?? 3 : 3;
      const aExactTime = a.plan.schedule.time ?? "";
      const bExactTime = b.plan.schedule.time ?? "";

      return a.sortKey - b.sortKey
        || aTime - bTime
        || aExactTime.localeCompare(bExactTime)
        || (sourceOrder.get(a.plan.id) ?? 0) - (sourceOrder.get(b.plan.id) ?? 0);
    });
};

export const getPlanPastItems = (plans: HomeFeedPlan[]) => {
  const sourceOrder = new Map(plans.map((plan, index) => [plan.id, index]));
  const partOfDayOrder: Record<string, number> = { morning: 0, day: 1, noon: 1, evening: 2 };

  return plans
    .flatMap((plan) => {
      const startKey = getScheduleStartKey(plan.schedule.start);
      const endKey = getScheduleEndKey(plan, startKey);
      if (plan.schedule.repeat?.type === "none") {
        if (plan.schedule.weekdays.length > 1) {
          const matchingDays = pastCalendarDays.filter((day) =>
            plan.schedule.weekdays.includes(day.weekday)
            && (!startKey || day.dateKey >= startKey)
            && (!endKey || day.dateKey <= endKey)
          );
          return matchingDays.map((day) => ({
            plan,
            date: day.date,
            dateKey: day.dateKey,
            dayIndex: day.dayIndex,
            dayNumber: day.dayNumber,
            monthName: day.monthName,
            sortKey: day.dayIndex,
            progressKey: `${day.dateKey}:${plan.id}`,
          }));
        }
        const occurrenceKey = startKey ?? getDateKey(getNearestWeekdayDate(plan.schedule.weekdays, PLAN_START_DATE));
        const day = pastCalendarDays.find((item) => item.dateKey === occurrenceKey);
        return day ? [{
          plan,
          date: day.date,
          dateKey: day.dateKey,
          dayIndex: day.dayIndex,
          dayNumber: day.dayNumber,
          monthName: day.monthName,
          sortKey: day.dayIndex,
          progressKey: `${day.dateKey}:${plan.id}`,
        }] : [];
      }

      const startDay = startKey ? pastCalendarDays.find((day) => day.dateKey === startKey) : null;
      const weekdays = plan.schedule.weekdays.length
        ? plan.schedule.weekdays
        : plan.schedule.repeat?.type === "days" && startKey
          ? []
          : [startDay?.weekday ?? pastCalendarDays[0].weekday];
      const matchingDays = pastCalendarDays.filter((day) =>
        (weekdays.length === 0 || weekdays.includes(day.weekday))
        && (!startKey || day.dateKey >= startKey)
        && (!endKey || day.dateKey <= endKey)
      );

      return matchingDays.map((day) => ({
        plan,
        date: day.date,
        dateKey: day.dateKey,
        dayIndex: day.dayIndex,
        dayNumber: day.dayNumber,
        monthName: day.monthName,
        sortKey: day.dayIndex,
        progressKey: `${day.dateKey}:${plan.id}`,
      }));
    })
    .sort((a, b) => {
      const aTime = a.plan.schedule.partOfDay ? partOfDayOrder[a.plan.schedule.partOfDay] ?? 3 : 3;
      const bTime = b.plan.schedule.partOfDay ? partOfDayOrder[b.plan.schedule.partOfDay] ?? 3 : 3;
      const aExactTime = a.plan.schedule.time ?? "";
      const bExactTime = b.plan.schedule.time ?? "";

      return b.sortKey - a.sortKey
        || aTime - bTime
        || aExactTime.localeCompare(bExactTime)
        || (sourceOrder.get(a.plan.id) ?? 0) - (sourceOrder.get(b.plan.id) ?? 0);
    });
};
