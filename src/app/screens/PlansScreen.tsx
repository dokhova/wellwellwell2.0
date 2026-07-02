import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import type { HomeFeedPlan, Screen } from "@/app/types";
import { normalizePlanTag, PLAN_TAG_GRADIENTS } from "@/app/data/plans";
import { GREEN, PART_OF_DAY_RANGES } from "@/app/data/constants";
import { AnalyticsScreen } from "@/app/screens/AnalyticsScreen";
import { getPlanWeekItems } from "@/app/lib/planProgress";

export function PlanListCard({
  plan,
  dayNumber,
  monthLabel,
  scheduleMeta,
  done = false,
  showToggle = true,
  onOpen,
  onToggle,
}: {
  plan: Pick<HomeFeedPlan, "id" | "title" | "coverUrl" | "gradient" | "tag">;
  dayNumber: string | number;
  monthLabel: string;
  scheduleMeta: string;
  done?: boolean;
  showToggle?: boolean;
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
      {showToggle && (
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
      )}
    </button>
  );
}

export function PlansScreen({
  onNavigate,
  onPlanOpen,
  plans,
  checkedItemKeys,
  onToggleCheck,
}: {
  onNavigate: (s: Screen, from?: Screen) => void;
  onPlanOpen: (id: number) => void;
  plans: HomeFeedPlan[];
  checkedItemKeys: string[];
  onToggleCheck: (key: string) => void;
}) {
  void onNavigate;
  const [activeTab, setActiveTab] = useState<"plans" | "analytics">("plans");

  const todayIndex = 0;
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

  const planItems = getPlanWeekItems(plans);
  const nextItem = planItems.find((item) => item.dayIndex >= todayIndex) ?? planItems[0];

  const getStatus = (progressKey: string, dayIndex: number) => {
    if (checkedItemKeys.includes(progressKey)) return "Выполнено";
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
        <AnalyticsScreen plans={plans} checkedItemKeys={checkedItemKeys} />
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
              const { plan, dayIndex, dayNumber, monthName, progressKey } = item;
              const done = checkedItemKeys.includes(progressKey);
              const status = getStatus(progressKey, dayIndex);
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
                  onToggle={() => onToggleCheck(progressKey)}
                />
              );
            })}
            {planItems.length === 0 && (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl bg-card px-6 text-center">
                <p className="text-[16px] font-semibold text-foreground">Пока нет добавленных планов</p>
                <p className="mt-1 text-[14px] leading-5 text-muted-foreground">Добавьте план в профиле, и расписание появится здесь.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Screen: Create Plan ──────────────────────────────────────────────────────
