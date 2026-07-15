const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;
const WEEKDAY_VALUES = [1, 2, 3, 4, 5, 6, 7] as const;
const VALID_WEEKDAYS = new Set<number>(WEEKDAY_VALUES);

export const formatWeekdayRanges = (days: number[]): string => {
  const orderedDays = Array.from(new Set(days.filter((day) => VALID_WEEKDAYS.has(day)))).sort((a, b) => a - b);
  if (orderedDays.length === WEEKDAY_VALUES.length) return "Каждый день";

  const labels: string[] = [];
  let index = 0;
  while (index < orderedDays.length) {
    let endIndex = index;
    while (endIndex + 1 < orderedDays.length && orderedDays[endIndex + 1] === orderedDays[endIndex] + 1) {
      endIndex += 1;
    }

    const runLength = endIndex - index + 1;
    if (runLength >= 3) {
      labels.push(`${WEEKDAY_LABELS[orderedDays[index] - 1]}–${WEEKDAY_LABELS[orderedDays[endIndex] - 1]}`);
    } else {
      for (let itemIndex = index; itemIndex <= endIndex; itemIndex += 1) {
        labels.push(WEEKDAY_LABELS[orderedDays[itemIndex] - 1]);
      }
    }
    index = endIndex + 1;
  }

  return labels.join(", ");
};
