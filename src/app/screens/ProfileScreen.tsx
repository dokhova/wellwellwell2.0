import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, Check, Edit3, Plus, Trash2, UserPlus } from "lucide-react";
import type { Article, HomeFeedPlan, Screen } from "@/app/types";
import { weekDates, weekDateMonths } from "@/app/data/calendar";
import { GREEN, GREEN_LIGHT } from "@/app/data/constants";
import { profileFollowers, profileFollowing, type ExpertConnection, type ExpertProfile } from "@/app/data/profile";
import { PlanListCard } from "@/app/screens/PlansScreen";

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
    return <img src={user.avatarUrl} alt={user.name} className="h-11 w-11 flex-shrink-0 rounded-full object-cover" />;
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
  onProfileOpen: () => void;
  canEditFollowing: boolean;
  followerItems?: ExpertConnection[];
  followingItems?: ExpertConnection[];
  onToggleFollowing?: (id: string) => void;
}) {
  const [followers, setFollowers] = useState(profileFollowers);
  const [following, setFollowing] = useState(profileFollowing);
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
    <div className="flex h-full flex-col bg-surface">
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
                onProfile={onProfileOpen}
                onToggle={canEditConnections ? () => toggle(user.id) : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl bg-white px-6 text-center">
            <p className="text-[14px] leading-5 text-gray-400">{emptyText}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProfileScreen(props: {
  onNavigate: (s: Screen, from?: Screen) => void;
  onArticle: (a: Article) => void;
  onPlanOpen: (id: number) => void;
  onConnectionsOpen: (type: ConnectionType) => void;
  onEdit: () => void;
  onBack?: () => void;
  onAddPlan: () => void;
  onRemovePlan: (id: number) => void;
  onToggleFollow?: (profile: ExpertProfile, nextFollowed: boolean) => void;
  profile: ExpertProfile;
  plans: HomeFeedPlan[];
  isMe: boolean;
}) {
  void props.onArticle;
  void props.onNavigate;
  const [isFollowed, setIsFollowed] = useState(props.profile.isFollowedByMe);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [showAllPlans, setShowAllPlans] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const shouldShowBioToggle = props.profile.bio.length > 100;
  const visiblePlans = showAllPlans ? props.plans : props.plans.slice(0, 3);
  const hasMorePlans = props.plans.length > visiblePlans.length;
  const photoUrls = props.profile.photoUrls?.length
    ? props.profile.photoUrls
    : props.profile.photoUrl
      ? [props.profile.photoUrl]
      : [];
  const hasPhotos = photoUrls.length > 0;
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
  const heroInitials = props.profile.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  const onPhotoSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedPhotoIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onPhotoSelect();
    emblaApi.on("select", onPhotoSelect);
    emblaApi.on("reInit", onPhotoSelect);
  }, [emblaApi, onPhotoSelect]);

  useEffect(() => {
    setIsFollowed(props.profile.isFollowedByMe);
  }, [props.profile.id, props.profile.isFollowedByMe]);

  return (
    <div className="h-full overflow-y-auto bg-card">
      <div className="relative flex min-h-full flex-col">
        <div className={`relative w-full overflow-hidden bg-gray-300 ${props.isMe ? "h-[56dvh] min-h-[430px] max-h-[560px]" : "h-[280px]"}`}>
          {hasPhotos ? (
            <div ref={emblaRef} className="h-full overflow-hidden">
              <div className="flex h-full">
                {photoUrls.map((photoUrl, index) => (
                  <div key={`${photoUrl}-${index}`} className="min-w-0 flex-[0_0_100%]">
                    <img src={photoUrl} alt={props.profile.name} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center" style={{ background: "linear-gradient(135deg, var(--secondary) 0%, var(--brand-bright) 100%)" }}>
              <span className="text-[62px] font-bold" style={{ color: GREEN }}>{heroInitials}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/42" />
          {photoUrls.length > 1 && (
            <div className="absolute bottom-16 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {photoUrls.map((_, index) => (
                <button
                  key={index}
                  onClick={() => emblaApi?.scrollTo(index)}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: selectedPhotoIndex === index ? 18 : 6,
                    backgroundColor: selectedPhotoIndex === index ? "#fff" : "rgba(255,255,255,0.55)",
                  }}
                  aria-label={`Фото ${index + 1}`}
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

        <section className="relative -mt-12 flex-shrink-0 rounded-t-[28px] bg-card px-5 pb-6 pt-6 shadow-[0_-16px_38px_rgba(0,0,0,0.14)]">
          <h1 className="text-[34px] font-bold leading-[38px] text-foreground">{props.profile.name}</h1>
          <div className="mt-2 flex items-start gap-2">
            <p
              className="min-w-0 flex-1 text-[15px] leading-5 text-muted-foreground"
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
          {shouldShowBioToggle && (
            <button
              onClick={() => setIsBioExpanded((value) => !value)}
              className="mt-1 text-[13px] font-medium"
              style={{ color: GREEN }}
            >
              {isBioExpanded ? "Свернуть" : "Подробнее"}
            </button>
          )}

          <div className="mt-5 flex items-center justify-between rounded-2xl bg-muted px-1">
            <ProfileStat value={props.profile.followersCount} label="Подписчики" onClick={() => props.onConnectionsOpen("followers")} />
            <div className="h-9 w-px bg-border" />
            <ProfileStat value={props.profile.followingCount} label="Подписки" onClick={() => props.onConnectionsOpen("following")} />
          </div>

          {!props.isMe && (
            <button
              onClick={() => setIsFollowed((value) => {
                props.onToggleFollow?.(props.profile, !value);
                return !value;
              })}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border text-[15px] font-semibold active:opacity-90"
              style={isFollowed ? { backgroundColor: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" } : { backgroundImage: "linear-gradient(90deg, #00887F, #00A99D, #4DD0C4)", borderColor: GREEN, color: "#fff" }}
            >
              {isFollowed ? <Check size={18} strokeWidth={2.4} /> : <UserPlus size={18} strokeWidth={2.2} />}
              {isFollowed ? "Вы подписаны" : "Подписаться"}
            </button>
          )}

          {props.isMe ? (
            <div className="mt-7">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-[19px] font-bold leading-6 text-foreground">Мои планы</h2>
                <button
                  onClick={props.onAddPlan}
                  className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-white active:opacity-90"
                  style={{ backgroundColor: GREEN }}
                >
                  <Plus size={15} strokeWidth={2.4} />
                  Добавить
                </button>
              </div>
              {props.plans.length > 0 ? (
                <div className="space-y-2.5">
                  {visiblePlans.map((plan, index) => (
                    <div key={plan.id} className="relative">
                      <PlanListCard
                        plan={plan}
                        dayNumber={weekDates[index % weekDates.length]}
                        monthLabel={monthShortByName[weekDateMonths[index % weekDateMonths.length]] ?? weekDateMonths[index % weekDateMonths.length]}
                        scheduleMeta={`${plan.timeDate} · Активен`}
                        onOpen={() => props.onPlanOpen(plan.id)}
                        showToggle={false}
                      />
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          props.onRemovePlan(plan.id);
                        }}
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-card text-muted-foreground active:opacity-80"
                        aria-label="Удалить план"
                      >
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                    </div>
                  ))}
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
                <div className="flex justify-end">
                  <button
                    onClick={props.onAddPlan}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-white active:opacity-90"
                    style={{ backgroundColor: GREEN }}
                    aria-label="Добавить план"
                  >
                    <Plus size={17} strokeWidth={2.4} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-7">
              <h2 className="mb-3 text-[19px] font-bold leading-6 text-foreground">Планы</h2>
              {props.plans.length > 0 ? (
                <div className="space-y-2.5">
                  {visiblePlans.map((plan, index) => (
                    <PlanListCard
                      key={plan.id}
                      plan={plan}
                      dayNumber={weekDates[index % weekDates.length]}
                      monthLabel={monthShortByName[weekDateMonths[index % weekDateMonths.length]] ?? weekDateMonths[index % weekDateMonths.length]}
                      scheduleMeta={`${plan.timeDate} · Активен`}
                      onOpen={() => props.onPlanOpen(plan.id)}
                      showToggle={false}
                    />
                  ))}
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
                  <p className="text-[14px] leading-5 text-muted-foreground">Пока нет опубликованных планов</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
