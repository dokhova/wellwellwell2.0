import type { HomeFeedPlan } from "@/app/types";
import { weekDateMonths, weekDates } from "@/app/data/calendar";

export const PLAN_START_DATE = new Date("2026-07-01T00:00:00");

export const getDateKey = (date: Date) => date.toISOString().slice(0, 10);

export const calendarDays = weekDates.map((dayNumber, index) => {
  const date = new Date(PLAN_START_DATE);
  date.setDate(PLAN_START_DATE.getDate() + index);
  const jsDay = date.getDay();

  return {
    date,
    dateKey: getDateKey(date),
    dayIndex: index,
    dayNumber,
    monthName: weekDateMonths[index],
    weekday: jsDay === 0 ? 7 : jsDay,
  };
});

export const getPlanWeekItems = (plans: HomeFeedPlan[]) => {
  const sourceOrder = new Map(plans.map((plan, index) => [plan.id, index]));
  const partOfDayOrder: Record<string, number> = { morning: 0, day: 1, noon: 1, evening: 2 };

  return plans
    .flatMap((plan) => {
      const weekdays = plan.schedule.weekdays.length ? plan.schedule.weekdays : [calendarDays[0].weekday];
      const matchingDays = calendarDays.filter((day) => weekdays.includes(day.weekday));

      return matchingDays.map((day) => ({
        plan,
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
