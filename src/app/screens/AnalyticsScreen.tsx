import { Activity, Flame } from "lucide-react";
import type { HomeFeedPlan } from "@/app/types";
import { GREEN } from "@/app/data/constants";
import { calendarDays, getPlanWeekItems } from "@/app/lib/planProgress";
import { normalizePlanTag } from "@/app/data/plans";

const tagIcon: Record<string, string> = {
  running: "🏃",
  cycling: "🚴",
  yoga: "🧘",
  fitness: "🏋️",
  recovery: "🌿",
  other: "✨",
};

export function AnalyticsScreen({
  plans,
  checkedItemKeys,
}: {
  plans: HomeFeedPlan[];
  checkedItemKeys: string[];
}) {
  const checked = new Set(checkedItemKeys);
  const weekItems = getPlanWeekItems(plans);
  const analytics = plans.map((plan) => {
    const items = weekItems.filter((item) => item.plan.id === plan.id);
    const done = items.filter((item) => checked.has(item.progressKey)).length;
    const total = items.length;
    let streak = 0;

    for (const day of [...calendarDays].reverse()) {
      const item = items.find((candidate) => candidate.dateKey === day.dateKey);
      if (!item) continue;
      if (!checked.has(item.progressKey)) break;
      streak += 1;
    }

    return {
      plan,
      done,
      total,
      percent: total > 0 ? Math.round((done / total) * 100) : 0,
      streak,
      icon: tagIcon[normalizePlanTag(plan.tag)],
    };
  });

  const totalDone = analytics.reduce((sum, item) => sum + item.done, 0);
  const totalSlots = analytics.reduce((sum, item) => sum + item.total, 0);
  const totalPercent = totalSlots > 0 ? Math.round((totalDone / totalSlots) * 100) : 0;

  if (plans.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-card">
          <Activity size={28} strokeWidth={1.8} color={GREEN} />
        </div>
        <p className="text-[16px] font-semibold text-foreground">Пока нет данных</p>
        <p className="mt-1 text-[14px] leading-5 text-muted-foreground">Добавьте план и отмечайте выполнение, чтобы увидеть аналитику.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="mb-4 rounded-2xl bg-card p-4">
        <p className="text-[13px] font-medium text-muted-foreground">Неделя 1–7 июля</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <p className="text-[34px] font-bold leading-9 text-foreground">{totalPercent}%</p>
            <p className="mt-1 text-[14px] leading-5 text-muted-foreground">{totalDone} из {totalSlots} выполнено</p>
          </div>
          <div className="h-2 min-w-[112px] flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full" style={{ width: `${totalPercent}%`, backgroundColor: GREEN }} />
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {analytics.map((item) => (
          <div key={item.plan.id} className="rounded-2xl bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-[22px]">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[15px] font-semibold leading-5 text-foreground">
                  {item.plan.habit?.title ?? item.plan.title}
                </h3>
                <p className="mt-1 text-[13px] leading-4 text-muted-foreground">{item.done}/{item.total} за неделю</p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1.5 text-[12px] font-semibold text-foreground">
                <Flame size={14} strokeWidth={2} color={GREEN} />
                {item.streak}
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full" style={{ width: `${item.percent}%`, backgroundColor: GREEN }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
