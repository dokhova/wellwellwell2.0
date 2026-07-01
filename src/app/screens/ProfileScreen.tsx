import { useState } from "react";
import { ArrowLeft, Check, ChevronRight, Edit3, UserPlus } from "lucide-react";
import type { Article, Screen } from "@/app/types";
import { GREEN, GREEN_LIGHT } from "@/app/data/constants";
import {
  expertPlans,
  expertProfile,
  profileFollowers,
  profileFollowing,
  type ExpertConnection,
  type ExpertProfilePlan,
} from "@/app/data/profile";

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

function PlanCard({ plan, onOpen }: { plan: ExpertProfilePlan; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl bg-card p-3 text-left border border-border active:bg-black/[0.02]"
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: GREEN_LIGHT }}>
        <span className="text-[18px] font-bold leading-none" style={{ color: GREEN }}>
          {plan.title.slice(0, 1)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[15px] font-semibold leading-5 text-foreground">{plan.title}</h3>
        <p className="mt-1 truncate text-[12px] leading-4 text-muted-foreground">
          {plan.axis} · {plan.weeksCount ? `${plan.weeksCount} нед.` : "Бессрочно"} · {plan.participantsCount}+ участников
        </p>
      </div>
      <ChevronRight size={18} strokeWidth={2} className="flex-shrink-0 text-muted-foreground" />
    </button>
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
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onProfile}
      className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left active:opacity-90"
    >
      <Avatar user={user} />
      <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-gray-900">{user.name}</span>
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
    </button>
  );
}

export function ProfileConnectionsScreen({
  type,
  onBack,
  onProfileOpen,
}: {
  type: ConnectionType;
  onBack: () => void;
  onProfileOpen: () => void;
}) {
  const [followers, setFollowers] = useState(profileFollowers);
  const [following, setFollowing] = useState(profileFollowing);
  const isFollowers = type === "followers";
  const title = isFollowers ? "Подписчики" : "Подписки";
  const people = isFollowers ? followers : following;
  const emptyText = isFollowers ? "Пока никто не подписался" : "Вы ни на кого не подписаны";

  const toggle = (id: string) => {
    const update = (items: ExpertConnection[]) =>
      items.map((item) => item.id === id ? { ...item, isFollowedByMe: !item.isFollowedByMe } : item);

    if (isFollowers) {
      setFollowers(update);
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
                onToggle={() => toggle(user.id)}
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
  isMe: boolean;
}) {
  void props.onArticle;
  void props.onNavigate;
  const [isFollowed, setIsFollowed] = useState(expertProfile.isFollowedByMe);
  const sectionTitle = expertProfile.gender === "female" ? "Её планы" : expertProfile.gender === "male" ? "Его планы" : "Планы";

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="relative min-h-full pb-5">
        <div className="relative h-[280px] w-full overflow-hidden bg-gray-300">
          <img src={expertProfile.photoUrl} alt={expertProfile.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/42" />
          {props.isMe && (
            <button
              className="absolute right-4 top-4 flex h-10 items-center gap-2 rounded-full bg-black/50 px-4 text-[14px] font-semibold text-white active:opacity-85"
            >
              <Edit3 size={16} strokeWidth={2} />
              Редактировать
            </button>
          )}
        </div>

        <section className="relative -mt-9 rounded-t-[28px] bg-card px-5 pb-6 pt-6 shadow-[0_-12px_34px_rgba(0,0,0,0.10)]">
          <h1 className="text-[30px] font-bold leading-9 text-foreground">{expertProfile.name}</h1>
          <p
            className="mt-2 text-[15px] leading-5 text-muted-foreground"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {expertProfile.bio}
          </p>

          <div className="mt-5 flex items-center justify-between rounded-2xl bg-muted px-1">
            <ProfileStat value={expertProfile.followersCount} label="Подписчики" onClick={() => props.onConnectionsOpen("followers")} />
            <div className="h-9 w-px bg-border" />
            <ProfileStat value={expertProfile.followingCount} label="Подписки" onClick={() => props.onConnectionsOpen("following")} />
            <div className="h-9 w-px bg-border" />
            <ProfileStat value={expertProfile.plansCount} label="Планов" />
          </div>

          {!props.isMe && (
            <button
              onClick={() => setIsFollowed((value) => !value)}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border text-[15px] font-semibold active:opacity-90"
              style={isFollowed ? { backgroundColor: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" } : { backgroundColor: GREEN, borderColor: GREEN, color: "#fff" }}
            >
              {isFollowed ? <Check size={18} strokeWidth={2.4} /> : <UserPlus size={18} strokeWidth={2.2} />}
              {isFollowed ? "Вы подписаны" : "Подписаться"}
            </button>
          )}

          <div className="mt-7">
            <h2 className="mb-3 text-[19px] font-bold leading-6 text-foreground">{sectionTitle}</h2>
            {expertPlans.length > 0 ? (
              <div className="space-y-2.5">
                {expertPlans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} onOpen={() => props.onPlanOpen(plan.id)} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-muted px-4 py-8 text-center">
                <p className="text-[14px] leading-5 text-muted-foreground">Пока нет опубликованных планов</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
