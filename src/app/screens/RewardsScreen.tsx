import { useEffect, useState } from "react";
import { ArrowLeft, Coins, Gift, Sparkles, Trophy } from "lucide-react";
import { PLAN_DARK } from "@/app/data/constants";
import { COIN_ACTION_LABELS, COIN_REWARDS, type CoinAction } from "@/app/lib/coins";

const REWARDS = [
  { title: "Кофе с командой WWW", price: 100, icon: "☕️" },
  { title: "Мерч WWW", price: 250, icon: "🧢" },
  { title: "Бесплатный слот на платное событие", price: 500, icon: "🎟️" },
  { title: "Индивидуальный разбор от тренера", price: 400, icon: "💬" },
];

const HOW_IT_WORKS = [
  { title: "Будь активным", text: "За действия в приложении монетки начисляются автоматически.", icon: Sparkles },
  { title: "Копи баланс", text: "Монетки не сгорают и остаются с тобой.", icon: Coins },
  { title: "Меняй на награды", text: "Раздел обмена скоро откроется.", icon: Trophy },
];

const ACTIONS = Object.keys(COIN_REWARDS) as CoinAction[];

export function RewardsScreen({ balance, onBack }: { balance: number; onBack: () => void }) {
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  return (
    <div className="relative flex h-full flex-col" style={{ background: PLAN_DARK.bg, color: PLAN_DARK.text }}>
      <header className="flex h-14 flex-shrink-0 items-center px-4" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <button type="button" onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-full active:opacity-75" style={{ background: PLAN_DARK.card }} aria-label="Назад">
          <ArrowLeft size={21} strokeWidth={2} />
        </button>
        <h1 className="flex-1 pr-10 text-center text-[17px] font-semibold">Монетки WWW</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-10">
        <section className="pb-8 pt-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg, #00A89D 0%, #2FBFAF 100%)" }}>
            <Coins size={29} strokeWidth={2} />
          </div>
          <p className="mt-5 text-[52px] font-bold leading-none">{balance}</p>
          <p className="mt-2 text-[14px]" style={{ color: PLAN_DARK.textSecondary }}>У тебя монеток</p>
          <p className="mx-auto mt-4 max-w-[300px] text-[15px] leading-6" style={{ color: PLAN_DARK.textSecondary }}>
            Копи монетки за активность и меняй на награды
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-[20px] font-bold">За что начисляем</h2>
          <div className="overflow-hidden rounded-2xl" style={{ background: PLAN_DARK.card }}>
            {ACTIONS.map((action, index) => (
              <div key={action} className="flex items-center justify-between gap-4 px-4 py-3.5" style={index ? { borderTop: `1px solid ${PLAN_DARK.divider}` } : undefined}>
                <span className="text-[14px]">{COIN_ACTION_LABELS[action]}</span>
                <span className="flex-shrink-0 text-[15px] font-bold" style={{ color: PLAN_DARK.accent }}>+{COIN_REWARDS[action]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Gift size={20} style={{ color: PLAN_DARK.accent }} />
            <h2 className="text-[20px] font-bold">Награды</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {REWARDS.map((reward) => (
              <article key={reward.title} className="flex min-h-[188px] flex-col rounded-2xl p-4" style={{ background: PLAN_DARK.card }}>
                <span className="text-[30px]" aria-hidden="true">{reward.icon}</span>
                <h3 className="mt-3 flex-1 text-[15px] font-semibold leading-5">{reward.title}</h3>
                <p className="mt-3 text-[13px] font-semibold" style={{ color: PLAN_DARK.accent }}>{reward.price} монеток</p>
                <button type="button" onClick={() => setToast("Обмен наград скоро откроется")} className="mt-3 h-9 rounded-xl text-[13px] font-semibold active:opacity-75" style={{ background: "rgba(47,191,175,0.14)", color: PLAN_DARK.accent }}>
                  Обменять
                </button>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-[20px] font-bold">Как это работает</h2>
          <div className="space-y-3">
            {HOW_IT_WORKS.map(({ title, text, icon: Icon }) => (
              <article key={title} className="flex gap-3 rounded-2xl p-4" style={{ background: PLAN_DARK.card }}>
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(47,191,175,0.14)", color: PLAN_DARK.accent }}>
                  <Icon size={20} />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold">{title}</h3>
                  <p className="mt-1 text-[13px] leading-5" style={{ color: PLAN_DARK.textSecondary }}>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {toast && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-[13px] font-medium text-black shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
