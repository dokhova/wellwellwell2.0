import type { Period, Schedule } from "@/app/types";

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
  `${weekDates[0]}–${weekDates[6]} ${weekDateMonths[6]}`,
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

  if (schedule.start) {
    const start = new Date(schedule.start);
    if (start >= todayDate) return start;
  }

  const weekdays = schedule.weekdays?.length ? schedule.weekdays : [1, 2, 3, 4, 5, 6, 7];
  if (weekdays.length === 7) return todayDate;

  const todayWeekday = todayDate.getDay() === 0 ? 7 : todayDate.getDay();
  for (let offset = 0; offset < 7; offset += 1) {
    const candidateWeekday = ((todayWeekday - 1 + offset) % 7) + 1;
    if (weekdays.includes(candidateWeekday)) {
      const date = new Date(todayDate);
      date.setDate(todayDate.getDate() + offset);
      return date;
    }
  }

  return todayDate;
}

export function formatNearestDate(schedule: Schedule) {
  const date = getNextOccurrence(schedule);
  return {
    dayNumber: date.getDate(),
    monthLabel: MONTH_SHORT[date.getMonth()],
  };
}
