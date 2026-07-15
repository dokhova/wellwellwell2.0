import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, Check, Edit3, MessageCircle, UserPlus } from "lucide-react";
import type { Article, ChatPeer, HomeFeedPlan, PlanId, Screen } from "@/app/types";
import { formatNearestDate, getNextOccurrence, weekDateMonths } from "@/app/data/calendar";
import { GREEN, GREEN_LIGHT } from "@/app/data/constants";
import { DEFAULT_COVER_URLS, profileFollowers, profileFollowing, resolveCoverUrl, type ExpertConnection, type ExpertProfile } from "@/app/data/profile";
import { PlanListCard } from "@/app/screens/PlansScreen";
import { HomeSheet } from "@/app/components/HomeSheet";
import { isSchedulePastRepeatEnd } from "@/app/lib/schedule";

export type ConnectionType = "followers" | "following";

function ProfileStat({
  value,
  label,
  onClick,
}: {
  value: number;
  label: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="text-[20px] font-bold leading-6 text-foreground">{value}</span>
      <span className="mt-1 text-[12px] leading-4 text-muted-foreground">{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="flex min-w-0 flex-1 flex-col items-center rounded-xl px-2 py-2.5 active:bg-black/5"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center px-2 py-2.5">
      {content}
    </div>
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
  onBack?: () => void;
  onAddPlan: () => void;
  onRemovePlan: (id: PlanId) => void;
  onToggleFollow?: (profile: ExpertProfile, nextFollowed: boolean) => void;
  onMessageProfile?: (peer: ChatPeer) => void;
  canMessage?: boolean;
  profile: ExpertProfile;
  plans: HomeFeedPlan[];
  isMe: boolean;
}) {
  void props.onArticle;
  void props.onNavigate;
  const [isFollowed, setIsFollowed] = useState(props.profile.isFollowedByMe);
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [isBioClamped, setIsBioClamped] = useState(false);
  const [showAllPlans, setShowAllPlans] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const bioRef = useRef<HTMLParagraphElement | null>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const visiblePlans = showAllPlans ? props.plans : props.plans.slice(0, 3);
  const nearestPlans = props.plans
    .filter((plan) => !isSchedulePastRepeatEnd(plan.schedule))
    .sort((a, b) => getNextOccurrence(a.schedule).getTime() - getNextOccurrence(b.schedule).getTime());
  const visibleNearestPlans = showAllPlans ? nearestPlans : nearestPlans.slice(0, 2);
  const hasMorePlans = props.plans.length > visiblePlans.length;
  const hasMoreNearestPlans = nearestPlans.length > visibleNearestPlans.length;
  const coverUrls = props.profile.coverUrls === null ? [...DEFAULT_COVER_URLS] : props.profile.coverUrls ?? [];
  const resolvedCoverUrls = coverUrls.map(resolveCoverUrl);
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

  const onPhotoSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedPhotoIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

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
    if (!emblaApi) return;
    onPhotoSelect();
    emblaApi.on("select", onPhotoSelect);
    emblaApi.on("reInit", onPhotoSelect);
  }, [emblaApi, onPhotoSelect]);

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
    <div className="relative h-full overflow-y-auto bg-card">
      <div className="relative flex min-h-full flex-col">
        <div className="relative aspect-[3/4] w-full max-h-[45dvh] overflow-hidden bg-gray-300">
          {resolvedCoverUrls.length > 0 ? (
            <div ref={emblaRef} className="h-full overflow-hidden">
              <div className="flex h-full">
                {resolvedCoverUrls.map((coverUrl, index) => (
                  <div key={`${coverUrl}-${coverUrls[index]}-${index}`} className="min-w-0 flex-[0_0_100%]">
                    <img loading="lazy" decoding="async" src={coverUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center" style={{ background: "linear-gradient(135deg, var(--secondary) 0%, var(--brand-bright) 100%)" }}>
              <span className="text-[62px] font-bold" style={{ color: GREEN }}>{profileInitials}</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/28 to-transparent" />
          {resolvedCoverUrls.length > 1 && (
            <div className="absolute bottom-9 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {resolvedCoverUrls.map((_, index) => (
                <button
                  key={index}
                  onClick={() => emblaApi?.scrollTo(index)}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: selectedPhotoIndex === index ? 18 : 6,
                    backgroundColor: selectedPhotoIndex === index ? "#fff" : "rgba(255,255,255,0.55)",
                  }}
                  aria-label={`Обложка ${index + 1}`}
                />
              ))}
            </div>
          )}
          {!props.isMe && props.onBack && (
            <button
              onClick={props.onBack}
              className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white active:opacity-85"
              aria-label="Назад"
            >
              <ArrowLeft size={21} strokeWidth={2.2} />
            </button>
          )}
          {props.isMe && (
            <button
              onClick={props.onEdit}
              className="absolute right-4 top-4 flex h-10 items-center gap-2 rounded-full bg-black/50 px-4 text-[14px] font-semibold text-white active:opacity-85"
            >
              <Edit3 size={16} strokeWidth={2} />
              Редактировать
            </button>
          )}
        </div>

        <section className="relative -mt-[28px] flex-shrink-0 rounded-t-[28px] bg-card px-5 pb-6 pt-0 shadow-[0_-16px_38px_rgba(0,0,0,0.10)]">
          <div className="flex items-start justify-between gap-3">
            <div className="-mt-[44px] h-[88px] w-[88px] overflow-hidden rounded-full bg-secondary ring-4 ring-card">
              {props.profile.photoUrl ? (
                <img loading="lazy" decoding="async" src={props.profile.photoUrl} alt={props.profile.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: GREEN_LIGHT }}>
                  <span className="text-[26px] font-bold" style={{ color: GREEN }}>{profileInitials}</span>
                </div>
              )}
            </div>
            {!props.isMe && (
              <button
                onClick={() => {
                  if (isFollowed) {
                    setShowUnfollowConfirm(true);
                    return;
                  }
                  setIsFollowed(true);
                  props.onToggleFollow?.(props.profile, true);
                }}
                className="mt-4 flex h-10 flex-shrink-0 items-center justify-center gap-1.5 rounded-full border px-5 text-[14px] font-semibold active:opacity-90"
                style={isFollowed ? { backgroundColor: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" } : { backgroundImage: "linear-gradient(90deg, #00887F, #00A99D, #4DD0C4)", borderColor: GREEN, color: "#fff" }}
              >
                {isFollowed ? <Check size={16} strokeWidth={2.4} /> : <UserPlus size={16} strokeWidth={2.2} />}
                {isFollowed ? "В подписках" : "Подписаться"}
              </button>
            )}
          </div>

          <h1 className="mt-3 text-[26px] font-bold leading-8 text-foreground">{props.profile.name}</h1>
          <div className="mt-2 flex items-start gap-2">
            <p
              ref={bioRef}
              onClick={() => {
                if (!isBioExpanded && isBioClamped) setIsBioExpanded(true);
              }}
              onKeyDown={(event) => {
                if (!isBioExpanded && isBioClamped && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  setIsBioExpanded(true);
                }
              }}
              role={!isBioExpanded && isBioClamped ? "button" : undefined}
              tabIndex={!isBioExpanded && isBioClamped ? 0 : undefined}
              className={`min-w-0 flex-1 text-[15px] leading-5 text-muted-foreground ${!isBioExpanded && isBioClamped ? "cursor-pointer" : ""}`}
              style={!isBioExpanded ? {
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              } : undefined}
            >
              {props.profile.bio}
            </p>
          </div>
          {isBioClamped && (
            <button
              onClick={() => setIsBioExpanded((value) => !value)}
              className="mt-1 text-[13px] font-medium"
              style={{ color: GREEN }}
            >
              {isBioExpanded ? "Свернуть" : "Подробнее"}
            </button>
          )}
          {props.profile.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {props.profile.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-3 py-1.5 text-[13px] font-medium text-foreground">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex items-center justify-between rounded-2xl bg-muted px-1">
            <ProfileStat value={props.profile.followersCount} label="Подписчики" onClick={() => props.onConnectionsOpen("followers")} />
            <div className="h-9 w-px bg-border" />
            <ProfileStat value={props.profile.followingCount} label="Подписки" onClick={() => props.onConnectionsOpen("following")} />
          </div>

          {!props.isMe && props.canMessage !== false && (
            <div className="mt-5">
              <button
                onClick={() => props.onMessageProfile?.(
                  props.profile.isDemo === true && !/^\d+$/.test(props.profile.id)
                    ? { id: props.profile.id, name: props.profile.name, avatarUrl: props.profile.photoUrl, cannedReplies: props.profile.cannedReplies, isDemo: true }
                    : { id: props.profile.id, name: props.profile.name, avatarUrl: props.profile.photoUrl, realUser: true },
                )}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border text-[15px] font-semibold active:opacity-90"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <MessageCircle size={18} strokeWidth={2.1} />
                Написать
              </button>
            </div>
          )}

          {props.isMe ? (
            <div className="mt-7">
              <h2 className="mb-3 text-[19px] font-bold leading-6 text-foreground">Ближайшие планы</h2>
              {visibleNearestPlans.length > 0 ? (
                <div className="space-y-2.5">
                  {visibleNearestPlans.map((plan) => {
                    const nearestDate = formatNearestDate(plan.schedule);
                    return (
                      <PlanListCard
                        key={plan.id}
                        plan={plan}
                        dayNumber={nearestDate.dayNumber}
                        monthLabel={nearestDate.monthLabel}
                        scheduleMeta={plan.timeDate}
                        onOpen={() => props.onPlanOpen(plan.id)}
                        showToggle={false}
                      />
                    );
                  })}
                  {hasMoreNearestPlans && (
                    <button
                      onClick={() => setShowAllPlans(true)}
                      className="mt-1 flex h-11 w-full items-center justify-center rounded-xl bg-muted text-[14px] font-semibold text-foreground active:opacity-85"
                    >
                      Показать все
                    </button>
                  )}
                </div>
              ) : (
                <div className="rounded-xl bg-muted px-4 py-6 text-center">
                  <p className="text-[14px] leading-5 text-muted-foreground">Нет ближайших планов</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-7">
              <h2 className="mb-3 text-[19px] font-bold leading-6 text-foreground">Планы</h2>
              {props.plans.length > 0 ? (
                <div className="space-y-2.5">
                  {visiblePlans.map((plan, index) => {
                    const nearestDate = formatNearestDate(plan.schedule);
                    return (
                      <PlanListCard
                        key={plan.id}
                        plan={plan}
                        dayNumber={nearestDate.dayNumber}
                        monthLabel={nearestDate.monthLabel || (monthShortByName[weekDateMonths[index % weekDateMonths.length]] ?? weekDateMonths[index % weekDateMonths.length])}
                        scheduleMeta={`${plan.timeDate} · Активен`}
                        onOpen={() => props.onPlanOpen(plan.id)}
                        showToggle={false}
                      />
                    );
                  })}
                  {hasMorePlans && (
                    <button
                      onClick={() => setShowAllPlans(true)}
                      className="mt-1 flex h-11 w-full items-center justify-center rounded-xl bg-muted text-[14px] font-semibold text-foreground active:opacity-85"
                    >
                      Все планы
                    </button>
                  )}
                </div>
              ) : (
                <div className="rounded-xl bg-muted px-4 py-8 text-center">
                  <p className="text-[14px] leading-5 text-muted-foreground">Нет публичных планов</p>
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
