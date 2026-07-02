import { ArrowLeft, Calendar, CheckCircle2, Home, Plus, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Article, HomeFeedPlan, Screen } from "@/app/types";
import { NO_BOTTOM_NAV, GREEN } from "@/app/data/constants";
import { formatNearestDate } from "@/app/data/calendar";
import { experts, expertProfile, type ExpertConnection, type ExpertProfile } from "@/app/data/profile";
import { homeFeedPlans } from "@/app/data/plans";
import { getTelegramUser, initTelegram } from "@/app/lib/telegram";
import { HomeScreen } from "@/app/screens/HomeScreen";
import { PlanListCard, PlansScreen } from "@/app/screens/PlansScreen";
import { CreateScreen, type CreatedPlanResult } from "@/app/screens/CreateScreen";
import { DetailScreen } from "@/app/screens/DetailScreen";
import { ArticleScreen } from "@/app/screens/ArticleScreen";
import { SearchScreen } from "@/app/screens/SearchScreen";
import { ProfileConnectionsScreen, ProfileScreen, type ConnectionType } from "@/app/screens/ProfileScreen";
import { EditProfileScreen } from "@/app/screens/EditProfileScreen";
import { EventDetailScreen } from "@/app/screens/EventDetailScreen";
import { WorkInProgress } from "@/app/components/WorkInProgress";

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

const normalizeProfile = (profile: ExpertProfile): ExpertProfile => {
  const photoUrls = profile.photoUrls?.length ? profile.photoUrls : profile.photoUrl ? [profile.photoUrl] : [];
  return {
    ...profile,
    photoUrls,
    photoUrl: photoUrls[0] ?? null,
  };
};

const buildTelegramProfile = (telegramUser: ReturnType<typeof getTelegramUser>): ExpertProfile => {
  const name = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(" ").trim();
  const photoUrls = telegramUser.photo_url ? [telegramUser.photo_url] : [];

  return {
    ...expertProfile,
    id: String(telegramUser.id),
    telegramId: telegramUser.id,
    username: telegramUser.username,
    name: name || expertProfile.name,
    bio: "",
    photoUrl: photoUrls[0] ?? null,
    photoUrls,
    plansCount: 0,
    isMe: true,
    isFollowedByMe: false,
  };
};

