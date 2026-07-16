import type { Period, Schedule } from "@/app/types";
import { getNearestWeekdayDate, isScheduleActiveOn, normalizePlanRepeat } from "@/app/lib/schedule";

const today = new Date();
today.setHours(0, 0, 0, 0);

const getWeekDate = (offset: number) => {
  const date = new Date(today);
  date.setDate(today.getDate() + offset);
  return date;
};

export const weekDays = Array.from({ length: 7 }, (_, index) =>
  ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][getWeekDate(index).getDay()]
);
export const weekDates = Array.from({ length: 7 }, (_, index) => getWeekDate(index).getDate());
export const weekDateMonths = Array.from({ length: 7 }, (_, index) =>
  getWeekDate(index).toLocaleDateString("ru-RU", { month: "long" })
);
export const PERIODS = ["День", "Неделя", "Месяц"] as const;
export const weekRanges = [
  `${weekDates[0]}–${getWeekDate(6).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}`,
];

export const chartData = [
  { day: weekDays[0], value: 80 },
  { day: weekDays[1], value: 60 },
  { day: weekDays[2], value: 100 },
  { day: weekDays[3], value: 40 },
  { day: weekDays[4], value: 90 },
  { day: weekDays[5], value: 30 },
  { day: weekDays[6], value: 0 },
];

const MONTH_SHORT = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

export function getNextOccurrence(schedule: Schedule, from: Date = new Date()): Date {
  const todayDate = new Date(from);
  todayDate.setHours(0, 0, 0, 0);
  const repeat = normalizePlanRepeat(schedule.repeat, schedule.start);
  const start = schedule.start ? new Date(schedule.start) : null;

  if (repeat.type === "none") {
    return start && !Number.isNaN(start.getTime())
      ? start
      : getNearestWeekdayDate(schedule.weekdays, todayDate);
  }

  const weekdays = schedule.weekdays?.length ? schedule.weekdays : [1, 2, 3, 4, 5, 6, 7];
  const firstCandidate = start && !Number.isNaN(start.getTime()) && start > todayDate
    ? new Date(start)
    : new Date(todayDate);
  firstCandidate.setHours(0, 0, 0, 0);

  const todayWeekday = firstCandidate.getDay() === 0 ? 7 : firstCandidate.getDay();
  for (let offset = 0; offset < 7; offset += 1) {
    const candidateWeekday = ((todayWeekday - 1 + offset) % 7) + 1;
    if (weekdays.includes(candidateWeekday)) {
      const date = new Date(firstCandidate);
      date.setDate(firstCandidate.getDate() + offset);
      return date;
    }
  }

  return firstCandidate;
}

export function hasUpcomingOccurrence(schedule: Schedule, from: Date = new Date()) {
  const todayDate = new Date(from);
  todayDate.setHours(0, 0, 0, 0);
  const repeat = normalizePlanRepeat(schedule.repeat, schedule.start);
  if (repeat.type === "none") {
    const start = schedule.start ? new Date(schedule.start) : null;
    return !start || Number.isNaN(start.getTime()) || start >= todayDate;
  }
  return isScheduleActiveOn(schedule, getNextOccurrence(schedule, todayDate));
}

export function formatNearestDate(schedule: Schedule) {
  const date = getNextOccurrence(schedule);
  return {
    dayNumber: date.getDate(),
    monthLabel: MONTH_SHORT[date.getMonth()],
  };
}
