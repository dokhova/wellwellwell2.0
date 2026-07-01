import { Calendar, Home, Plus, User } from "lucide-react";
import { useState } from "react";
import type { Article, Screen } from "@/app/types";
import { NO_BOTTOM_NAV, GREEN } from "@/app/data/constants";
import { experts, expertProfile, type ExpertProfile } from "@/app/data/profile";
import { homeFeedPlans } from "@/app/data/plans";
import { HomeScreen } from "@/app/screens/HomeScreen";
import { PlansScreen } from "@/app/screens/PlansScreen";
import { CreateScreen } from "@/app/screens/CreateScreen";
import { DetailScreen } from "@/app/screens/DetailScreen";
import { ArticleScreen } from "@/app/screens/ArticleScreen";
import { SearchScreen } from "@/app/screens/SearchScreen";
import { ProfileConnectionsScreen, ProfileScreen, type ConnectionType } from "@/app/screens/ProfileScreen";
import { EditProfileScreen } from "@/app/screens/EditProfileScreen";
import { EventDetailScreen } from "@/app/screens/EventDetailScreen";
import { WorkInProgress } from "@/app/components/WorkInProgress";

export default function App() {
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
  const [editableProfile, setEditableProfile] = useState<ExpertProfile>(expertProfile);
  const currentUserId = editableProfile.id;

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

  const renderScreen = () => {
    switch (screen) {
      case "home":
        return <HomeScreen onNavigate={navigate} onPlanOpen={openPlanEvent} onAuthorOpen={openExpertProfile} />;
      case "plans":
        return <PlansScreen onNavigate={navigate} onPlanOpen={openPlanEvent} />;
      case "create":
        return <CreateScreen onNavigate={navigate} backTo={createOrigin} />;
      case "detail":
        return <DetailScreen onNavigate={navigate} backTo={detailOrigin} />;
      case "article":
        return activeArticle
          ? <ArticleScreen article={activeArticle} onBack={() => setScreen(articleOrigin)} onProfile={() => openExpertProfile("gena")} />
          : null;
      case "search":
        return <SearchScreen onBack={() => setScreen("home")} onArticle={a => openArticle(a, "search")} />;
      case "profile":
        const viewedProfile = viewingOwnProfile
          ? editableProfile
          : experts.find((expert) => expert.id === viewingExpertId) ?? expertProfile;
        const isCurrentUserProfile = viewedProfile.id === currentUserId;
        const viewedPlans = homeFeedPlans.filter((plan) => (plan.author.id ?? currentUserId) === viewedProfile.id);
        return (
          <ProfileScreen
            onNavigate={navigate}
            onArticle={a => openArticle(a, "profile" as Screen)}
            onPlanOpen={id => { openPlanEvent(id, "profile"); }}
            onConnectionsOpen={(type) => openProfileConnections(type, isCurrentUserProfile)}
            onEdit={() => setScreen("editProfile")}
            onBack={() => setScreen(previousScreen)}
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
      case "profileConnections":
        return (
          <ProfileConnectionsScreen
            type={profileConnectionsType}
            onBack={() => setScreen(previousScreen)}
            onProfileOpen={() => setScreen("profile")}
            canEditFollowing={profileConnectionsCanEditFollowing}
          />
        );
      case "planEvent": {
        const feedPlan = homeFeedPlans.find(plan => plan.id === activePlanId);
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
              initiallyJoined={false}
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
        <div className="flex-shrink-0 flex items-center justify-around border-t border-gray-200 bg-white px-2 pb-safe pt-2"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
        >
          {([
            { id: "home" as Screen, label: "Главная", Icon: Home },
            { id: "plans" as Screen, label: "Планы", Icon: Calendar },
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
