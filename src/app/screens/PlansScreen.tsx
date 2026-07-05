import { CalendarPlus, Check, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { HomeFeedPlan, PlanId, Screen } from "@/app/types";
import { normalizePlanTag, PLAN_TAG_GRADIENTS } from "@/app/data/plans";
import { GREEN, GREEN_LIGHT, PART_OF_DAY_RANGES } from "@/app/data/constants";
import { getPlanWeekItems } from "@/app/lib/planProgress";
import { HomeSheet } from "@/app/components/HomeSheet";

export function PlanListCard({
  plan,
  dayNumber,
  monthLabel,
  scheduleMeta,
  done = false,
  showToggle = true,
  badge,
  onOpen,
  onToggle,
}: {
  plan: Pick<HomeFeedPlan, "id" | "title" | "coverUrl" | "gradient" | "tag">;
  dayNumber: string | number;
  monthLabel: string;
  scheduleMeta: string;
  done?: boolean;
  showToggle?: boolean;
  badge?: string;
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
        {plan.coverUrl && <img loading="lazy" decoding="async" src={plan.coverUrl} alt={plan.title} className="h-full w-full object-cover" />}
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
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
          {badge && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: GREEN_LIGHT, color: GREEN }}>
              {badge}
            </span>
          )}
          <p className="min-w-0 truncate text-[13px] leading-4 text-muted-foreground">{scheduleMeta}</p>
        </div>
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
  participantPlans,
  checkedItemKeys,
  onToggleCheck,
  onRemoveParticipant,
  highlightedPlanId,
}: {
  onNavigate: (s: Screen, from?: Screen) => void;
  onPlanOpen: (id: PlanId) => void;
  participantPlans: HomeFeedPlan[];
  checkedItemKeys: string[];
  onToggleCheck: (key: string) => void;
  onRemoveParticipant: (id: PlanId, scope?: "single" | "program") => void;
  highlightedPlanId?: PlanId | null;
}) {
  const isEmpty = participantPlans.length === 0;
  const [removingPlan, setRemovingPlan] = useState<HomeFeedPlan | null>(null);

  const todayIndex = 0;
  const planItems = getPlanWeekItems(participantPlans);
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
      <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-border px-4">
        <div className="h-10 w-10" />
        <div className="min-w-0 flex-1 text-center">
          <h1 className="text-[20px] font-semibold leading-6 text-foreground">Мои планы</h1>
        </div>
        {!isEmpty ? (
          <button
            onClick={() => onNavigate("create", "plans")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground active:opacity-85"
            aria-label="Создать план"
          >
            <Plus size={22} strokeWidth={1.9} />
          </button>
        ) : (
          <div className="h-10 w-10" />
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isEmpty ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl bg-card px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: GREEN_LIGHT }}>
              <CalendarPlus size={24} strokeWidth={1.9} color={GREEN} />
            </div>
            <p className="text-[17px] font-semibold text-foreground">Планов пока нет</p>
            <p className="mt-2 text-[14px] leading-5 text-muted-foreground">Присоединяйся к планам или создавай свои — они появятся здесь</p>
            <button onClick={() => onNavigate("create", "plans")} className="mt-5 flex h-11 items-center gap-2 rounded-full px-5 text-[14px] font-semibold text-white" style={{ backgroundColor: GREEN }}>
              <Plus size={16} strokeWidth={2.2} />
              Создать
            </button>
          </div>
        ) : (
          <>
            {nextItem && (
              <button
                onClick={() => onPlanOpen(nextItem.plan.id)}
                className="mb-4 flex w-full items-center gap-3 rounded-[16px] p-3.5 text-left active:opacity-90"
                style={{ backgroundColor: "var(--brand-dark)" }}
              >
                <div className="h-[46px] w-[46px] flex-shrink-0 overflow-hidden rounded-lg" style={{ background: getGradient(nextItem.plan) }}>
                  {nextItem.plan.coverUrl && <img loading="lazy" decoding="async" src={nextItem.plan.coverUrl} alt={nextItem.plan.title} className="h-full w-full object-cover" />}
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
                const { plan, dateKey, dayIndex, dayNumber, progressKey } = item;
                const done = checkedItemKeys.includes(progressKey);
                const status = getStatus(progressKey, dayIndex);
                const scheduleMeta = getScheduleMeta(plan, dayIndex, status);
                const itemDate = new Date(`${dateKey}T00:00:00`);
                const monthLabel = Number.isNaN(itemDate.getTime())
                  ? "Дата"
                  : itemDate.toLocaleDateString("ru-RU", { month: "short" }).replace(".", "");
                return (
                  <div key={`${plan.id}-${dayIndex}`} className={`relative rounded-[16px] transition-colors duration-700 ${highlightedPlanId === plan.id ? "bg-secondary" : ""}`}>
                    <PlanListCard
                      plan={plan}
                      dayNumber={dayNumber}
                      monthLabel={monthLabel}
                      scheduleMeta={scheduleMeta}
                      done={done}
                      onOpen={() => onPlanOpen(plan.id)}
                      onToggle={() => onToggleCheck(progressKey)}
                    />
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setRemovingPlan(plan);
                      }}
                      className="absolute right-11 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-card text-muted-foreground active:opacity-80"
                      aria-label="Убрать из моих планов"
                    >
                      <Trash2 size={15} strokeWidth={2} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      {removingPlan && (
        <HomeSheet title="Удаление" onClose={() => setRemovingPlan(null)}>
          {removingPlan.items?.length ? (
            <div className="space-y-2">
              <button
                onClick={() => {
                  onRemoveParticipant(removingPlan.id, "single");
                  setRemovingPlan(null);
                }}
                className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-left text-[15px] font-medium text-gray-900"
              >
                Удалить только это событие
              </button>
              <button
                onClick={() => {
                  onRemoveParticipant(removingPlan.id, "program");
                  setRemovingPlan(null);
                }}
                className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-left text-[15px] font-medium text-gray-900"
              >
                Удалить всю программу
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                const confirmed = window.confirm("Удалить план?");
                if (confirmed) {
                  onRemoveParticipant(removingPlan.id, "single");
                  setRemovingPlan(null);
                }
              }}
              className="h-12 w-full rounded-2xl text-[15px] font-semibold text-white"
              style={{ backgroundColor: GREEN }}
            >
              Удалить план
            </button>
          )}
        </HomeSheet>
      )}
    </div>
  );
}

// ─── Screen: Create Plan ──────────────────────────────────────────────────────
