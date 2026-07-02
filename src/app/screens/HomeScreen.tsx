import { useMemo, useState } from "react";
import { Copy, Filter, MapPin, MoreVertical, Search, Share2, Users } from "lucide-react";
import type { HomeFeedPlan, Screen } from "@/app/types";
import { CATEGORY_CHIPS, homeFeedPlans, normalizePlanTag, PLAN_TAG_LABELS } from "@/app/data/plans";
import { GREEN, GREEN_LIGHT } from "@/app/data/constants";
import { HomeSheet } from "@/app/components/HomeSheet";

function ParticipantAvatarLine({ avatars }: { avatars: string[] }) {
  const visible = avatars.slice(0, 5);

  return (
    <div className="flex -space-x-2">
      {visible.length > 0 ? (
        visible.map((url, index) => (
          <img
            key={`${url}-${index}`}
            src={url}
            alt=""
            className="h-7 w-7 rounded-full border-2 border-white object-cover shadow-[0_4px_10px_rgba(0,0,0,0.22)]"
          />
        ))
      ) : (
        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-white/25">
          <Users size={14} strokeWidth={1.8} color="#fff" />
        </div>
      )}
    </div>
  );
}

function FeedAvatarStack({ avatars, label }: { avatars: string[]; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <ParticipantAvatarLine avatars={avatars} />
      <span className="mt-1.5 text-[13px] font-medium leading-4 text-white/85">{label}</span>
    </div>
  );
}

function AuthorAvatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="h-9 w-9 flex-shrink-0 rounded-full object-cover" />;
  }

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: GREEN_LIGHT }}>
      <span className="text-[12px] font-bold" style={{ color: GREEN }}>{initials}</span>
    </div>
  );
}

