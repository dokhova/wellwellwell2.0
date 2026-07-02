import { ArrowLeft, Calendar, CheckCircle2, Home, MessageCircle, Plus, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Article, ChatMessage, ChatPeer, ChatThread, HomeFeedPlan, ParticipantPlanRef, Screen } from "@/app/types";
import { EVENT_PARTICIPANTS, NO_BOTTOM_NAV, GREEN } from "@/app/data/constants";
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
import { ChatScreen, ChatsScreen } from "@/app/screens/ChatScreen";
import { WorkInProgress } from "@/app/components/WorkInProgress";
import appLogo from "@/imports/avatar-brand.png";

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`localStorage write failed for ${key}`, error);
  }
};

const SUPPORT_PEER: ChatPeer = {
  id: "wellwellwell-support",
  name: "Well Well Well",
  avatarUrl: appLogo as unknown as string,
  cannedReplies: [
    "Спасибо за сообщение. В демо-версии команда ответит здесь позже.",
    "Мы уже собираем обратную связь по планам и чатам.",
  ],
};

const SUPPORT_MESSAGE = "Привет! Well Well Well помогает собирать привычки и планы тренировок — создавай свои события или присоединяйся к чужим, зови друзей в чат. Если возникнут вопросы — пишите сюда, наша команда ответит";

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
  onCreate,
}: {
  plans: HomeFeedPlan[];
  selectedPlanIds: number[];
  onBack: () => void;
  onAddPlan: (id: number) => void;
  onCreate: () => void;
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
        <button
          onClick={onCreate}
          className="mb-4 flex h-11 w-full items-center justify-center gap-2 rounded-full text-[14px] font-semibold text-white"
          style={{ backgroundColor: GREEN }}
        >
          <Plus size={16} strokeWidth={2.2} />
          Создать
        </button>
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
  const deletedPlansStorageKey = `${storagePrefix}:deletedPlans`;
  const followingStorageKey = `${storagePrefix}:following`;
  const chatThreadIdsStorageKey = `${storagePrefix}:chatThreadIds`;
  const chatThreadStorageKey = (peerId: string) => `${storagePrefix}:chat:${encodeURIComponent(peerId)}`;

  const [screen, setScreen] = useState<Screen>("home");
  const [detailOrigin, setDetailOrigin] = useState<Screen>("plans");
  const [createOrigin, setCreateOrigin] = useState<Screen>("plans");
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [articleOrigin, setArticleOrigin] = useState<Screen>("home");
  const [activePlanId, setActivePlanId] = useState<number>(1);
  const [activeChatPeer, setActiveChatPeer] = useState<ChatPeer | null>(null);
  const [planEventOrigin, setPlanEventOrigin] = useState<Screen>("plans");
  const [previousScreen, setPreviousScreen] = useState<Screen>("plans");
  const [profileConnectionsType, setProfileConnectionsType] = useState<ConnectionType>("followers");
  const [profileConnectionsCanEditFollowing, setProfileConnectionsCanEditFollowing] = useState(false);
  const [highlightedPlanId, setHighlightedPlanId] = useState<number | null>(null);
  const [viewingOwnProfile, setViewingOwnProfile] = useState(true);
  const [viewingExpertId, setViewingExpertId] = useState("gena");
  const [editableProfile, setEditableProfile] = useState<ExpertProfile>(() =>
    normalizeProfile(readJson(profileStorageKey, buildTelegramProfile(telegramUser)))
  );
  const [myParticipantIds, setMyParticipantIds] = useState<ParticipantPlanRef[]>(() => {
    const stored = readJson<Array<number | ParticipantPlanRef>>(myPlansStorageKey, []);
    return stored.map((item) => typeof item === "number" ? { kind: "plan", id: item } : item);
  });
  const [checkedItemKeys, setCheckedItemKeys] = useState<string[]>(() => readJson(checkedItemsStorageKey, []));
  const [createdPlans, setCreatedPlans] = useState<HomeFeedPlan[]>(() => readJson(createdPlansStorageKey, []));
  const [deletedPlanIds, setDeletedPlanIds] = useState<number[]>(() => readJson(deletedPlansStorageKey, []));
  const [myFollowing, setMyFollowing] = useState<ExpertConnection[]>(() => readJson(followingStorageKey, []));
  const [chatThreads, setChatThreads] = useState<ChatThread[]>(() => {
    const ids = readJson<string[]>(chatThreadIdsStorageKey, []);
    const storedThreads = ids
      .map((id) => readJson<ChatThread | null>(chatThreadStorageKey(id), null))
      .filter((thread): thread is ChatThread => Boolean(thread?.peer && Array.isArray(thread.messages)));
    if (storedThreads.some((thread) => thread.peer.id === SUPPORT_PEER.id)) return storedThreads;
    return [
      {
        peer: SUPPORT_PEER,
        pinned: true,
        updatedAt: Date.now(),
        messages: [{ id: "support-welcome", sender: "peer", text: SUPPORT_MESSAGE, createdAt: Date.now() }],
      },
      ...storedThreads,
    ];
  });
  const currentUserId = editableProfile.id;
  const currentAuthor = {
    id: currentUserId,
    name: editableProfile.name,
    avatarUrl: editableProfile.photoUrl,
  };
  const deletedPlanIdSet = new Set(deletedPlanIds);
  const allPlans = [...createdPlans, ...homeFeedPlans].filter((plan) => !deletedPlanIdSet.has(plan.id));
  const allPlanDetails = [
    ...createdPlans.flatMap((plan) => plan.items?.length ? plan.items : []),
    ...createdPlans,
    ...homeFeedPlans,
  ].filter((plan) => !deletedPlanIdSet.has(plan.id));
  const participantKey = (ref: ParticipantPlanRef) => `${ref.kind}:${ref.id}`;
  const myParticipantKeys = new Set(myParticipantIds.map(participantKey));
  const myPlans = allPlans.filter((plan) => myParticipantKeys.has(participantKey({ kind: plan.kind ?? "plan", id: plan.id })));
  const publicPlans = allPlans.filter((plan) => (plan.visibility ?? "all") === "all" && plan.author.id !== currentUserId);
  const participantChatPeers: ChatPeer[] = EVENT_PARTICIPANTS.map((participant) => ({
    id: participant.id,
    name: participant.name,
    avatarUrl: participant.avatar,
    cannedReplies: participant.cannedReplies,
  }));
  const chatSearchPeers: ChatPeer[] = [
    ...experts.map((expert) => ({
      id: expert.id,
      name: expert.name,
      avatarUrl: expert.photoUrl,
      cannedReplies: expert.cannedReplies,
    })),
    ...participantChatPeers,
  ];

  useEffect(() => initTelegram(), []);

  useEffect(() => {
    writeJson(profileStorageKey, editableProfile);
  }, [editableProfile, profileStorageKey]);

  useEffect(() => {
    writeJson(myPlansStorageKey, myParticipantIds);
    setEditableProfile((profile) => ({ ...profile, plansCount: myParticipantIds.length }));
  }, [myParticipantIds, myPlansStorageKey]);

  useEffect(() => {
    writeJson(checkedItemsStorageKey, checkedItemKeys);
  }, [checkedItemKeys, checkedItemsStorageKey]);

  useEffect(() => {
    writeJson(createdPlansStorageKey, createdPlans);
  }, [createdPlans, createdPlansStorageKey]);

  useEffect(() => {
    writeJson(deletedPlansStorageKey, deletedPlanIds);
  }, [deletedPlanIds, deletedPlansStorageKey]);

  useEffect(() => {
    writeJson(followingStorageKey, myFollowing);
    setEditableProfile((profile) => ({ ...profile, followersCount: 0, followingCount: myFollowing.length }));
  }, [followingStorageKey, myFollowing]);

  useEffect(() => {
    writeJson(chatThreadIdsStorageKey, chatThreads.map((thread) => thread.peer.id));
    chatThreads.forEach((thread) => writeJson(chatThreadStorageKey(thread.peer.id), thread));
  }, [chatThreadIdsStorageKey, chatThreads]);

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

  const getCannedPeer = (peer: ChatPeer): ChatPeer => {
    const expert = experts.find((item) => item.id === peer.id);
    if (expert) {
      return { id: expert.id, name: peer.name || expert.name, avatarUrl: peer.avatarUrl ?? expert.photoUrl, cannedReplies: expert.cannedReplies };
    }
    const participant = participantChatPeers.find((item) => item.id === peer.id);
    if (participant) return participant;
    return peer;
  };

  const openChatWithPeer = (peer: ChatPeer) => {
    const nextPeer = getCannedPeer(peer);
    setActiveChatPeer(nextPeer);
    setPreviousScreen(screen);
    setScreen("chat");
  };

  const sendChatMessage = (peer: ChatPeer, text: string, sender: ChatMessage["sender"]) => {
    const body = text.trim();
    if (!body) return;
    const normalizedPeer = getCannedPeer(peer);
    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      sender,
      text: body,
      createdAt: Date.now(),
    };
    setChatThreads((threads) => {
      const existing = threads.find((thread) => thread.peer.id === normalizedPeer.id);
      if (existing) {
        return threads.map((thread) => thread.peer.id === normalizedPeer.id
          ? { ...thread, peer: normalizedPeer, messages: [...thread.messages, message], updatedAt: message.createdAt }
          : thread);
      }
      return [{ peer: normalizedPeer, messages: [message], updatedAt: message.createdAt }, ...threads];
    });
  };

  const openProfileConnections = (type: ConnectionType, ownerIsCurrentUser = false) => {
    setProfileConnectionsType(type);
    setProfileConnectionsCanEditFollowing(ownerIsCurrentUser);
    setPreviousScreen(screen);
    setScreen("profileConnections");
  };

  const addCatalogPlanToRoutine = (id: number) => {
    const plan = allPlans.find((item) => item.id === id);
    const ref = { kind: plan?.kind ?? "plan", id } satisfies ParticipantPlanRef;
    const key = participantKey(ref);
    setMyParticipantIds((ids) => ids.some((item) => participantKey(item) === key) ? ids : [ref, ...ids]);
  };

  const addPlanToMine = (id: number) => {
    addCatalogPlanToRoutine(id);
    setViewingOwnProfile(true);
    setHighlightedPlanId(id);
    window.setTimeout(() => setHighlightedPlanId(null), 1500);
    setScreen(previousScreen === "profile" ? "profile" : "plans");
  };

  const removePlanFromMine = (id: number) => {
    setMyParticipantIds((ids) => ids.filter((item) => item.id !== id));
    setCheckedItemKeys((keys) => keys.filter((key) => !key.endsWith(`:${id}`)));
  };

  const deletePlan = (id: number) => {
    setDeletedPlanIds((ids) => ids.includes(id) ? ids : [id, ...ids]);
    setCreatedPlans((plans) => plans.filter((plan) => plan.id !== id));
    setMyParticipantIds((ids) => ids.filter((item) => item.id !== id));
    setCheckedItemKeys((keys) => keys.filter((key) => !key.endsWith(`:${id}`)));
    setScreen("plans");
  };

  const toggleCheckedItem = (key: string) => {
    setCheckedItemKeys((keys) => keys.includes(key) ? keys.filter((item) => item !== key) : [...keys, key]);
  };

  const createPlan = (plans: HomeFeedPlan[], result: CreatedPlanResult) => {
    void result;
    const ids = plans.map((plan) => plan.id);
    setCreatedPlans((items) => [...plans, ...items.filter((item) => !ids.includes(item.id))]);
    const ref = { kind: "plan", id: ids[0] } satisfies ParticipantPlanRef;
    const key = participantKey(ref);
    setMyParticipantIds((items) => items.some((item) => participantKey(item) === key) ? items : [ref, ...items]);
    setHighlightedPlanId(ids[0]);
    window.setTimeout(() => setHighlightedPlanId(null), 1500);
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
        return <HomeScreen onNavigate={navigate} onPlanOpen={openPlanEvent} onAuthorOpen={openExpertProfile} onMessagePeer={openChatWithPeer} />;
      case "plans":
        return (
          <PlansScreen
            onNavigate={navigate}
            onPlanOpen={openPlanEvent}
            participantPlans={myPlans}
            checkedItemKeys={checkedItemKeys}
            onToggleCheck={toggleCheckedItem}
            onRemoveParticipant={removePlanFromMine}
            highlightedPlanId={highlightedPlanId}
          />
        );
      case "create":
        return <CreateScreen onNavigate={navigate} backTo={createOrigin} onCreatePlan={createPlan} currentAuthor={currentAuthor} />;
      case "chats":
        return <ChatsScreen threads={chatThreads} onOpenThread={openChatWithPeer} availablePeers={chatSearchPeers} />;
      case "chat": {
        if (!activeChatPeer) return <ChatsScreen threads={chatThreads} onOpenThread={openChatWithPeer} availablePeers={chatSearchPeers} />;
        const thread = chatThreads.find((item) => item.peer.id === activeChatPeer.id);
        return (
          <ChatScreen
            peer={getCannedPeer(activeChatPeer)}
            messages={thread?.messages ?? []}
            onBack={() => setScreen(previousScreen === "chat" ? "chats" : previousScreen)}
            onSendMessage={sendChatMessage}
          />
        );
      }
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
            onAddPlan={() => {
              setPreviousScreen("profile");
              setScreen("addPlan");
            }}
            onRemovePlan={removePlanFromMine}
            onToggleFollow={toggleFollowing}
            onMessageProfile={openChatWithPeer}
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
            plans={publicPlans}
            selectedPlanIds={myParticipantIds.map((item) => item.id)}
            onBack={() => setScreen(previousScreen)}
            onAddPlan={addPlanToMine}
            onCreate={() => {
              setCreateOrigin("plans");
              setScreen("create");
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
            followerItems={profileConnectionsCanEditFollowing ? [] : undefined}
            followingItems={myFollowing}
            onToggleFollowing={(id) => setMyFollowing((items) => items.filter((item) => item.id !== id))}
          />
        );
      case "planEvent": {
        const feedPlan = allPlanDetails.find(plan => plan.id === activePlanId);
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
              authorId={feedPlan.author.id}
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
              initiallyJoined={myParticipantIds.some((item) => item.id === feedPlan.id)}
              onJoin={addCatalogPlanToRoutine}
              onLeave={removePlanFromMine}
              onProfile={() => openExpertProfile(feedPlan.author.id ?? "gena")}
              onMessageAuthor={(peer) => openChatWithPeer({ ...peer, id: feedPlan.author.id ?? peer.id })}
              participantItems={participantChatPeers}
              onMessageParticipant={openChatWithPeer}
              canDelete={feedPlan.author.id === currentUserId}
              onDelete={() => deletePlan(feedPlan.id)}
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
            { id: "chats" as Screen, label: "Чаты", Icon: MessageCircle },
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