function AddPlanScreen({
  plans,
  selectedPlanIds,
  onBack,
  onAddPlan,
}: {
  plans: HomeFeedPlan[];
  selectedPlanIds: number[];
  onBack: () => void;
  onAddPlan: (id: number) => void;
}) {
  const selected = new Set(selectedPlanIds);

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-14 flex-shrink-0 items-center px-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[15px] font-medium text-foreground active:opacity-80">
          <ArrowLeft size={20} strokeWidth={2} />
          <span>Назад</span>
        </button>
        <h1 className="ml-4 text-[18px] font-bold text-foreground">Добавить план</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-5">
        <div className="space-y-2.5">
          {plans.map((plan) => {
            const isAdded = selected.has(plan.id);
            const nearestDate = formatNearestDate(plan.schedule);
            return (
              <div key={plan.id} className="relative">
                <PlanListCard
                  plan={plan}
                  dayNumber={nearestDate.dayNumber}
                  monthLabel={nearestDate.monthLabel}
                  scheduleMeta={plan.timeDate}
                  showToggle={false}
                  onOpen={() => {
                    if (!isAdded) onAddPlan(plan.id);
                  }}
                />
                <button
                  onClick={() => {
                    if (!isAdded) onAddPlan(plan.id);
                  }}
                  disabled={isAdded}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border bg-card disabled:opacity-70"
                  style={{ borderColor: isAdded ? GREEN : "var(--border)", color: isAdded ? GREEN : "var(--foreground)" }}
                  aria-label={isAdded ? "План добавлен" : "Добавить план"}
                >
                  {isAdded ? <CheckCircle2 size={18} strokeWidth={2.2} /> : <Plus size={18} strokeWidth={2.2} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const telegramUser = useMemo(() => getTelegramUser(), []);
  const storagePrefix = `wellwellwell:${telegramUser.id}`;
  const profileStorageKey = `${storagePrefix}:profile`;
  const myPlansStorageKey = `${storagePrefix}:myPlans`;
  const checkedItemsStorageKey = `${storagePrefix}:checkedItems`;
  const createdPlansStorageKey = `${storagePrefix}:createdPlans`;
  const followingStorageKey = `${storagePrefix}:following`;

  const [screen, setScreen] = useState<Screen>("home");
  const [detailOrigin, setDetailOrigin] = useState<Screen>("plans");
  const [createOrigin, setCreateOrigin] = useState<Screen>("plans");
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [articleOrigin, setArticleOrigin] = useState<Screen>("home");
  const [activePlanId, setActivePlanId] = useState<number>(1);
  const [planEventOrigin, setPlanEventOrigin] = useState<Screen>("plans");
  const [previousScreen, setPreviousScreen] = useState<Screen>("plans");
  const [profileConnectionsType, setProfileConnectionsType] = useState<ConnectionType>("followers");
  const [profileConnectionsCanEditFollowing, setProfileConnectionsCanEditFollowing] = useState(false);
  const [viewingOwnProfile, setViewingOwnProfile] = useState(true);
  const [viewingExpertId, setViewingExpertId] = useState("gena");
  const [editableProfile, setEditableProfile] = useState<ExpertProfile>(() =>
    normalizeProfile(readJson(profileStorageKey, buildTelegramProfile(telegramUser)))
  );
  const [myPlanIds, setMyPlanIds] = useState<number[]>(() => readJson(myPlansStorageKey, []));
  const [checkedItemKeys, setCheckedItemKeys] = useState<string[]>(() => readJson(checkedItemsStorageKey, []));
  const [createdPlans, setCreatedPlans] = useState<HomeFeedPlan[]>(() => readJson(createdPlansStorageKey, []));
  const [myFollowing, setMyFollowing] = useState<ExpertConnection[]>(() => readJson(followingStorageKey, []));
  const currentUserId = editableProfile.id;
  const allPlans = [...createdPlans, ...homeFeedPlans];
  const myPlans = allPlans.filter((plan) => myPlanIds.includes(plan.id));

  useEffect(() => initTelegram(), []);

  useEffect(() => {
    writeJson(profileStorageKey, editableProfile);
  }, [editableProfile, profileStorageKey]);

  useEffect(() => {
    writeJson(myPlansStorageKey, myPlanIds);
    setEditableProfile((profile) => ({ ...profile, plansCount: myPlanIds.length }));
  }, [myPlanIds, myPlansStorageKey]);

  useEffect(() => {
    writeJson(checkedItemsStorageKey, checkedItemKeys);
  }, [checkedItemKeys, checkedItemsStorageKey]);

  useEffect(() => {
    writeJson(createdPlansStorageKey, createdPlans);
  }, [createdPlans, createdPlansStorageKey]);

  useEffect(() => {
    writeJson(followingStorageKey, myFollowing);
    setEditableProfile((profile) => ({ ...profile, followersCount: 0, followingCount: myFollowing.length }));
  }, [followingStorageKey, myFollowing]);

  const navigate = (s: Screen, from?: Screen) => {
    if (s === "detail" && from) setDetailOrigin(from);
    if (s === "create" && from) setCreateOrigin(from);
    if (s === "profile") setViewingOwnProfile(!from);
    setPreviousScreen(screen);
    setScreen(s);
  };

  const openArticle = (a: Article, from: Screen) => {
    setActiveArticle(a);
    setArticleOrigin(from);
    setScreen("article");
  };

  const openPlanEvent = (id: number, from: Screen = "plans") => {
    setActivePlanId(id);
    setPlanEventOrigin(from);
    setPreviousScreen(screen);
    setScreen("planEvent");
  };

  const openExpertProfile = (expertId: string) => {
    setViewingExpertId(expertId);
    setViewingOwnProfile(false);
    setPreviousScreen(screen);
    setScreen("profile");
  };

  const openProfileConnections = (type: ConnectionType, ownerIsCurrentUser = false) => {
    setProfileConnectionsType(type);
    setProfileConnectionsCanEditFollowing(ownerIsCurrentUser);
    setPreviousScreen(screen);
    setScreen("profileConnections");
  };

  const addCatalogPlanToRoutine = (id: number) => {
    setMyPlanIds((ids) => ids.includes(id) ? ids : [id, ...ids]);
  };

  const addPlanToMine = (id: number) => {
    addCatalogPlanToRoutine(id);
    setViewingOwnProfile(true);
    setScreen("profile");
  };

  const removePlanFromMine = (id: number) => {
    setMyPlanIds((ids) => ids.filter((planId) => planId !== id));
    setCheckedItemKeys((keys) => keys.filter((key) => !key.endsWith(`:${id}`)));
  };

  const toggleCheckedItem = (key: string) => {
    setCheckedItemKeys((keys) => keys.includes(key) ? keys.filter((item) => item !== key) : [...keys, key]);
  };

  const createPlan = (plans: HomeFeedPlan[], result: CreatedPlanResult) => {
    console.log(result);
    const ids = plans.map((plan) => plan.id);
    setCreatedPlans((items) => [...plans, ...items.filter((item) => !ids.includes(item.id))]);
    setMyPlanIds((items) => [...ids, ...items.filter((id) => !ids.includes(id))]);
    setViewingOwnProfile(true);
  };

  const toggleFollowing = (profile: ExpertProfile, nextFollowed: boolean) => {
    setMyFollowing((items) => {
      if (!nextFollowed) return items.filter((item) => item.id !== profile.id);
      if (items.some((item) => item.id === profile.id)) return items;
      return [{ id: profile.id, name: profile.name, avatarUrl: profile.photoUrl, isFollowedByMe: true }, ...items];
    });
  };

  const renderScreen = () => {
    switch (screen) {
      case "home":
        return <HomeScreen onNavigate={navigate} onPlanOpen={openPlanEvent} onAuthorOpen={openExpertProfile} />;
      case "plans":
        return (
          <PlansScreen
            onNavigate={navigate}
            onPlanOpen={openPlanEvent}
            plans={myPlans}
            checkedItemKeys={checkedItemKeys}
            onToggleCheck={toggleCheckedItem}
          />
        );
      case "create":
        return <CreateScreen onNavigate={navigate} backTo={createOrigin} onCreatePlan={createPlan} />;
      case "detail":
        return <DetailScreen onNavigate={navigate} backTo={detailOrigin} />;
      case "article":
        return activeArticle
          ? <ArticleScreen article={activeArticle} onBack={() => setScreen(articleOrigin)} onProfile={() => openExpertProfile("gena")} />
          : null;
      case "search":
        return <SearchScreen onBack={() => setScreen("home")} onArticle={a => openArticle(a, "search")} />;
      case "profile":
        const baseViewedProfile = viewingOwnProfile
          ? editableProfile
          : experts.find((expert) => expert.id === viewingExpertId) ?? expertProfile;
        const viewedProfile = viewingOwnProfile
          ? baseViewedProfile
          : { ...baseViewedProfile, isFollowedByMe: myFollowing.some((item) => item.id === baseViewedProfile.id) };
        const isCurrentUserProfile = viewedProfile.id === currentUserId;
        const viewedPlans = isCurrentUserProfile
          ? myPlans
          : allPlans.filter((plan) => (plan.author.id ?? currentUserId) === viewedProfile.id);
        return (
          <ProfileScreen
            onNavigate={navigate}
            onArticle={a => openArticle(a, "profile" as Screen)}
            onPlanOpen={id => { openPlanEvent(id, "profile"); }}
            onConnectionsOpen={(type) => openProfileConnections(type, isCurrentUserProfile)}
            onEdit={() => setScreen("editProfile")}
            onBack={() => setScreen(previousScreen)}
            onAddPlan={() => setScreen("addPlan")}
            onRemovePlan={removePlanFromMine}
            onToggleFollow={toggleFollowing}
            profile={viewedProfile}
            plans={viewedPlans}
            isMe={isCurrentUserProfile}
          />
        );
      case "editProfile":
        return (
          <EditProfileScreen
            profile={editableProfile}
            onBack={() => setScreen("profile")}
            onSave={(profile) => {
              setEditableProfile(profile);
              setScreen("profile");
            }}
          />
        );
      case "addPlan":
        return (
          <AddPlanScreen
            plans={allPlans}
            selectedPlanIds={myPlanIds}
            onBack={() => setScreen("profile")}
            onAddPlan={addPlanToMine}
          />
        );
      case "profileConnections":
        return (
          <ProfileConnectionsScreen
            type={profileConnectionsType}
            onBack={() => setScreen(previousScreen)}
            onProfileOpen={() => setScreen("profile")}
            canEditFollowing={profileConnectionsCanEditFollowing}
            followerItems={profileConnectionsCanEditFollowing ? [] : undefined}
            followingItems={myFollowing}
            onToggleFollowing={(id) => setMyFollowing((items) => items.filter((item) => item.id !== id))}
          />
        );
      case "planEvent": {
        const feedPlan = allPlans.find(plan => plan.id === activePlanId);
        if (feedPlan) {
          const participantsCount = Number.parseInt(feedPlan.participantsLabel, 10) || feedPlan.participants.length;
          return (
            <EventDetailScreen
              title={feedPlan.isChallenge ? `Челлендж: ${feedPlan.title}` : feedPlan.title}
              coverSrc={feedPlan.coverUrl as string | undefined}
              backgroundGradient={feedPlan.gradient}
              tag={feedPlan.tag}
              schedule={feedPlan.schedule}
              shareUrl={feedPlan.shareUrl}
              participantAvatars={feedPlan.participants}
              participantsLabel={feedPlan.participantsLabel}
              authorName={feedPlan.author.name}
              authorAvatarUrl={feedPlan.author.avatarUrl}
              badgeDate={feedPlan.timeDate}
              paragraphs={[feedPlan.description]}
              meta={{
                date: feedPlan.timeDate,
                time: feedPlan.timeDate,
                location: feedPlan.address ?? "",
                locationSub: "",
                participants: participantsCount,
                plusN: participantsCount > feedPlan.participants.length ? `+${participantsCount - feedPlan.participants.length}` : "",
                joinLabel: "Присоединиться",
              }}
              format={feedPlan.format}
              duration={feedPlan.duration}
              onBack={() => setScreen(planEventOrigin)}
              planId={feedPlan.id}
              initiallyJoined={myPlanIds.includes(feedPlan.id)}
              onJoin={addCatalogPlanToRoutine}
              onLeave={removePlanFromMine}
              onProfile={() => openExpertProfile(feedPlan.author.id ?? "gena")}
            />
          );
        }
        return <WorkInProgress />;
      }
    }
  };

  const showNav = !NO_BOTTOM_NAV.includes(screen);

  return (
    <div
      className="flex flex-col w-full h-screen overflow-hidden bg-white"
      style={{ fontFamily: "var(--font-sans)", height: "100dvh" }}
    >
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {renderScreen()}
      </div>
      {showNav && (
        <div className={`flex-shrink-0 flex items-center justify-around bg-white px-2 pb-safe pt-2 ${screen === "profile" ? "" : "border-t border-gray-200"}`}
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
        >
          {([
            { id: "home" as Screen, label: "Главная", Icon: Home },
            { id: "plans" as Screen, label: "Мои планы", Icon: Calendar },
            { id: "create" as Screen, label: "Создать", Icon: Plus },
            { id: "profile" as Screen, label: "Профиль", Icon: User },
          ] as { id: Screen; label: string; Icon: React.FC<{ size: number; strokeWidth: number; color: string }> }[]).map(({ id, label, Icon }) => {
            const isActive = screen === id || (id === "plans" && (screen === "detail" || screen === "planEvent")) || (id === "home" && screen === "search");
            return (
              <button key={id} onClick={() => navigate(id)} className="flex flex-col items-center gap-0.5 px-4 py-1">
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.7} color={isActive ? GREEN : "#9CA3AF"} />
                <span className="text-[11px] font-medium" style={{ color: isActive ? GREEN : "#9CA3AF" }}>{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