function FeedEventCard({
  plan,
  onOpen,
  onAuthor,
  onShare,
  onAuthorMenu,
}: {
  plan: HomeFeedPlan;
  onOpen: () => void;
  onAuthor: () => void;
  onShare: () => void;
  onAuthorMenu: () => void;
}) {
  const tag = normalizePlanTag(plan.tag);

  return (
    <article>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className="relative w-full aspect-[4/5] overflow-hidden rounded-[28px] text-left active:opacity-95"
        style={{ background: plan.gradient ?? "#D1D5DB" }}
      >
        {plan.coverUrl && (
          <img src={plan.coverUrl} alt={plan.title} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.05) 42%, rgba(0,0,0,0.82) 100%)" }}
        />

        <div className="absolute left-5 right-5 top-5 flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-black/45 px-3 py-1.5 text-[13px] font-medium leading-4 text-white">
              {PLAN_TAG_LABELS[tag]}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-full bg-black/45"
          >
            <Share2 size={18} strokeWidth={2} color="#fff" />
          </button>
        </div>

        <div className="absolute bottom-8 left-5 right-5 flex flex-col items-center text-center">
          <FeedAvatarStack avatars={plan.participants} label={plan.participantsLabel} />
          <h2
            className="mt-3 max-w-[300px] text-[30px] font-bold leading-9 text-white"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {plan.isChallenge ? `Челлендж: ${plan.title}` : plan.title}
          </h2>
          <p className="mt-2 max-w-full truncate text-[16px] leading-6 text-white/75">{plan.timeDate}</p>
          {plan.address && (
            <p className="mt-0.5 max-w-full truncate text-[14px] text-white/65">{plan.address}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex h-12 items-center px-1">
        <button
          onClick={onAuthor}
          className="flex min-w-0 flex-1 items-center text-left"
        >
          <AuthorAvatar name={plan.author.name} avatarUrl={plan.author.avatarUrl} />
          <span className="ml-2.5 truncate text-[15px] font-medium text-gray-900">{plan.author.name}</span>
        </button>
        <button onClick={onAuthorMenu} className="w-8 h-8 flex items-center justify-end text-gray-400">
          <MoreVertical size={20} strokeWidth={1.9} />
        </button>
      </div>
    </article>
  );
}

export function HomeScreen({
  onNavigate,
  onPlanOpen,
  onAuthorOpen,
}: {
  onNavigate: (s: Screen, from?: Screen) => void;
  onPlanOpen: (id: number, from?: Screen) => void;
  onAuthorOpen: (expertId: string) => void;
}) {
  const [tagFilter, setTagFilter] = useState<TagFilter>("all");
  const [sheet, setSheet] = useState<"map" | "share" | "author" | null>(null);
  const [activePlan, setActivePlan] = useState<HomeFeedPlan | null>(null);
  const [copied, setCopied] = useState(false);
  const mapMarkers = useMemo(() => {
    const center = { lat: 55.7558, lng: 37.6176 };
    return Array.from({ length: 6 }, (_, index) => {
      const angle = Math.random() * Math.PI * 2;
      const radiusKm = 1 + Math.random() * 4;
      const lat = center.lat + Math.cos(angle) * radiusKm / 111;
      const lng = center.lng + Math.sin(angle) * radiusKm / (111 * Math.cos(center.lat * Math.PI / 180));
      return {
        id: index,
        lat,
        lng,
        left: 50 + (lng - center.lng) * 280,
        top: 50 - (lat - center.lat) * 520,
      };
    });
  }, []);

  const plansWithTag = homeFeedPlans.map((plan) => ({
    ...plan,
    tag: normalizePlanTag(plan.tag),
  }));

  const visiblePlans = plansWithTag.filter((plan) => {
    if (tagFilter === "all") return true;
    return plan.tag === tagFilter;
  });

  const openShare = (plan: HomeFeedPlan) => {
    setActivePlan(plan);
    setCopied(false);
    setSheet("share");
  };

  const copyActivePlan = async () => {
    if (!activePlan) return;
    await navigator.clipboard?.writeText(activePlan.shareUrl);
    setCopied(true);
  };

  const openAuthorMenu = (plan: HomeFeedPlan) => {
    setActivePlan(plan);
    setSheet("author");
  };

  return (
    <div className="relative flex flex-col h-full bg-surface">
      <div className="h-12 px-4 flex items-center justify-end">
        <div className="flex items-center gap-4 flex-shrink-0">
          <button onClick={() => onNavigate("search", "home")} className="w-[22px] h-[22px] flex items-center justify-center text-muted-foreground">
            <Search size={22} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-6 space-y-6">
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-2">
            {CATEGORY_CHIPS.map((chip) => {
              const active = tagFilter === chip.value;
              return (
                <button
                  key={chip.value}
                  onClick={() => setTagFilter(chip.value)}
                  className="flex-shrink-0 rounded-full px-4 py-2 text-[14px] font-semibold"
                  style={active ? { backgroundColor: GREEN_LIGHT, color: GREEN } : { backgroundColor: "var(--card)", color: "var(--foreground)" }}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => setSheet("map")}
          className="relative flex h-28 w-full overflow-hidden rounded-2xl p-4 text-left active:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--secondary) 0%, var(--accent) 55%, var(--brand-dark) 100%)" }}
        >
          {[18, 42, 71].map((left, index) => (
            <span
              key={left}
              className="absolute flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md"
              style={{ left: `${left}%`, top: `${26 + index * 17}%` }}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: GREEN }} />
            </span>
          ))}
          <div className="relative z-10 mt-auto">
            <p className="text-[17px] font-bold text-white">Офлайн-события рядом</p>
            <p className="mt-1 text-[13px] text-white/75">Посмотреть места на карте</p>
          </div>
          <MapPin className="absolute right-4 top-4 text-white/80" size={22} strokeWidth={1.8} />
        </button>

        {visiblePlans.length > 0 ? (
          visiblePlans.map((plan) => (
            <FeedEventCard
              key={plan.id}
              plan={plan}
              onOpen={() => onPlanOpen(plan.id, "home")}
              onAuthor={() => onAuthorOpen(plan.author.id ?? "gena")}
              onShare={() => openShare(plan)}
              onAuthorMenu={() => openAuthorMenu(plan)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[20px] bg-white px-6 py-14 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: GREEN_LIGHT }}>
              <Filter size={22} strokeWidth={1.8} color={GREEN} />
            </div>
            <h3 className="text-[17px] font-semibold text-gray-900">
              {tagFilter === "all"
                ? "Событий пока нет"
                : tagFilter === "running"
                  ? "Забегов пока нет"
                  : tagFilter === "cycling"
                    ? "Заездов пока нет"
                    : tagFilter === "yoga"
                      ? "Занятий пока нет"
                      : tagFilter === "recovery"
                        ? "Событий пока нет"
                        : "Тут пока пусто"}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-gray-400">
              {tagFilter === "all"
                ? "Скоро тут появятся события"
                : "Загляни позже или посмотри события в других категориях"}
            </p>
            {tagFilter !== "all" && (
              <button
                onClick={() => setTagFilter("all")}
                className="mt-5 h-11 rounded-full px-5 text-[14px] font-semibold text-white"
                style={{ backgroundColor: GREEN }}
              >
                Показать все
              </button>
            )}
          </div>
        )}
      </div>

      {sheet === "map" && (
        <HomeSheet title="Офлайн-события" onClose={() => setSheet(null)}>
          <div className="relative mb-4 h-56 overflow-hidden rounded-2xl bg-gray-100">
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #E8F5F4, #CDE9E5)" }} />
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/35" />
            {mapMarkers.map((marker) => (
              <span
                key={marker.id}
                className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md"
                style={{ left: `${marker.left}%`, top: `${marker.top}%` }}
              >
                <MapPin size={16} strokeWidth={2.2} color={GREEN} />
              </span>
            ))}
          </div>
          <p className="text-[13px] leading-5 text-muted-foreground">Москва · Красная площадь 55.7558, 37.6176. Точки случайно раскиданы в радиусе около 5 км.</p>
        </HomeSheet>
      )}

      {sheet === "share" && activePlan && (
        <HomeSheet title="Поделиться" onClose={() => setSheet(null)}>
          <p className="mb-3 truncate text-[14px] text-gray-500">{activePlan.title}</p>
          <button
            onClick={copyActivePlan}
            className="h-12 w-full rounded-2xl text-[15px] font-semibold text-white flex items-center justify-center gap-2"
            style={{ backgroundColor: GREEN }}
          >
            <Copy size={17} strokeWidth={2.2} />
            {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
          </button>
        </HomeSheet>
      )}

      {sheet === "author" && activePlan && (
        <HomeSheet title={activePlan.author.name} onClose={() => setSheet(null)}>
          <div className="space-y-2">
            <button onClick={() => { setSheet(null); onAuthorOpen(activePlan.author.id ?? "gena"); }} className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-left text-[15px] font-medium text-gray-900">Открыть профиль</button>
            <button onClick={() => setSheet(null)} className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-left text-[15px] font-medium text-gray-900">Пожаловаться</button>
          </div>
        </HomeSheet>
      )}
    </div>
  );
}
