import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { ArrowLeft, Check, ChevronRight, Copy, Gift, GlassWater, Medal, Percent, Shirt, Ticket, X } from "lucide-react";
import { CoinIcon } from "@/app/components/CoinIcon";
import { COINS_TEST_MODE, COIN_ACTION_LABELS, COIN_REWARDS, REWARDS, collectTestCoins, redeem, useCoinState, type ClaimedReward, type CoinAction, type Reward } from "@/app/lib/coins";
import { track } from "@/app/lib/analytics";
import heroImage from "@/imports/feed-cover-1-opt.webp";

const DIM = "rgba(255,255,255,0.55)";
const CARD = "rgba(255,255,255,0.07)";
const BORDER = "rgba(255,255,255,0.10)";
const ICONS: Record<string, ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  shu: Percent, slot: Ticket, tee: Shirt, bottle: GlassWater, marathon: Medal, "welcome-shu": Percent, "welcome-run": Ticket,
};
const KIND_LINE = { code: "Промокод, покажи при оплате", booking: "Место забронировано, покажи на входе", pickup: "Забери на ближайшей пробежке" } as const;
const KIND_TAG = { code: "промокод", booking: "бронь", pickup: "к выдаче" } as const;
const EARN_ACTIONS = Object.keys(COIN_REWARDS) as CoinAction[];
const REWARD_PHOTOS: Record<string, { tags: string; lock: number }> = {
  shu: { tags: "running,shoes", lock: 21 },
  slot: { tags: "marathon,runners", lock: 22 },
  tee: { tags: "running,tshirt", lock: 23 },
  bottle: { tags: "sport,waterbottle", lock: 24 },
  marathon: { tags: "marathon,race", lock: 25 },
};
const format = (value: number) => value.toLocaleString("ru-RU");
const pluralGifts = (count: number) => {
  const last = count % 10;
  const lastTwo = count % 100;
  if (last === 1 && lastTwo !== 11) return "подарок";
  if (last >= 2 && last <= 4 && (lastTwo < 10 || lastTwo >= 20)) return "подарка";
  return "подарков";
};

type Sheet = "earn" | "gifts" | null;

function BottomSheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/65 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full max-h-[88%] overflow-y-auto rounded-t-[30px] border border-white/10 bg-[#101E20] px-[22px] pb-[calc(28px+env(safe-area-inset-bottom))] pt-4" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto mb-[18px] h-[5px] w-11 rounded-full bg-white/20" />
        {children}
      </div>
    </div>
  );
}

function RewardCard({ reward, balance, received, onOpen }: { reward: Reward; balance: number; received: boolean; onOpen: (reward: Reward) => void }) {
  const [imageVisible, setImageVisible] = useState(true);
  const photo = REWARD_PHOTOS[reward.id] ?? { tags: reward.id, lock: 99 };
  const photoUrl = `https://loremflickr.com/320/440/${photo.tags}?lock=${photo.lock}`;
  const Icon = ICONS[reward.id] ?? Gift;
  const available = reward.cost <= balance;

  return (
    <button type="button" onClick={() => onOpen(reward)} disabled={received} className="relative flex min-h-[214px] w-[158px] shrink-0 snap-start flex-col overflow-hidden rounded-[24px] border p-3.5 text-left transition active:scale-[0.98]" style={{ borderColor: BORDER, background: `linear-gradient(155deg, ${reward.gradient[0]}, ${reward.gradient[1]})` }}>
      {imageVisible && <img src={photoUrl} alt="" onError={() => setImageVisible(false)} className="absolute inset-0 h-full w-full object-cover" />}
      <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,120,110,.32),rgba(4,48,44,.55))] mix-blend-multiply" />
      <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.15)_0%,rgba(0,0,0,0)_34%,rgba(0,0,0,.82)_100%)]" />
      <span className="relative z-10 flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white/15 backdrop-blur-sm"><Icon size={23} strokeWidth={2} /></span>
      <span className="relative z-10 mt-auto block w-full">
        <span className="block text-[15px] font-bold leading-[1.2]">{reward.title}</span>
        <span className="mt-[3px] block text-[12px] leading-[1.2] text-white/80">{reward.sub}</span>
        <span className={`mt-2.5 inline-block rounded-full px-3 py-1.5 text-[12px] font-bold ${received ? "bg-white/15 text-white" : available ? "bg-[#00A89D] text-[#04302C]" : "bg-black/45 text-white"}`}>
          {received ? "получено" : available ? `${format(reward.cost)} W` : `не хватает ${format(reward.cost - balance)}`}
        </span>
      </span>
      {received && <span className="absolute inset-0 z-20 bg-[#060F11]/55" />}
    </button>
  );
}

