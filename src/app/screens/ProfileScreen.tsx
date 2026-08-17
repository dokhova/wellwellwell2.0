import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Coins, Edit3, MessageCircle } from "lucide-react";
import type { Article, ChatPeer, HomeFeedPlan, PlanId, Screen } from "@/app/types";
import { formatNearestDate, getNextOccurrence, weekDateMonths } from "@/app/data/calendar";
import { GREEN, GREEN_LIGHT, PLAN_DARK } from "@/app/data/constants";
import { DEFAULT_COVER_URLS, profileFollowers, profileFollowing, resolveCoverUrl, type ExpertConnection, type ExpertProfile } from "@/app/data/profile";
import { HomeSheet } from "@/app/components/HomeSheet";
import { isSchedulePastRepeatEnd } from "@/app/lib/schedule";
import { useCoinBalance } from "@/app/lib/coins";

export type ConnectionType = "followers" | "following";

function ProfilePlanCard({
  plan,
  dayNumber,
  monthLabel,
  scheduleMeta,
  onOpen,
}: {
  plan: HomeFeedPlan;
  dayNumber?: number | string;
  monthLabel?: string;
  scheduleMeta?: string;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left active:opacity-90"
      style={{ background: PLAN_DARK.card }}
    >
      <div
        className="h-[52px] w-[52px] flex-shrink-0 overflow-hidden rounded-xl"
        style={{ background: plan.gradient ?? "rgba(255,255,255,0.10)" }}
      >
        {plan.coverUrl && <img loading="lazy" decoding="async" src={plan.coverUrl} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] leading-4" style={{ color: PLAN_DARK.textSecondary }}>
          {[dayNumber, monthLabel].filter(Boolean).join(" ") || scheduleMeta}
        </p>
        <h3 className="mt-0.5 truncate text-[15px] font-semibold leading-5" style={{ color: PLAN_DARK.text }}>{plan.title}</h3>
        {scheduleMeta && (dayNumber || monthLabel) && (
          <p className="mt-0.5 truncate text-[12px]" style={{ color: PLAN_DARK.textSecondary }}>{scheduleMeta}</p>
        )}
      </div>
    </button>
  );
}

function Avatar({ user }: { user: ExpertConnection }) {
  if (user.avatarUrl) {
    return <img loading="lazy" decoding="async" src={user.avatarUrl} alt={user.name} className="h-11 w-11 flex-shrink-0 rounded-full object-cover" />;
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: GREEN_LIGHT }}>
      <span className="text-[14px] font-bold" style={{ color: GREEN }}>{initials}</span>
    </div>
  );
}

function ConnectionRow({
  user,
  onProfile,
  onToggle,
}: {
  user: ExpertConnection;
  onProfile: () => void;
  onToggle?: () => void;
}) {
  return (
    <button
      onClick={onProfile}
      className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left active:opacity-90"
    >
      <Avatar user={user} />
      <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-gray-900">{user.name}</span>
      {onToggle && (
        <span
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
          className="flex-shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold"
          style={user.isFollowedByMe ? { borderColor: "var(--border)", color: "var(--foreground)" } : { borderColor: GREEN, color: GREEN }}
        >
          {user.isFollowedByMe ? "Отписаться" : "Подписаться"}
        </span>
      )}
    </button>
  );
}

