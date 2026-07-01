import { useState } from "react";
import { Activity, Calendar, Check, ChevronDown, ChevronRight } from "lucide-react";
import type { HomeFeedPlan, Screen } from "@/app/types";
import { chartData, PERIODS, weekDates, weekDateMonths, weekDays, weekRanges } from "@/app/data/calendar";
import { homeFeedPlans, normalizePlanTag, PLAN_TAG_GRADIENTS } from "@/app/data/plans";
import { GREEN, PART_OF_DAY_RANGES } from "@/app/data/constants";

export function PlanListCard({
  plan,
  dayNumber,
  monthLabel,
  scheduleMeta,
  done = false,
  onOpen,
  onToggle,
}: {
  plan: Pick<HomeFeedPlan, "id" | "title" | "coverUrl" | "gradient" | "tag">;
  dayNumber: string | number;
  monthLabel: string;
  scheduleMeta: string;
  done?: boolean;
  onOpen: () => void;
  onToggle?: () => void;
}) {
  const gradient = plan.gradient ?? PLAN_TAG_GRADIENTS[normalizePlanTag(plan.tag)];

  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-[16px] bg-card px-3.5 py-3 text-left active:opacity-90"
      style={{ opacity: done ? 0.65 : 1 }}
    >
      <div className="flex w-[42px] flex-shrink-0 flex-col items-center justify-center">
        <span className="text-[12px] leading-4 text-muted-foreground">{monthLabel}</span>
        <span className="text-[20px] font-semibold leading-7 text-muted-foreground">{dayNumber}</span>
      </div>
      <div className="h-[38px] w-px flex-shrink-0 bg-border" />
      <div className="h-[50px] w-[50px] flex-shrink-0 overflow-hidden rounded-xl" style={{ background: gradient }}>
        {plan.coverUrl && <img src={plan.coverUrl} alt={plan.title} className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <h3
          className="truncate text-[14px] leading-5 font-medium"
          style={{
            color: done ? "var(--muted-foreground)" : "var(--foreground)",
            textDecoration: done ? "line-through" : "none",
          }}
        >
          {plan.title}
        </h3>
        <p className="mt-0.5 truncate text-[13px] leading-4 text-muted-foreground">{scheduleMeta}</p>
      </div>
      <span
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.();
        }}
        className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full border"
        style={{
          borderColor: done ? GREEN : "var(--border)",
          backgroundColor: done ? GREEN : "transparent",
        }}
      >
        {done && <Check size={14} strokeWidth={3} color="#fff" />}
      </span>
    </button>
  );
}