export function RewardsScreen({ userId, onBack }: { userId: string; onBack: () => void }) {
  const { balance, claimed } = useCoinState(userId);
  const [active, setActive] = useState<Reward | null>(null);
  const [result, setResult] = useState<ClaimedReward | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gain, setGain] = useState<number | null>(null);
  const [giftDetail, setGiftDetail] = useState<ClaimedReward | null>(null);
  const claimedIds = useMemo(() => new Set(claimed.map((item) => item.rewardId)), [claimed]);

  useEffect(() => { track("coins_opened", { screen_name: "rewards" }); }, []);

  const openReward = (reward: Reward) => {
    if (claimedIds.has(reward.id)) return;
    track("reward_card_tapped", { screen_name: "rewards", reward_id: reward.id });
    setResult(null);
    setActive(reward);
  };

  const claimReward = async () => {
    if (!active || submitting || active.cost > balance) return;
    setSubmitting(true);
    try {
      const reward = await redeem(userId, active);
      setResult(reward);
      track("reward_redeemed", { screen_name: "rewards", reward_id: active.id, cost: active.cost });
    } catch (error) {
      console.error("Reward redeem failed", error);
    } finally { setSubmitting(false); }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) { console.warn("Clipboard write failed", error); }
  };

  const closeReward = () => { setActive(null); setResult(null); setCopied(false); };
  const collect = () => {
    collectTestCoins(userId);
    const marker = Date.now();
    setGain(marker);
    window.setTimeout(() => setGain((current) => current === marker ? null : current), 1100);
  };

  return (
    <div className="relative h-full overflow-hidden bg-[#0C1618] text-white">
      <main className="h-full overflow-y-auto">
        <section className="relative h-[300px] overflow-hidden">
          <img src={heroImage} alt="Бегуны WellWellWell" className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,15,17,0.48)_0%,rgba(6,15,17,0)_34%,#0C1618_100%)]" />

          <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-2.5 px-5 pt-[calc(12px+env(safe-area-inset-top))]">
            <button type="button" onClick={onBack} aria-label="Назад" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-xl active:opacity-70"><ArrowLeft size={20} /></button>
            <button type="button" onClick={() => { setSheet("gifts"); track("gifts_opened", { screen_name: "rewards" }); }} className="flex h-10 items-center gap-2 rounded-full bg-white/15 px-4 text-[15px] font-semibold backdrop-blur-xl active:opacity-70">
              <Gift size={17} /> {claimed.length} {pluralGifts(claimed.length)}
            </button>
            <span className="flex-1" />
            {COINS_TEST_MODE && <button type="button" onClick={collect} className="h-10 shrink-0 whitespace-nowrap rounded-full bg-[#00A89D] px-4 text-[15px] font-extrabold text-[#04302C] shadow-[0_6px_18px_rgba(0,168,157,.4)] active:opacity-80">Собрать +100</button>}
          </div>

          <div className="absolute bottom-6 left-5 z-10">
            {gain && <span key={gain} className="pointer-events-none absolute left-[52px] top-[-14px] animate-[coin-gain_1.1s_ease_forwards] text-[22px] font-extrabold text-[#22D3C2]">+100</span>}
            <div className="flex items-center gap-3"><CoinIcon size={35} /><span className="text-[48px] font-extrabold leading-none tracking-[-1px]">{format(balance)}</span></div>
            <p className="ml-[47px] mt-1 text-[15px]" style={{ color: DIM }}>монет на балансе</p>
          </div>
        </section>

        <section className="px-5 pb-10 pt-3">
          <h1 className="mb-3 mt-3 text-[12px] font-semibold tracking-[1.4px] text-white/45">НА ЧТО ПОТРАТИТЬ</h1>
          <div className="flex snap-x gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {REWARDS.map((reward) => <RewardCard key={reward.id} reward={reward} balance={balance} received={claimedIds.has(reward.id)} onOpen={openReward} />)}
          </div>
          <button type="button" onClick={() => { setSheet("earn"); track("how_to_earn_opened", { screen_name: "rewards" }); }} className="mt-[22px] flex w-full items-center justify-center gap-1.5 rounded-[18px] border px-4 py-4 text-[15px] font-semibold active:opacity-70" style={{ background: CARD, borderColor: BORDER, color: DIM }}>
            Как копить монеты <ChevronRight size={18} />
          </button>
        </section>
      </main>

      {active && (
        <BottomSheet onClose={closeReward}>
          {!result ? (
            <>
              <div className="mx-auto mb-3.5 flex h-[72px] w-[72px] items-center justify-center rounded-[20px]" style={{ background: `linear-gradient(155deg, ${active.gradient[0]}, ${active.gradient[1]})` }}>
                {(() => { const Icon = ICONS[active.id] ?? Gift; return <Icon size={30} />; })()}
              </div>
              <h2 className="text-center text-[20px] font-bold">{active.title}</h2>
              <p className="mt-1 text-center text-[14px]" style={{ color: DIM }}>{active.sub}</p>
              <div className="mt-5 flex justify-between rounded-2xl border px-4 py-[15px]" style={{ background: CARD, borderColor: BORDER }}>
                <span style={{ color: DIM }}>Останется</span><strong className={active.cost > balance ? "text-[#F0A35A]" : ""}>{format(Math.max(0, balance - active.cost))} монет</strong>
              </div>
              {active.cost <= balance ? (
                <button type="button" disabled={submitting} onClick={() => void claimReward()} className="mt-[18px] w-full rounded-[18px] bg-[linear-gradient(90deg,#00A89D,#21C6B6)] px-4 py-[17px] text-[16px] font-extrabold text-[#04302C] active:opacity-80 disabled:opacity-50">{submitting ? "Получаем..." : `Забрать за ${format(active.cost)} W`}</button>
              ) : <p className="px-2 pb-1 pt-4 text-center text-[14px] text-[#F0A35A]">не хватает {format(active.cost - balance)} монет, добеги</p>}
              <button type="button" onClick={closeReward} className="mt-2 w-full rounded-2xl px-4 py-3.5 text-[15px]" style={{ color: DIM }}>{active.cost <= balance ? "Отмена" : "Понятно"}</button>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-3.5 flex h-[74px] w-[74px] animate-[reward-pop_.5s_ease] items-center justify-center rounded-full bg-[linear-gradient(150deg,#4FF3DC,#00C4B2_42%,#009488)] shadow-[0_12px_30px_rgba(0,196,178,.4)]"><Check size={34} strokeWidth={3} className="text-[#04302C]" /></div>
              <h2 className="text-[20px] font-bold">Готово</h2>
              <p className="mt-1.5 text-[14px]" style={{ color: DIM }}>{KIND_LINE[result.kind]}</p>
              <div className="mt-[18px] flex items-center justify-between gap-2 rounded-2xl border px-4 py-[15px]" style={{ background: CARD, borderColor: BORDER }}>
                <strong className="truncate font-mono text-[14px] tracking-wide">{result.code}</strong>
                <button type="button" onClick={() => void copyCode(result.code)} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#00A89D]/15 px-3 py-2 text-[13px] font-bold text-[#22D3C2]">{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "готово" : "копировать"}</button>
              </div>
              <button type="button" onClick={closeReward} className="mt-[18px] w-full rounded-[18px] bg-[linear-gradient(90deg,#00A89D,#21C6B6)] px-4 py-[17px] text-[16px] font-extrabold text-[#04302C]">Отлично</button>
            </div>
          )}
        </BottomSheet>
      )}

      {sheet === "earn" && (
        <BottomSheet onClose={() => setSheet(null)}>
          <h2 className="text-center text-[20px] font-bold">Как копить монеты</h2><p className="mb-4 mt-1 text-center text-[14px]" style={{ color: DIM }}>Начисляются автоматически</p>
          <div className="overflow-hidden rounded-2xl border px-1" style={{ background: CARD, borderColor: BORDER }}>
            {EARN_ACTIONS.map((action, index) => <div key={action} className={`flex items-center justify-between px-3.5 py-[13px] ${index ? "border-t border-white/[.07]" : ""}`}><span className="text-[15px]">{COIN_ACTION_LABELS[action]}</span><strong className="text-[15px] text-[#22D3C2]">+{COIN_REWARDS[action]}</strong></div>)}
          </div>
          <button type="button" onClick={() => setSheet(null)} className="mt-[18px] w-full rounded-[18px] bg-[linear-gradient(90deg,#00A89D,#21C6B6)] px-4 py-[17px] text-[16px] font-extrabold text-[#04302C]">Понятно</button>
        </BottomSheet>
      )}

      {sheet === "gifts" && (
        <BottomSheet onClose={() => setSheet(null)}>
          <div className="relative mb-4"><h2 className="text-center text-[20px] font-bold">Мои подарки</h2><button type="button" onClick={() => setSheet(null)} aria-label="Закрыть" className="absolute right-0 top-0 text-white/55"><X size={22} /></button></div>
          {claimed.length ? <div className="flex flex-col gap-2.5">{claimed.map((reward) => { const Icon = ICONS[reward.rewardId] ?? Gift; return <button type="button" key={reward.rewardId} onClick={() => { setCopied(false); setGiftDetail(reward); }} className="flex w-full items-center gap-3 rounded-2xl border px-4 py-[15px] text-left active:opacity-75" style={{ background: CARD, borderColor: BORDER }}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10"><Icon size={20} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-[15px] font-semibold">{reward.title}</strong><span className="mt-0.5 block truncate font-mono text-[13px] tracking-wide" style={{ color: DIM }}>{reward.code}</span></span><span className="shrink-0 rounded-full bg-[#00A89D]/15 px-2.5 py-1 text-[12px] font-bold text-[#22D3C2]">{KIND_TAG[reward.kind]}</span><ChevronRight size={16} className="shrink-0 text-white/55" /></button>; })}</div> : <div className="rounded-2xl border px-4 py-8 text-center text-[14px]" style={{ background: CARD, borderColor: BORDER, color: DIM }}>Здесь появятся полученные награды</div>}
          <button type="button" onClick={() => setSheet(null)} className="mt-[18px] w-full rounded-[18px] bg-[linear-gradient(90deg,#00A89D,#21C6B6)] px-4 py-[17px] text-[16px] font-extrabold text-[#04302C]">Закрыть</button>
        </BottomSheet>
      )}

      {giftDetail && (
        <BottomSheet onClose={() => { setGiftDetail(null); setCopied(false); }}>
          <div className="mx-auto mb-3.5 flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-white/10">
            {(() => { const Icon = ICONS[giftDetail.rewardId] ?? Gift; return <Icon size={30} strokeWidth={2} />; })()}
          </div>
          <h2 className="text-center text-[20px] font-bold">{giftDetail.title}</h2>
          <p className="mt-1.5 text-center text-[14px]" style={{ color: DIM }}>{KIND_LINE[giftDetail.kind]}</p>
          <div className="mt-[18px] flex items-center justify-between gap-2 rounded-2xl border px-4 py-[15px]" style={{ background: CARD, borderColor: BORDER }}>
            <strong className="truncate font-mono text-[14px] tracking-wide">{giftDetail.code}</strong>
            <button type="button" onClick={() => void copyCode(giftDetail.code)} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#00A89D]/15 px-3 py-2 text-[13px] font-bold text-[#22D3C2]">{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "готово" : "копировать"}</button>
          </div>
          <button type="button" onClick={() => { setGiftDetail(null); setCopied(false); }} className="mt-[18px] w-full rounded-[18px] bg-[linear-gradient(90deg,#00A89D,#21C6B6)] px-4 py-[17px] text-[16px] font-extrabold text-[#04302C]">Готово</button>
        </BottomSheet>
      )}
    </div>
  );
}