export function ProfileConnectionsScreen({
  type,
  onBack,
  onProfileOpen,
  canEditFollowing,
  followerItems,
  followingItems,
  onToggleFollowing,
}: {
  type: ConnectionType;
  onBack: () => void;
  onProfileOpen: (user: ExpertConnection) => void;
  canEditFollowing: boolean;
  followerItems?: ExpertConnection[];
  followingItems?: ExpertConnection[];
  onToggleFollowing?: (id: string) => void;
}) {
  const [followers, setFollowers] = useState(profileFollowers);
  const [following, setFollowing] = useState(profileFollowing);
  const [pendingUnfollow, setPendingUnfollow] = useState<ExpertConnection | null>(null);
  const isFollowers = type === "followers";
  const title = isFollowers ? "Подписчики" : "Подписки";
  const people = isFollowers ? followerItems ?? followers : followingItems ?? following;
  const emptyText = isFollowers ? "Пока никто не подписался" : "Вы ни на кого не подписаны";
  const canEditConnections = canEditFollowing && !isFollowers;

  const toggle = (id: string) => {
    const update = (items: ExpertConnection[]) =>
      items.map((item) => item.id === id ? { ...item, isFollowedByMe: !item.isFollowedByMe } : item);

    if (isFollowers) {
      setFollowers(update);
    } else if (onToggleFollowing) {
      onToggleFollowing(id);
    } else {
      setFollowing(update);
    }
  };

  return (
    <div className="relative flex h-full flex-col bg-surface">
      <div className="flex h-14 flex-shrink-0 items-center px-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[15px] font-medium text-foreground active:opacity-80">
          <ArrowLeft size={20} strokeWidth={2} />
          <span>Назад</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-5">
        <h1 className="mb-4 text-[24px] font-bold leading-8 text-gray-900">{title}</h1>
        {people.length > 0 ? (
          <div className="space-y-2.5">
            {people.map((user) => (
              <ConnectionRow
                key={user.id}
                user={user}
                onProfile={() => onProfileOpen(user)}
                onToggle={canEditConnections ? () => {
                  if (user.isFollowedByMe) {
                    setPendingUnfollow(user);
                  } else {
                    toggle(user.id);
                  }
                } : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl bg-white px-6 text-center">
            <p className="text-[14px] leading-5 text-gray-400">{emptyText}</p>
          </div>
        )}
      </div>
      {pendingUnfollow && (
        <HomeSheet title={`Отписаться от ${pendingUnfollow.name}?`} onClose={() => setPendingUnfollow(null)}>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setPendingUnfollow(null)} className="h-12 rounded-xl bg-gray-100 text-[15px] font-semibold text-gray-700">Отмена</button>
            <button type="button" onClick={() => { const id = pendingUnfollow.id; setPendingUnfollow(null); toggle(id); }} className="h-12 rounded-xl text-[15px] font-semibold text-white" style={{ backgroundColor: GREEN }}>Отписаться</button>
          </div>
        </HomeSheet>
      )}
    </div>
  );
}

export function ProfileScreen(props: {
  onNavigate: (s: Screen, from?: Screen) => void;
  onArticle: (a: Article) => void;
  onPlanOpen: (id: PlanId) => void;
  onConnectionsOpen: (type: ConnectionType) => void;
  onEdit: () => void;
  onOpenRewards?: () => void;
  onBack?: () => void;
  onAddPlan: () => void;
  onRemovePlan: (id: PlanId) => void;
  onToggleFollow?: (profile: ExpertProfile, nextFollowed: boolean) => void;
  onMessageProfile?: (peer: ChatPeer) => void;
  canMessage?: boolean;
  profile: ExpertProfile;
  plans: HomeFeedPlan[];
  isMe: boolean;
  plansLoading?: boolean;
  connectionsLoading?: boolean;
}) {
  void props.onArticle;
  void props.onNavigate;
  const [isFollowed, setIsFollowed] = useState(props.profile.isFollowedByMe);
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [isBioClamped, setIsBioClamped] = useState(false);
  const [showAllPlans, setShowAllPlans] = useState(false);
  const coinBalance = useCoinBalance(props.profile.id);
  const bioRef = useRef<HTMLParagraphElement | null>(null);
  const visiblePlans = showAllPlans ? props.plans : props.plans.slice(0, 3);
  const nearestPlans = props.plans
    .filter((plan) => !isSchedulePastRepeatEnd(plan.schedule))
    .sort((a, b) => getNextOccurrence(a.schedule).getTime() - getNextOccurrence(b.schedule).getTime());
  const visibleNearestPlans = showAllPlans ? nearestPlans : nearestPlans.slice(0, 2);
  const hasMorePlans = props.plans.length > visiblePlans.length;
  const hasMoreNearestPlans = nearestPlans.length > visibleNearestPlans.length;
  const coverUrls = props.profile.coverUrls === null ? [...DEFAULT_COVER_URLS] : props.profile.coverUrls ?? [];
  const resolvedCoverUrls = coverUrls.map(resolveCoverUrl);
  const heroImage = props.profile.photoUrl ?? resolvedCoverUrls[0] ?? null;
  const galleryItems = [
    ...(props.profile.photoUrls ?? []),
    ...resolvedCoverUrls,
  ];
  const monthShortByName: Record<string, string> = {
    января: "Янв",
    февраля: "Фев",
    марта: "Мар",
    апреля: "Апр",
    мая: "Май",
    июня: "Июн",
    июля: "Июл",
    августа: "Авг",
    сентября: "Сен",
    октября: "Окт",
    ноября: "Ноя",
    декабря: "Дек",
  };
  const profileInitials = props.profile.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  const measureBioClamp = useCallback(() => {
    const element = bioRef.current;
    if (!element) {
      setIsBioClamped(false);
      return;
    }

    const previousDisplay = element.style.getPropertyValue("display");
    const previousLineClamp = element.style.getPropertyValue("-webkit-line-clamp");
    const previousBoxOrient = element.style.getPropertyValue("-webkit-box-orient");
    const previousOverflow = element.style.getPropertyValue("overflow");

    element.style.setProperty("display", "-webkit-box");
    element.style.setProperty("-webkit-line-clamp", "2");
    element.style.setProperty("-webkit-box-orient", "vertical");
    element.style.setProperty("overflow", "hidden");

    setIsBioClamped(element.scrollHeight > element.clientHeight + 1);

    const restoreProperty = (property: string, value: string) => {
      if (value) {
        element.style.setProperty(property, value);
      } else {
        element.style.removeProperty(property);
      }
    };

    restoreProperty("display", previousDisplay);
    restoreProperty("-webkit-line-clamp", previousLineClamp);
    restoreProperty("-webkit-box-orient", previousBoxOrient);
    restoreProperty("overflow", previousOverflow);
  }, []);

  useEffect(() => {
    setIsFollowed(props.profile.isFollowedByMe);
  }, [props.profile.id, props.profile.isFollowedByMe]);

  useEffect(() => {
    setIsBioExpanded(false);
    const frame = window.requestAnimationFrame(measureBioClamp);
    return () => window.cancelAnimationFrame(frame);
  }, [measureBioClamp, props.profile.bio]);

  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measureBioClamp);
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, [measureBioClamp]);

  return (
    <div className="relative h-full overflow-y-auto" style={{ background: PLAN_DARK.bg }}>
      <div className="relative flex min-h-full flex-col">
        <div className="relative flex min-h-[82dvh] flex-col justify-end overflow-hidden">
          {heroImage ? (
            <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--secondary) 0%, var(--brand-bright) 100%)" }}>
              <span className="text-[62px] font-bold" style={{ color: GREEN }}>{profileInitials}</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/35 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/88 via-black/55 to-transparent" />

          {!props.isMe && props.onBack && (
            <button
              onClick={props.onBack}
              className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white active:opacity-85"
              aria-label="Назад"
            >
              <ArrowLeft size={21} strokeWidth={2.2} />
            </button>
          )}
          {props.isMe && (
            <button
              onClick={props.onEdit}
              className="absolute right-4 top-4 z-10 flex h-10 items-center gap-2 rounded-full bg-black/50 px-4 text-[14px] font-semibold text-white active:opacity-85"
            >
              <Edit3 size={16} strokeWidth={2} />
              Редактировать
            </button>
          )}

          <div className="relative z-10 px-4 pb-7 pt-24 text-center">
            <h1 className="text-[30px] font-bold leading-9 text-white">{props.profile.name}</h1>
            {props.profile.username && <p className="mt-1 text-[15px] text-white/70">@{props.profile.username}</p>}

            {!props.isMe && (
              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={() => {
                    if (isFollowed) {
                      setShowUnfollowConfirm(true);
                      return;
                    }
                    setIsFollowed(true);
                    props.onToggleFollow?.(props.profile, true);
                  }}
                  className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full text-[16px] font-semibold active:opacity-90"
                  style={isFollowed
                    ? { background: "rgba(255,255,255,0.16)", color: "#fff" }
                    : { background: "#fff", color: "#111" }}
                >
                  {isFollowed ? <Check size={17} strokeWidth={2.4} /> : null}
                  {isFollowed ? "В подписках" : "Follow"}
                </button>
                {props.canMessage !== false && (
                  <button
                    onClick={() => props.onMessageProfile?.(
                      props.profile.isDemo === true && !/^\d+$/.test(props.profile.id)
                        ? { id: props.profile.id, name: props.profile.name, avatarUrl: props.profile.photoUrl, cannedReplies: props.profile.cannedReplies, isDemo: true }
                        : { id: props.profile.id, name: props.profile.name, avatarUrl: props.profile.photoUrl, realUser: true },
                    )}
                    className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-full active:opacity-90"
                    style={{ background: "rgba(255,255,255,0.16)", color: "#fff" }}
                    aria-label="Написать"
                  >
                    <MessageCircle size={20} strokeWidth={2.1} />
                  </button>
                )}
              </div>
            )}

            <div className="mt-6 flex items-stretch">
              <button onClick={() => props.onConnectionsOpen("following")} className="flex flex-1 flex-col items-center active:opacity-70">
                <span className="text-[22px] font-bold leading-7 text-white">{props.connectionsLoading ? "—" : props.profile.followingCount}</span>
                <span className="mt-0.5 text-[12px] text-white/60">Подписки</span>
              </button>
              <div className="w-px self-center bg-white/15" style={{ height: 34 }} />
              <button onClick={() => props.onConnectionsOpen("followers")} className="flex flex-1 flex-col items-center active:opacity-70">
                <span className="text-[22px] font-bold leading-7 text-white">{props.connectionsLoading ? "—" : props.profile.followersCount}</span>
                <span className="mt-0.5 text-[12px] text-white/60">Подписчики</span>
              </button>
              <div className="w-px self-center bg-white/15" style={{ height: 34 }} />
              <div className="flex flex-1 flex-col items-center">
                <span className="text-[22px] font-bold leading-7 text-white">{props.profile.plansCount}</span>
                <span className="mt-0.5 text-[12px] text-white/60">Планы</span>
              </div>
            </div>

            {props.isMe && (
              <button
                type="button"
                onClick={props.onOpenRewards}
                className="mt-5 flex w-full items-center rounded-2xl px-4 py-4 text-left shadow-lg active:opacity-90"
                style={{ background: "linear-gradient(135deg, #00A89D 0%, #2FBFAF 100%)" }}
              >
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                  <Coins size={24} strokeWidth={2} />
                </span>
                <span className="ml-3 min-w-0 flex-1">
                  <span className="block text-[28px] font-bold leading-8 text-white">{coinBalance}</span>
                  <span className="block text-[13px] text-white/80">монеток</span>
                </span>
                <ChevronRight size={23} strokeWidth={2} className="text-white/85" />
              </button>
            )}

            {props.profile.bio && (
              <div className="mt-5 rounded-2xl p-4 text-left" style={{ background: "rgba(255,255,255,0.10)", border: "0.5px solid rgba(255,255,255,0.15)" }}>
                <p
                  ref={bioRef}
                  onClick={() => { if (!isBioExpanded && isBioClamped) setIsBioExpanded(true); }}
                  onKeyDown={(event) => {
                    if (!isBioExpanded && isBioClamped && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      setIsBioExpanded(true);
                    }
                  }}
                  role={!isBioExpanded && isBioClamped ? "button" : undefined}
                  tabIndex={!isBioExpanded && isBioClamped ? 0 : undefined}
                  className={`text-[14px] leading-5 text-white/85 ${!isBioExpanded && isBioClamped ? "cursor-pointer" : ""}`}
                  style={!isBioExpanded ? { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } : undefined}
                >
                  {props.profile.bio}
                </p>
                {isBioClamped && (
                  <button onClick={() => setIsBioExpanded((value) => !value)} className="mt-1 text-[13px] font-medium text-white/70">
                    {isBioExpanded ? "Свернуть" : "Подробнее"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <section className="relative z-10 flex-shrink-0 px-4 pb-8 pt-6" style={{ background: PLAN_DARK.bg }}>
          {galleryItems.length > 0 && (
            <div className="-mx-4 mb-7 flex gap-2.5 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none" }}>
              {galleryItems.map((photo, index) => (
                <img key={`${photo}-${index}`} src={photo} alt="" loading="lazy" decoding="async" className="h-[104px] w-[150px] flex-shrink-0 rounded-2xl object-cover" />
              ))}
            </div>
          )}

          {props.isMe ? (
            <div className="mt-7">
              <h2 className="mb-3 text-[19px] font-bold leading-6" style={{ color: PLAN_DARK.text }}>Ближайшие планы</h2>
              {props.plansLoading && visibleNearestPlans.length === 0 ? (
                <div className="rounded-xl px-4 py-6 text-center" style={{ background: PLAN_DARK.card }}>
                  <p className="text-[14px] leading-5" style={{ color: PLAN_DARK.textSecondary }}>Загружаем ближайшие планы…</p>
                </div>
              ) : visibleNearestPlans.length > 0 ? (
                <div className="space-y-2.5">
                  {visibleNearestPlans.map((plan) => {
                    const nearestDate = formatNearestDate(plan.schedule);
                    return (
                      <ProfilePlanCard
                        key={plan.id}
                        plan={plan}
                        dayNumber={nearestDate.dayNumber}
                        monthLabel={nearestDate.monthLabel}
                        scheduleMeta={plan.timeDate}
                        onOpen={() => props.onPlanOpen(plan.id)}
                      />
                    );
                  })}
                  {hasMoreNearestPlans && (
                    <button
                      onClick={() => setShowAllPlans(true)}
                      className="mt-1 flex h-11 w-full items-center justify-center rounded-xl text-[14px] font-semibold active:opacity-85"
                      style={{ background: PLAN_DARK.card, color: PLAN_DARK.text }}
                    >
                      Показать все
                    </button>
                  )}
                </div>
              ) : (
                <div className="rounded-xl px-4 py-6 text-center" style={{ background: PLAN_DARK.card }}>
                  <p className="text-[14px] leading-5" style={{ color: PLAN_DARK.textSecondary }}>Нет ближайших планов</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-7">
              <h2 className="mb-3 text-[19px] font-bold leading-6" style={{ color: PLAN_DARK.text }}>Планы</h2>
              {props.plans.length > 0 ? (
                <div className="space-y-2.5">
                  {visiblePlans.map((plan, index) => {
                    const nearestDate = formatNearestDate(plan.schedule);
                    return (
                      <ProfilePlanCard
                        key={plan.id}
                        plan={plan}
                        dayNumber={nearestDate.dayNumber}
                        monthLabel={nearestDate.monthLabel || (monthShortByName[weekDateMonths[index % weekDateMonths.length]] ?? weekDateMonths[index % weekDateMonths.length])}
                        scheduleMeta={`${plan.timeDate} · Активен`}
                        onOpen={() => props.onPlanOpen(plan.id)}
                      />
                    );
                  })}
                  {hasMorePlans && (
                    <button
                      onClick={() => setShowAllPlans(true)}
                      className="mt-1 flex h-11 w-full items-center justify-center rounded-xl text-[14px] font-semibold active:opacity-85"
                      style={{ background: PLAN_DARK.card, color: PLAN_DARK.text }}
                    >
                      Все планы
                    </button>
                  )}
                </div>
              ) : (
                <div className="rounded-xl px-4 py-8 text-center" style={{ background: PLAN_DARK.card }}>
                  <p className="text-[14px] leading-5" style={{ color: PLAN_DARK.textSecondary }}>Нет публичных планов</p>
                </div>
              )}
            </div>
          )}
        </section>
        {showUnfollowConfirm && (
          <HomeSheet title={`Отписаться от ${props.profile.name}?`} onClose={() => setShowUnfollowConfirm(false)}>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setShowUnfollowConfirm(false)} className="h-12 rounded-xl bg-gray-100 text-[15px] font-semibold text-gray-700">Отмена</button>
              <button type="button" onClick={() => { setShowUnfollowConfirm(false); setIsFollowed(false); props.onToggleFollow?.(props.profile, false); }} className="h-12 rounded-xl text-[15px] font-semibold text-white" style={{ backgroundColor: GREEN }}>Отписаться</button>
            </div>
          </HomeSheet>
        )}
      </div>
    </div>
  );
}