export function PlansScreen({ onNavigate, onPlanOpen }: { onNavigate: (s: Screen, from?: Screen) => void; onPlanOpen: (id: number) => void }) {
  void onNavigate;
  const [activeTab, setActiveTab] = useState<"plans" | "analytics">("plans");
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  const toggleCheck = (id: number) => {
    setCheckedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const todayIndex = 2;
  const monthShort = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
  const monthNumberByName: Record<string, number> = {
    января: 0,
    февраля: 1,
    марта: 2,
    апреля: 3,
    мая: 4,
    июня: 5,
    июля: 6,
    августа: 7,
    сентября: 8,
    октября: 9,
    ноября: 10,
    декабря: 11,
  };

  const partOfDayOrder: Record<string, number> = { morning: 0, day: 1, noon: 1, evening: 2 };
  const planItems = homeFeedPlans
    .flatMap((plan) => {
      const dayIndexes =
        plan.schedule.mode === "partOfDay" || plan.schedule.timeMode === "partOfDay"
          ? (plan.schedule.weekdays.length ? plan.schedule.weekdays.map((day) => day - 1) : [todayIndex])
          : [todayIndex];
      return dayIndexes.map((dayIndex) => ({
      plan,
      dayIndex,
      dayNumber: weekDates[dayIndex],
      monthName: weekDateMonths[dayIndex],
      sortKey: dayIndex,
      }));
    })
    .sort((a, b) => {
      const aTime = a.plan.schedule.partOfDay ? partOfDayOrder[a.plan.schedule.partOfDay] ?? 3 : 3;
      const bTime = b.plan.schedule.partOfDay ? partOfDayOrder[b.plan.schedule.partOfDay] ?? 3 : 3;
      return a.sortKey - b.sortKey || aTime - bTime || a.plan.title.localeCompare(b.plan.title);
    });
  const nextItem = planItems.find((item) => item.dayIndex >= todayIndex) ?? planItems[0];

  const getStatus = (planId: number, dayIndex: number) => {
    if (checkedItems.includes(planId)) return "Выполнено";
    if (dayIndex < todayIndex) return "Не выполнено";
    return "Запланировано";
  };

  const getTimeLabel = (plan: HomeFeedPlan) => {
    if (plan.schedule.mode === "exact" || plan.schedule.timeMode === "exact") {
      const start = plan.schedule.start ? new Date(plan.schedule.start) : null;
      if (start && !Number.isNaN(start.getTime())) {
        return start.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      }
    }
    if (plan.schedule.partOfDay) {
      return PART_OF_DAY_RANGES[plan.schedule.partOfDay].label;
    }
    return plan.timeDate.split("·")[0]?.trim() || "Время";
  };

  const getScheduleMeta = (plan: HomeFeedPlan, dayIndex: number, status: string) => {
    const timeLabel = getTimeLabel(plan);
    const prefix =
      dayIndex === todayIndex
        ? `${timeLabel.includes(":") ? "Сегодня в " : ""}${timeLabel}`
        : dayIndex === todayIndex + 1
          ? `${timeLabel.includes(":") ? "Завтра в " : "Завтра · "}${timeLabel}`
          : timeLabel;
    return `${prefix} · ${status}`;
  };

  const getGradient = (plan: HomeFeedPlan) => plan.gradient ?? PLAN_TAG_GRADIENTS[normalizePlanTag(plan.tag)];

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex flex-shrink-0 border-b border-border px-4">
        {[
          { id: "plans" as const, label: "Планы" },
          { id: "analytics" as const, label: "Аналитика" },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative h-12 flex-1 text-[17px] font-semibold"
              style={{ color: active ? "var(--foreground)" : "var(--muted-foreground)" }}
            >
              {tab.label}
              {active && <span className="absolute bottom-0 left-1/2 h-0.5 w-16 -translate-x-1/2 rounded-full" style={{ backgroundColor: GREEN }} />}
            </button>
          );
        })}
      </div>

      {activeTab === "analytics" ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-card">
            <Activity size={28} strokeWidth={1.8} color={GREEN} />
          </div>
          <p className="text-[16px] font-semibold text-foreground">В работе</p>
          <p className="mt-1 text-[14px] leading-5 text-muted-foreground">Аналитика появится здесь скоро</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {nextItem && (
            <button
              onClick={() => onPlanOpen(nextItem.plan.id)}
              className="mb-4 flex w-full items-center gap-3 rounded-[16px] p-3.5 text-left active:opacity-90"
              style={{ backgroundColor: "var(--brand-dark)" }}
            >
              <div className="h-[46px] w-[46px] flex-shrink-0 overflow-hidden rounded-lg" style={{ background: getGradient(nextItem.plan) }}>
                {nextItem.plan.coverUrl && <img src={nextItem.plan.coverUrl} alt={nextItem.plan.title} className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] leading-4 text-white/60">
                  {nextItem.dayIndex === todayIndex ? "Сегодня" : "Скоро"} · {nextItem.dayNumber} {nextItem.monthName}
                </p>
                <h3 className="mt-0.5 truncate text-[15px] font-semibold leading-5 text-white">{nextItem.plan.title}</h3>
              </div>
              <ChevronRight size={18} strokeWidth={2} color="rgba(255,255,255,0.7)" />
            </button>
          )}

          <div className="space-y-2.5">
            {planItems.map((item) => {
              const { plan, dayIndex, dayNumber, monthName } = item;
              const done = checkedItems.includes(plan.id);
              const status = getStatus(plan.id, dayIndex);
              const scheduleMeta = getScheduleMeta(plan, dayIndex, status);
              const monthIndex = monthNumberByName[monthName] ?? 0;
              return (
                <PlanListCard
                  key={`${plan.id}-${dayIndex}`}
                  plan={plan}
                  dayNumber={dayNumber}
                  monthLabel={monthShort[monthIndex]}
                  scheduleMeta={scheduleMeta}
                  done={done}
                  onOpen={() => onPlanOpen(plan.id)}
                  onToggle={() => toggleCheck(plan.id)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Screen: Create Plan ──────────────────────────────────────────────────────
