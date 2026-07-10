import { ArrowLeft, Calendar, CheckCircle2, MessageCircle, Newspaper, Plus, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Article, ChatMessage, ChatPeer, ChatThread, HomeFeedPlan, ParticipantPlanRef, PlanId, Screen } from "@/app/types";
import { EVENT_PARTICIPANTS, NO_BOTTOM_NAV, GREEN } from "@/app/data/constants";
import { formatNearestDate, getNextOccurrence } from "@/app/data/calendar";
import { experts, expertProfile, profileFollowers, profileFollowing, type ExpertConnection, type ExpertProfile } from "@/app/data/profile";
import { homeFeedPlans } from "@/app/data/plans";
import { activeDemoClubPlans, getDemoClubParticipantPeers } from "@/app/data/demoClubs";
import { demoCommunityPlanIds, demoCommunityPlans, getDemoCommunityParticipantPeers } from "@/app/data/demoCommunity";
import { acceptProfileTerms, deleteProfile, fetchProfile, fetchProfilesByIds, upsertProfile } from "@/app/lib/api/profiles";
import { deleteUserFollows, fetchFollowers, fetchFollowing, follow, unfollow } from "@/app/lib/api/follows";
import { canUploadPhotos, sanitizeImageUrl, uploadPhoto } from "@/app/lib/api/storage";
import { deleteUserMessages, fetchUserThreadMessages, makeThreadId, sendMessage, subscribeToUserMessages, type MessageRow } from "@/app/lib/api/chat";
import { createPlanRemote, deletePlanParticipant, deletePlanParticipantsForPlans, deletePlanRemote, deletePlansByAuthor, deleteUserPlanParticipants, fetchJoinedCounts, fetchParticipants, fetchPlan, fetchPlansByAuthor, fetchPublicPlans, setPlanHidden, subscribeToPlanParticipants, updatePlanRemote, upsertPlanParticipant } from "@/app/lib/api/plans";
import { deleteCommentsByAuthor } from "@/app/lib/api/comments";
import { buildPlanStartAppUrl, getTelegramAuthDate, getTelegramStartParam, getTelegramUser, initTelegram, parsePlanStartParam } from "@/app/lib/telegram";
import { checkBackendHealth } from "@/app/lib/health";
import { identifyUser, track, type PlanViewSource } from "@/app/lib/analytics";
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
import { WelcomeScreen } from "@/app/screens/WelcomeScreen";
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

const isRemovedLegacyDemoRecord = (value: unknown) => {
  try {
    const text = JSON.stringify(value).toLowerCase();
    const removedId = ["ge", "na"].join("");
    const removedFirstName = "\u0433\u0435\u043d\u0430";
    const removedLastName = "\u043b\u043e\u0445\u0442\u0438\u043d";
    return text.includes(removedId)
      || text.includes(removedFirstName)
      || text.includes(removedLastName)
      || text.includes("цифровой детокс");
  } catch {
    return false;
  }
};

const purgeRemovedLegacyDemoLocalData = ({
  createdPlansStorageKey,
  myPlansStorageKey,
  checkedItemsStorageKey,
  followingStorageKey,
  chatThreadIdsStorageKey,
  chatThreadStorageKey,
}: {
  createdPlansStorageKey: string;
  myPlansStorageKey: string;
  checkedItemsStorageKey: string;
  followingStorageKey: string;
  chatThreadIdsStorageKey: string;
  chatThreadStorageKey: (peerId: string) => string;
}) => {
  const createdPlans = readJson<HomeFeedPlan[]>(createdPlansStorageKey, []);
  const removedPlanIds = new Set(createdPlans.filter(isRemovedLegacyDemoRecord).map((plan) => planKey(plan.id)));
  const cleanedCreatedPlans = createdPlans.filter((plan) => !removedPlanIds.has(planKey(plan.id)));
  if (cleanedCreatedPlans.length !== createdPlans.length) writeJson(createdPlansStorageKey, cleanedCreatedPlans);

  if (removedPlanIds.size > 0) {
    const myPlans = readJson<Array<PlanId | ParticipantPlanRef>>(myPlansStorageKey, []);
    const cleanedMyPlans = myPlans.filter((item) => {
      const id = typeof item === "number" || typeof item === "string" ? item : item.id;
      return !removedPlanIds.has(planKey(id));
    });
    if (cleanedMyPlans.length !== myPlans.length) writeJson(myPlansStorageKey, cleanedMyPlans);

    const checkedItemKeys = readJson<string[]>(checkedItemsStorageKey, []);
    const cleanedCheckedItemKeys = checkedItemKeys.filter((key) => !Array.from(removedPlanIds).some((id) => key.endsWith(`:${id}`)));
    if (cleanedCheckedItemKeys.length !== checkedItemKeys.length) writeJson(checkedItemsStorageKey, cleanedCheckedItemKeys);
  }

  const following = readJson<ExpertConnection[]>(followingStorageKey, []);
  const cleanedFollowing = following.filter((connection) => !isRemovedLegacyDemoRecord(connection));
  if (cleanedFollowing.length !== following.length) writeJson(followingStorageKey, cleanedFollowing);

  const chatThreadIds = readJson<string[]>(chatThreadIdsStorageKey, []);
  const cleanedChatThreadIds = chatThreadIds.filter((id) => {
    const threadKey = chatThreadStorageKey(id);
    const thread = readJson<ChatThread | null>(threadKey, null);
    const shouldRemove = isRemovedLegacyDemoRecord(id) || isRemovedLegacyDemoRecord(thread);
    if (shouldRemove) {
      try {
        window.localStorage.removeItem(threadKey);
      } catch (error) {
        console.error(`localStorage remove failed for ${threadKey}`, error);
      }
    }
    return !shouldRemove;
  });
  if (cleanedChatThreadIds.length !== chatThreadIds.length) writeJson(chatThreadIdsStorageKey, cleanedChatThreadIds);
};

const SUPPORT_PEER: ChatPeer = {
  id: "wellwellwell-support",
  name: "Well Well Well",
  avatarUrl: appLogo as unknown as string,
  isDemo: true,
  readOnly: true,
};

const SUPPORT_MESSAGE = "Это сервисный чат WellWellWell. Будем присылать сюда важные уведомления и новости приложения.";
const MODERATOR_IDS = ["353298824"];
const DEMO_PROFILE_IDS = new Set(experts.filter((profile) => profile.isDemo).map((profile) => profile.id));
const isNumericUserId = (id?: string | null) => Boolean(id && /^\d+$/.test(id));
const isDemoProfileId = (id?: string | null) => Boolean(id && DEMO_PROFILE_IDS.has(id));
const isDemoProfile = (profile: Pick<ExpertProfile, "isDemo">) => profile.isDemo === true;
const isDemoPeer = (peer: Pick<ChatPeer, "isDemo">) => peer.isDemo === true;
const normalizeProfile = (profile: ExpertProfile): ExpertProfile => {
  const rawPhotoUrls = profile.photoUrls?.length ? profile.photoUrls : profile.photoUrl ? [profile.photoUrl] : [];
  const photoUrls = rawPhotoUrls.map(sanitizeImageUrl).filter((url): url is string => Boolean(url));
  const photoUrl = sanitizeImageUrl(profile.photoUrl) ?? photoUrls[0] ?? null;
  const coverUrls = profile.coverUrls === null
    ? null
    : (profile.coverUrls ?? []).map(sanitizeImageUrl).filter((url): url is string => Boolean(url));
  const keepDemoFields = profile.isDemo === true && isDemoProfileId(profile.id);
  return {
    ...profile,
    photoUrls,
    photoUrl,
    coverUrls,
    cannedReplies: keepDemoFields ? profile.cannedReplies : undefined,
    isDemo: keepDemoFields ? true : undefined,
    tags: keepDemoFields ? profile.tags : undefined,
  };
};

const sanitizePlan = (plan: HomeFeedPlan): HomeFeedPlan => ({
  ...plan,
  coverUrl: sanitizeImageUrl(plan.coverUrl) ?? undefined,
  participants: plan.participants.map(sanitizeImageUrl).filter((url): url is string => Boolean(url)),
  author: {
    ...plan.author,
    avatarUrl: sanitizeImageUrl(plan.author.avatarUrl),
  },
  items: plan.items?.map(sanitizePlan),
});

const sanitizeConnection = (connection: ExpertConnection): ExpertConnection => ({
  ...connection,
  avatarUrl: sanitizeImageUrl(connection.avatarUrl),
});

type ProfileConnectionSets = {
  followers: ExpertConnection[];
  following: ExpertConnection[];
};

const sanitizeChatThread = (thread: ChatThread): ChatThread => ({
  ...thread,
  peer: thread.peer.id === SUPPORT_PEER.id
    ? SUPPORT_PEER
    : normalizeChatPeer({
        ...thread.peer,
        avatarUrl: sanitizeImageUrl(thread.peer.avatarUrl),
      }),
  pinned: thread.peer.id === SUPPORT_PEER.id ? true : thread.pinned,
  messages: sortChatMessages(thread.messages.map((message) => (
    thread.peer.id === SUPPORT_PEER.id && message.id === "support-welcome"
      ? { ...message, text: SUPPORT_MESSAGE }
      : message
  ))),
});

const sortChatMessages = (messages: ChatMessage[]) =>
  Array.from(new Map(messages.map((message) => [message.id, message])).values())
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));

const asRealPeer = (peer: ChatPeer): ChatPeer => {
  const { cannedReplies: _cannedReplies, isDemo: _isDemo, ...realPeer } = peer;
  return { ...realPeer, realUser: true };
};

const normalizeChatPeer = (peer: ChatPeer): ChatPeer => {
  if (isNumericUserId(peer.id)) return asRealPeer(peer);
  return peer;
};

const isRealProfilePeer = (peer: ChatPeer, remoteProfiles: Record<string, ExpertProfile>) =>
  peer.realUser || Boolean(remoteProfiles[peer.id]) || isNumericUserId(peer.id);

const canMessageProfile = (profile: Pick<ExpertProfile, "id" | "isDemo" | "cannedReplies">) =>
  !isDemoProfile(profile);

const getPeerIdFromThreadId = (threadId: string, currentUserId: string) => {
  const parts = threadId.split("_");
  if (parts.length !== 2) return null;
  return parts[0] === currentUserId ? parts[1] : parts[1] === currentUserId ? parts[0] : null;
};

const mapMessageRowToChatMessage = (message: MessageRow, currentUserId: string): ChatMessage => ({
  id: message.id,
  sender: message.sender_id === currentUserId ? "me" : "peer",
  text: message.text,
  createdAt: new Date(message.created_at).getTime(),
  readAt: message.read_at ? new Date(message.read_at).getTime() : null,
  status: "sent",
  kind: message.kind ?? "text",
  planId: message.plan_id,
  inviteStatus: message.invite_status,
});

const getParticipantsCount = (plan: HomeFeedPlan) => {
  const parsed = Number.parseInt(plan.participantsLabel, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const planKey = (id: PlanId) => String(id);
const activeDemoClubPlanIds = new Set(activeDemoClubPlans.map((plan) => planKey(plan.id)));
const demoPlanIds = new Set([...demoCommunityPlanIds, ...activeDemoClubPlanIds]);
const demoPlans = [...demoCommunityPlans, ...activeDemoClubPlans];
const isDemoCommunityPlanId = (id: PlanId) => demoPlanIds.has(planKey(id));
const getPlanDeepLink = (plan: HomeFeedPlan) => buildPlanStartAppUrl(planKey(plan.id));
const planSourceFromScreen = (source: Screen): PlanViewSource => {
  if (source === "home") return "feed";
  if (source === "plans") return "calendar";
  if (source === "profile") return "profile";
  if (source === "search") return "search";
  return "feed";
};
const planIdFromProgressKey = (key: string) => key.slice(key.indexOf(":") + 1);
type PlanDetailSession = {
  planId: string;
  source: PlanViewSource;
  openedAt: number;
};
type NavSnapshot =
  | { screen: "home" | "plans" | "chats" | "create" | "search" | "detail" | "article" | "addPlan" | "editProfile" }
  | { screen: "profile"; viewingOwnProfile: boolean; viewingExpertId: string }
  | { screen: "profileConnections"; type: ConnectionType; ownerId: string; canEditFollowing: boolean }
  | { screen: "planEvent"; activePlanId: PlanId; origin: Screen; source: PlanViewSource }
  | { screen: "chat"; peer: ChatPeer | null };
const NAV_STACK_LIMIT = 20;

const shuffleIds = (ids: string[]) => {
  const next = [...ids];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

const isTelegramPhotoUrl = (url: string | null | undefined) => {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === "t.me" || hostname.endsWith(".t.me");
  } catch {
    return false;
  }
};

const mirrorTelegramPhotoToStorage = async (profile: ExpertProfile): Promise<ExpertProfile> => {
  const sourceUrl = profile.photoUrl;
  if (!canUploadPhotos || !isTelegramPhotoUrl(sourceUrl)) return profile;

  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) return profile;

    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) return profile;

    const extension = blob.type.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "jpg";
    const file = new File([blob], `telegram-avatar.${extension}`, { type: blob.type });
    const publicUrl = await uploadPhoto(file);
    if (!publicUrl) return profile;

    const previousUrls = profile.photoUrls.filter((url) => url !== sourceUrl);
    return normalizeProfile({
      ...profile,
      photoUrl: publicUrl,
      photoUrls: [publicUrl, ...previousUrls],
    });
  } catch {
    return profile;
  }
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
    coverUrls: null,
    plansCount: 0,
    isMe: true,
    isFollowedByMe: false,
  };
};

const buildUnknownProfile = (id: string): ExpertProfile => {
  const profile = normalizeProfile({
    ...expertProfile,
    id,
    telegramId: Number(id) || 0,
    name: `Пользователь ${id}`,
    bio: "",
    photoUrl: null,
    photoUrls: [],
    coverUrls: null,
    plansCount: 0,
    followersCount: 0,
    followingCount: 0,
    isMe: false,
    isFollowedByMe: false,
  });
  delete profile.cannedReplies;
  delete profile.tags;
  return profile;
};

function AddPlanScreen({
  plans,
  selectedPlanIds,
  onBack,
  onAddPlan,
  onCreate,
}: {
  plans: HomeFeedPlan[];
  selectedPlanIds: PlanId[];
  onBack: () => void;
  onAddPlan: (id: PlanId) => void;
  onCreate: () => void;
}) {
  const selected = new Set(selectedPlanIds.map(planKey));

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
            const isAdded = selected.has(planKey(plan.id));
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
  const initialStartParam = useMemo(() => getTelegramStartParam(), []);
  const telegramAuthDate = useMemo(() => getTelegramAuthDate(), []);
  const initialStart = useMemo(() => parsePlanStartParam(initialStartParam), [initialStartParam]);
  const startParamConsumedKey = initialStartParam && telegramAuthDate ? `startParamConsumed:${initialStartParam}:${telegramAuthDate}` : "";
  const sessionStartParamConsumedKey = initialStartParam ? `startParamConsumed:${initialStartParam}` : "";
  const storagePrefix = `wellwellwell:${telegramUser.id}`;
  const profileStorageKey = `${storagePrefix}:profile`;
  const myPlansStorageKey = `${storagePrefix}:myPlans`;
  const checkedItemsStorageKey = `${storagePrefix}:checkedItems`;
  const createdPlansStorageKey = `${storagePrefix}:createdPlans`;
  const deletedPlansStorageKey = `${storagePrefix}:deletedPlans`;
  const followingStorageKey = `${storagePrefix}:following`;
  const chatThreadIdsStorageKey = `${storagePrefix}:chatThreadIds`;
  const termsAcceptedStorageKey = `${storagePrefix}:termsAccepted`;
  const lastTabStorageKey = `${storagePrefix}:lastTab`;
  const chatThreadStorageKey = (peerId: string) => `${storagePrefix}:chat:${encodeURIComponent(peerId)}`;

  const [removedLegacyDemoLocalDataPurged] = useState(() => {
    purgeRemovedLegacyDemoLocalData({
      createdPlansStorageKey,
      myPlansStorageKey,
      checkedItemsStorageKey,
      followingStorageKey,
      chatThreadIdsStorageKey,
      chatThreadStorageKey,
    });
    return true;
  });
  void removedLegacyDemoLocalDataPurged;

  const [screen, setScreen] = useState<Screen>("home");
  const [detailOrigin, setDetailOrigin] = useState<Screen>("plans");
  const [createOrigin, setCreateOrigin] = useState<Screen>("plans");
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [articleOrigin, setArticleOrigin] = useState<Screen>("home");
  const [searchOrigin, setSearchOrigin] = useState<Screen>("home");
  const [activePlanId, setActivePlanId] = useState<PlanId>(1);
  const [editingPlanId, setEditingPlanId] = useState<PlanId | null>(null);
  const [activeChatPeer, setActiveChatPeer] = useState<ChatPeer | null>(null);
  const [planEventOrigin, setPlanEventOrigin] = useState<Screen>("plans");
  const [planEventSource, setPlanEventSource] = useState<PlanViewSource>("calendar");
  const [previousScreen, setPreviousScreen] = useState<Screen>("plans");
  const [navStack, setNavStack] = useState<NavSnapshot[]>([]);
  const [profileSourceTab, setProfileSourceTab] = useState<Screen>(() => readJson<Screen>(lastTabStorageKey, "home"));
  const [profileConnectionsType, setProfileConnectionsType] = useState<ConnectionType>("followers");
  const [profileConnectionsCanEditFollowing, setProfileConnectionsCanEditFollowing] = useState(false);
  const [profileConnectionsOwnerId, setProfileConnectionsOwnerId] = useState("");
  const [highlightedPlanId, setHighlightedPlanId] = useState<PlanId | null>(null);
  const [viewingOwnProfile, setViewingOwnProfile] = useState(true);
  const [viewingExpertId, setViewingExpertId] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const [startParamHandled, setStartParamHandled] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(() => readJson(termsAcceptedStorageKey, false));
  const [appToast, setAppToast] = useState("");
  const [moderatorHiddenPlanIds, setModeratorHiddenPlanIds] = useState<PlanId[]>([]);
  const [remoteProfiles, setRemoteProfiles] = useState<Record<string, ExpertProfile>>({});
  const [homeDemoPlanOrder] = useState(() => {
    const currentIds = demoCommunityPlans.slice(0, 12).map((plan) => planKey(plan.id));
    return shuffleIds(currentIds);
  });
  const [homeClubPlanOrder] = useState(() => {
    const currentIds = activeDemoClubPlans.map((plan) => planKey(plan.id));
    return shuffleIds(currentIds);
  });
  const [editableProfile, setEditableProfile] = useState<ExpertProfile>(() =>
    normalizeProfile(readJson(profileStorageKey, buildTelegramProfile(telegramUser)))
  );
  const [myParticipantIds, setMyParticipantIds] = useState<ParticipantPlanRef[]>(() => {
    const stored = readJson<Array<PlanId | ParticipantPlanRef>>(myPlansStorageKey, []);
    return stored.map((item) => typeof item === "number" || typeof item === "string" ? { kind: "plan", id: item } : item);
  });
  const [checkedItemKeys, setCheckedItemKeys] = useState<string[]>(() => readJson(checkedItemsStorageKey, []));
  const [createdPlans, setCreatedPlans] = useState<HomeFeedPlan[]>(() => readJson<HomeFeedPlan[]>(createdPlansStorageKey, []).map(sanitizePlan));
  const [remotePublicPlans, setRemotePublicPlans] = useState<HomeFeedPlan[]>([]);
  const [profileRemotePlans, setProfileRemotePlans] = useState<Record<string, HomeFeedPlan[]>>({});
  // joinedCounts[planId] = unique joined user_ids from plan_participants, excluding the plan author.
  const [joinedCounts, setJoinedCounts] = useState<Record<string, number>>({});
  const [joinedParticipantPeers, setJoinedParticipantPeers] = useState<Record<string, ChatPeer[]>>({});
  const [deletedPlanIds, setDeletedPlanIds] = useState<PlanId[]>(() => readJson(deletedPlansStorageKey, []));
  const [myFollowing, setMyFollowing] = useState<ExpertConnection[]>(() =>
    readJson<ExpertConnection[]>(followingStorageKey, []).map(sanitizeConnection)
  );
  const [dbFollowing, setDbFollowing] = useState<ExpertConnection[]>([]);
  const [dbFollowers, setDbFollowers] = useState<ExpertConnection[]>([]);
  const [profileFollowCounts, setProfileFollowCounts] = useState<Record<string, { followers: number; following: number }>>({});
  const [connectionSetsByUser, setConnectionSetsByUser] = useState<Record<string, ProfileConnectionSets>>({});
  const [chatThreads, setChatThreads] = useState<ChatThread[]>(() => {
    const ids = readJson<string[]>(chatThreadIdsStorageKey, []);
    const storedThreads = ids
      .map((id) => readJson<ChatThread | null>(chatThreadStorageKey(id), null))
      .filter((thread): thread is ChatThread => Boolean(thread?.peer && Array.isArray(thread.messages)))
      .map(sanitizeChatThread);
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
  const homeScrollTopRef = useRef(0);
  const planDetailSessionRef = useRef<PlanDetailSession | null>(null);
  const allPlanDetailsRef = useRef<HomeFeedPlan[]>([]);
  const myParticipantIdsRef = useRef<ParticipantPlanRef[]>([]);
  const currentUserIdRef = useRef("");
  const syncedDemoFollowingUserIdsRef = useRef(new Set<string>());
  const currentUserId = editableProfile.id;
  const isModerator = MODERATOR_IDS.includes(currentUserId);
  const currentAuthor = {
    id: currentUserId,
    name: editableProfile.name,
    avatarUrl: editableProfile.photoUrl,
  };
  const currentRootTab: Screen = screen === "profile" && viewingOwnProfile
    ? "profile"
    : screen === "profile" || screen === "profileConnections"
      ? profileSourceTab
      : screen === "planEvent"
        ? planEventOrigin
        : screen === "chat"
          ? "chats"
          : screen === "plans" || screen === "home" || screen === "chats"
            ? screen
            : profileSourceTab;
  const captureNavSnapshot = (): NavSnapshot => {
    if (screen === "profile") return { screen, viewingOwnProfile, viewingExpertId };
    if (screen === "profileConnections") {
      return {
        screen,
        type: profileConnectionsType,
        ownerId: profileConnectionsOwnerId,
        canEditFollowing: profileConnectionsCanEditFollowing,
      };
    }
    if (screen === "planEvent") return { screen, activePlanId, origin: planEventOrigin, source: planEventSource };
    if (screen === "chat") return { screen, peer: activeChatPeer };
    return { screen };
  };
  const pushNavSnapshot = () => {
    const snapshot = captureNavSnapshot();
    setNavStack((items) => [...items, snapshot].slice(-NAV_STACK_LIMIT));
  };
  const restoreNavSnapshot = (snapshot: NavSnapshot) => {
    if (snapshot.screen === "profile") {
      setViewingOwnProfile(snapshot.viewingOwnProfile);
      setViewingExpertId(snapshot.viewingExpertId);
    } else if (snapshot.screen === "profileConnections") {
      setProfileConnectionsType(snapshot.type);
      setProfileConnectionsOwnerId(snapshot.ownerId);
      setProfileConnectionsCanEditFollowing(snapshot.canEditFollowing);
    } else if (snapshot.screen === "planEvent") {
      setActivePlanId(snapshot.activePlanId);
      setPlanEventOrigin(snapshot.origin);
      setPlanEventSource(snapshot.source);
    } else if (snapshot.screen === "chat") {
      setActiveChatPeer(snapshot.peer);
    }
    setPreviousScreen(snapshot.screen === "chat" ? "chats" : snapshot.screen);
    setScreen(snapshot.screen);
  };
  const goBackInStack = (fallback: Screen = previousScreen) => {
    const snapshot = navStack[navStack.length - 1];
    if (!snapshot) {
      setScreen(fallback);
      return;
    }
    setNavStack((items) => items.slice(0, -1));
    restoreNavSnapshot(snapshot);
  };
  const deletedPlanIdSet = new Set(deletedPlanIds.map(planKey));
  const moderatorHiddenPlanIdSet = new Set(moderatorHiddenPlanIds.map(planKey));
  const isJoinedPlan = (id: PlanId) => myParticipantIds.some((item) => planKey(item.id) === planKey(id));
  const getPlanParticipantItems = (plan: HomeFeedPlan): ChatPeer[] => {
    const id = planKey(plan.id);
    const joinedPeers = joinedParticipantPeers[id] ?? [];
    const authorParticipant: ChatPeer = {
      id: plan.author.id ?? plan.author.name,
      name: plan.author.name,
      avatarUrl: plan.author.avatarUrl,
    };
    const demoPeers = isDemoCommunityPlanId(plan.id)
      ? [...getDemoCommunityParticipantPeers(id), ...getDemoClubParticipantPeers(id)]
      : [];
    return [
      authorParticipant,
      ...joinedPeers.filter((peer) => peer.id !== authorParticipant.id),
      ...demoPeers.filter((peer) => peer.id !== authorParticipant.id),
    ].filter((peer, index, peers) => peers.findIndex((item) => item.id === peer.id) === index);
  };
  const getPlanParticipantPresentation = (plan: HomeFeedPlan) => {
    const id = planKey(plan.id);
    const items = getPlanParticipantItems(plan);
    const avatars = items.map((peer) => peer.avatarUrl).filter((url): url is string => Boolean(url));
    const count = Math.max(items.length, 1 + (joinedCounts[id] ?? 0));
    return {
      avatars,
      label: `${count} чел.`,
      count,
    };
  };
  const createdPlansWithCounts = createdPlans.map((plan) => {
    const participantPresentation = getPlanParticipantPresentation(plan);
    return {
      ...plan,
      participants: participantPresentation.avatars,
      participantsLabel: participantPresentation.label,
    };
  });
  const demoPlansWithParticipants = demoPlans.map((plan) => {
    const participantPresentation = getPlanParticipantPresentation(plan);
    return {
      ...plan,
      participants: participantPresentation.avatars,
      participantsLabel: participantPresentation.label,
    };
  });
  const remotePlansWithCounts = remotePublicPlans.map((plan) => {
    const participantPresentation = getPlanParticipantPresentation(plan);
    return {
      ...plan,
      participants: participantPresentation.avatars,
      participantsLabel: participantPresentation.label,
    };
  });
  const allPlans = [...demoPlansWithParticipants, ...createdPlansWithCounts, ...remotePlansWithCounts, ...homeFeedPlans]
    .filter((plan, index, plans) => plans.findIndex((item) => planKey(item.id) === planKey(plan.id)) === index)
    .filter((plan) => !deletedPlanIdSet.has(planKey(plan.id)) && plan.hidden !== true && !moderatorHiddenPlanIdSet.has(planKey(plan.id)));
  const allPlanDetails = [
    ...demoPlansWithParticipants,
    ...createdPlansWithCounts.flatMap((plan) => plan.items?.length ? plan.items : []),
    ...createdPlansWithCounts,
    ...remotePlansWithCounts,
    ...homeFeedPlans,
  ].filter((plan, index, plans) => plans.findIndex((item) => planKey(item.id) === planKey(plan.id)) === index)
    .filter((plan) => !deletedPlanIdSet.has(planKey(plan.id)) && plan.hidden !== true && !moderatorHiddenPlanIdSet.has(planKey(plan.id)));
  const participantKey = (ref: ParticipantPlanRef) => `${ref.kind}:${ref.id}`;
  allPlanDetailsRef.current = allPlanDetails;
  myParticipantIdsRef.current = myParticipantIds;
  currentUserIdRef.current = currentUserId;
  const myParticipantKeys = new Set(myParticipantIds.map(participantKey));
  const myPlans = allPlans.filter((plan) =>
    myParticipantKeys.has(participantKey({ kind: plan.kind ?? "plan", id: plan.id }))
    || plan.author.id === currentUserId
  );
  const catalogPublicPlans = homeFeedPlans
    .filter((plan) => !deletedPlanIdSet.has(planKey(plan.id)) && (plan.visibility ?? "all") === "all")
    .sort((a, b) => getNextOccurrence(a.schedule).getTime() - getNextOccurrence(b.schedule).getTime());
  const justCreatedPublicPlans = [...createdPlansWithCounts, ...remotePlansWithCounts]
    .filter((plan) => !deletedPlanIdSet.has(planKey(plan.id)) && (plan.visibility ?? "all") === "all")
    .filter((plan, index, plans) => plans.findIndex((item) => planKey(item.id) === planKey(plan.id)) === index);
  const publicPlans = useMemo(() => {
    const demoPlanById = new Map(demoPlansWithParticipants.map((plan) => [planKey(plan.id), plan]));
    const orderedClubPlans = homeClubPlanOrder
      .map((id) => demoPlanById.get(id))
      .filter((plan): plan is HomeFeedPlan => Boolean(plan))
      .filter((plan) => !deletedPlanIdSet.has(planKey(plan.id)));
    const orderedTopDemoPlans = homeDemoPlanOrder
      .map((id) => demoPlanById.get(id))
      .filter((plan): plan is HomeFeedPlan => Boolean(plan))
      .filter((plan) => !deletedPlanIdSet.has(planKey(plan.id)));
    const remainingDemoPlans = demoPlansWithParticipants
      .filter((plan) => !homeDemoPlanOrder.includes(planKey(plan.id)))
      .filter((plan) => !homeClubPlanOrder.includes(planKey(plan.id)))
      .filter((plan) => !deletedPlanIdSet.has(planKey(plan.id)));
    const sortedPlans = [...catalogPublicPlans, ...justCreatedPublicPlans]
      .filter((plan) => !moderatorHiddenPlanIdSet.has(planKey(plan.id)))
      .sort((a, b) => getParticipantsCount(b) - getParticipantsCount(a));
    return [...orderedClubPlans, ...orderedTopDemoPlans, ...remainingDemoPlans, ...sortedPlans];
  }, [catalogPublicPlans, deletedPlanIdSet, demoPlansWithParticipants, homeClubPlanOrder, homeDemoPlanOrder, justCreatedPublicPlans, moderatorHiddenPlanIdSet]);
  const participantChatPeers: ChatPeer[] = useMemo(() => EVENT_PARTICIPANTS.map((participant) => ({
    id: participant.id,
    name: participant.name,
    avatarUrl: participant.avatar,
    cannedReplies: participant.cannedReplies,
    isDemo: true,
  })), []);
  const chatSearchPeers: ChatPeer[] = useMemo(() => [], []);
  const localPeerById = useMemo(() => new Map(chatSearchPeers.map((peer) => [peer.id, peer])), [chatSearchPeers]);
  const dbFollowingIds = useMemo(() => new Set(dbFollowing.map((item) => item.id)), [dbFollowing]);

  const profilesToConnections = useCallback((profiles: ExpertProfile[], followed = false): ExpertConnection[] =>
    profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      avatarUrl: profile.photoUrl,
      isFollowedByMe: followed,
    })), []);

  const dedupeConnections = (items: ExpertConnection[]) =>
    Array.from(new Map(items.map((item) => [item.id, sanitizeConnection(item)])).values());

  const localDemoFollowingFor = useCallback((ownerId: string) =>
    ownerId === expertProfile.id ? profileFollowing.map(sanitizeConnection) : [], []);

  const localDemoFollowersFor = useCallback((ownerId: string) =>
    ownerId === expertProfile.id ? profileFollowers.map(sanitizeConnection) : [], []);

  const idsToConnections = useCallback(async (ids: string[], followedByMeIds: Set<string>) => {
    const uniqueIds = Array.from(new Set(ids));
    const profiles = await fetchProfilesByIds(uniqueIds.filter((id) => !isDemoProfileId(id)));
    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
    return uniqueIds.map((id) => {
      const localDemo = experts.find((profile) => profile.id === id && profile.isDemo);
      const profile = profileById.get(id);
      return sanitizeConnection({
        id,
        name: profile?.name ?? localDemo?.name ?? "Участник",
        avatarUrl: profile?.photoUrl ?? localDemo?.photoUrl ?? null,
        isFollowedByMe: followedByMeIds.has(id),
      });
    });
  }, []);

  const loadConnectionSets = useCallback(async (ownerId: string) => {
    const [followingIds, followerIds, myFollowingIds] = await Promise.all([
      fetchFollowing(ownerId),
      fetchFollowers(ownerId),
      ownerId === currentUserId ? Promise.resolve([]) : fetchFollowing(currentUserId),
    ]);
    const followedByMeIds = new Set(ownerId === currentUserId ? followingIds : myFollowingIds);
    const [remoteFollowing, remoteFollowers] = await Promise.all([
      idsToConnections(followingIds, followedByMeIds),
      idsToConnections(followerIds, followedByMeIds),
    ]);
    const sets = {
      following: dedupeConnections([...localDemoFollowingFor(ownerId), ...remoteFollowing]),
      followers: dedupeConnections([...localDemoFollowersFor(ownerId), ...remoteFollowers]),
    } satisfies ProfileConnectionSets;
    setConnectionSetsByUser((items) => ({ ...items, [ownerId]: sets }));
    if (ownerId === currentUserId) {
      setDbFollowing(remoteFollowing);
      setDbFollowers(remoteFollowers);
    }
    return sets;
  }, [currentUserId, idsToConnections, localDemoFollowersFor, localDemoFollowingFor]);

  useEffect(() => {
    if (syncedDemoFollowingUserIdsRef.current.has(currentUserId)) return;
    syncedDemoFollowingUserIdsRef.current.add(currentUserId);
    const demoFollowingIds = myFollowing
      .map((item) => item.id)
      .filter(isDemoProfileId);
    if (demoFollowingIds.length === 0) return;

    const syncDemoFollowing = async () => {
      try {
        const remoteFollowingIds = new Set(await fetchFollowing(currentUserId));
        const missingIds = Array.from(new Set(demoFollowingIds)).filter((id) => !remoteFollowingIds.has(id));
        await Promise.all(missingIds.map((id) => follow(currentUserId, id)));
        if (missingIds.length > 0) await loadConnectionSets(currentUserId);
      } catch (error) {
        console.error("Supabase demo follows sync failed", error);
      }
    };

    void syncDemoFollowing();
  }, [currentUserId, loadConnectionSets, myFollowing]);

  const loadPlanParticipants = useCallback(async (planId: PlanId) => {
    const id = planKey(planId);
    const planAuthorId = allPlanDetails.find((plan) => planKey(plan.id) === id)?.author.id;
    const rows = await fetchParticipants(id);
    const joinedRows = rows.filter((row) => row.status === "joined");
    const joinedIds = Array.from(new Set(joinedRows.map((row) => row.user_id)))
      .filter((userId) => userId !== planAuthorId);
    const remoteIds = joinedIds.filter((userId) => userId !== currentUserId && !isDemoProfileId(userId));
    const profiles = await fetchProfilesByIds(remoteIds);
    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
    const peers = joinedIds.map((userId) => {
      if (userId === currentUserId) {
        return {
          id: currentUserId,
          name: currentAuthor.name,
          avatarUrl: currentAuthor.avatarUrl,
          realUser: true,
        } satisfies ChatPeer;
      }
      const profile = profileById.get(userId);
      return {
        id: userId,
        name: profile?.name ?? "Участник",
        avatarUrl: sanitizeImageUrl(profile?.photoUrl ?? null),
        realUser: true,
      } satisfies ChatPeer;
    });
    setJoinedParticipantPeers((items) => ({ ...items, [id]: peers }));
    setJoinedCounts((items) => ({ ...items, [id]: joinedIds.length }));
    if (joinedIds.includes(currentUserId)) {
      const ref = { kind: "plan", id } satisfies ParticipantPlanRef;
      setMyParticipantIds((items) => items.some((item) => participantKey(item) === participantKey(ref)) ? items : [ref, ...items]);
    }
  }, [allPlanDetails, currentAuthor.avatarUrl, currentAuthor.name, currentUserId]);

  const mergeRemoteThreads = useCallback((rows: MessageRow[], profiles: ExpertProfile[] = []) => {
    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
    const rowsByThread = new Map<string, MessageRow[]>();
    rows.forEach((row) => {
      const peerId = getPeerIdFromThreadId(row.thread_id, currentUserId);
      if (!peerId) return;
      rowsByThread.set(row.thread_id, [...(rowsByThread.get(row.thread_id) ?? []), row]);
    });

    setChatThreads((threads) => {
      const nextThreads = [...threads];
      rowsByThread.forEach((threadRows, threadId) => {
        const peerId = getPeerIdFromThreadId(threadId, currentUserId);
        if (!peerId) return;
        const sortedRows = [...threadRows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const latestRow = sortedRows[sortedRows.length - 1];
        if (!latestRow) return;
        const profile = profileById.get(peerId) ?? remoteProfiles[peerId];
        const localPeer = localPeerById.get(peerId);
        const peer = asRealPeer({
          id: peerId,
          name: profile?.name ?? localPeer?.name ?? `Пользователь ${peerId}`,
          avatarUrl: sanitizeImageUrl(profile?.photoUrl ?? localPeer?.avatarUrl ?? null),
        });
        const unreadCount = sortedRows.filter((row) => row.sender_id !== currentUserId && row.read_at === null).length;
        const latestMessage = mapMessageRowToChatMessage(latestRow, currentUserId);
        const existingIndex = nextThreads.findIndex((thread) => thread.peer.id === peerId);
        if (existingIndex >= 0) {
          const existing = nextThreads[existingIndex];
          const hasLatestMessage = existing.messages.some((message) => message.id === latestMessage.id);
          nextThreads[existingIndex] = {
            ...existing,
            peer: isDemoPeer(existing.peer) ? existing.peer : peer,
            messages: sortChatMessages(hasLatestMessage
              ? existing.messages.map((message) => message.id === latestMessage.id ? { ...message, ...latestMessage } : message)
              : [...existing.messages, latestMessage]),
            updatedAt: Math.max(existing.updatedAt, latestMessage.createdAt),
            unreadCount,
          };
        } else {
          nextThreads.push({ peer, messages: [latestMessage], updatedAt: latestMessage.createdAt, unreadCount });
        }
      });
      return nextThreads;
    });
  }, [currentUserId, localPeerById, remoteProfiles]);

  useEffect(() => initTelegram(), []);

  useEffect(() => {
    if (!startParamConsumedKey) return;
    try {
      Object.keys(window.localStorage)
        .filter((key) => key.startsWith("startParamConsumed:") && key !== startParamConsumedKey)
        .forEach((key) => window.localStorage.removeItem(key));
    } catch (error) {
      console.error("localStorage start_param cleanup failed", error);
    }
  }, [startParamConsumedKey]);

  useEffect(() => {
    if (screen !== "home" && screen !== "plans" && screen !== "chats" && !(screen === "profile" && viewingOwnProfile)) return;
    const tab = screen === "profile" ? "profile" : screen;
    writeJson(lastTabStorageKey, tab);
  }, [lastTabStorageKey, screen, viewingOwnProfile]);

  useEffect(() => {
    const name = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(" ").trim();
    identifyUser({
      telegramId: telegramUser.id,
      name,
      username: telegramUser.username,
    });
    track("app_open", {
      source: initialStart ? "deeplink" : "direct",
      ...(initialStart?.kind === "plan" ? { plan_id: initialStart.planId } : {}),
      ...(initialStart?.campaign ? { campaign: initialStart.campaign } : {}),
    });
  }, [initialStart, telegramUser]);

  useEffect(() => {
    let cancelled = false;
    void checkBackendHealth().then((health) => {
      if (health.ok) return;
      console.error(`Backend health check failed: ${health.reason}`);
      if (!cancelled && import.meta.env.DEV) {
        setAppToast(`Backend недоступен: ${health.reason}`);
        window.setTimeout(() => setAppToast(""), 4200);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const refreshVisibleScreen = () => {
      if (document.visibilityState === "visible") {
        setRefreshTick((value) => value + 1);
      }
    };
    document.addEventListener("visibilitychange", refreshVisibleScreen);
    return () => document.removeEventListener("visibilitychange", refreshVisibleScreen);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadRemotePlans = async () => {
      try {
        const plans = await fetchPublicPlans();
        if (cancelled) return;
        const publicRemotePlans = plans.map(sanitizePlan);
        setRemotePublicPlans(publicRemotePlans);
        const realFeedPlans = [...publicRemotePlans, ...createdPlans, ...homeFeedPlans]
          .filter((plan) => !isDemoCommunityPlanId(plan.id) && !isDemoProfileId(plan.author.id))
          .filter((plan, index, items) => items.findIndex((item) => planKey(item.id) === planKey(plan.id)) === index);
        const counts = await fetchJoinedCounts(realFeedPlans.map((plan) => ({
          id: planKey(plan.id),
          authorId: plan.author.id,
        })));
        if (!cancelled) {
          setJoinedCounts((items) => ({
            ...items,
            ...counts,
          }));
        }
      } catch (error) {
        console.error("Supabase public plans fetch failed", error);
      }
    };

    void loadRemotePlans();
    return () => {
      cancelled = true;
    };
  }, [refreshTick, screen]);

  useEffect(() => {
    let cancelled = false;
    const loadDemoPlanParticipants = async () => {
      try {
        const entries = await Promise.all(demoPlans.map(async (plan) => {
          const rows = await fetchParticipants(planKey(plan.id));
          return [planKey(plan.id), rows] as const;
        }));
        if (cancelled) return;
        setJoinedCounts((items) => ({
          ...items,
          ...Object.fromEntries(entries.map(([id, rows]) => {
            const authorId = demoPlans.find((plan) => planKey(plan.id) === id)?.author.id;
            const joinedIds = new Set(rows
              .filter((row) => row.status === "joined" && row.user_id !== authorId)
              .map((row) => row.user_id));
            return [id, joinedIds.size];
          })),
        }));
        const joinedRefs = entries
          .filter(([, rows]) => rows.some((row) => row.user_id === currentUserId && row.status === "joined"))
          .map(([id]) => ({ kind: "plan", id } satisfies ParticipantPlanRef));
        if (joinedRefs.length > 0) {
          setMyParticipantIds((items) => {
            const existingKeys = new Set(items.map(participantKey));
            const nextRefs = joinedRefs.filter((ref) => !existingKeys.has(participantKey(ref)));
            return nextRefs.length ? [...nextRefs, ...items] : items;
          });
        }
      } catch (error) {
        console.error("Supabase demo participants fetch failed", error);
      }
    };

    void loadDemoPlanParticipants();
    return () => {
      cancelled = true;
    };
  }, [currentUserId, refreshTick]);

  useEffect(() => {
    if (screen !== "planEvent") return;
    void loadPlanParticipants(activePlanId).catch((error) => {
      console.error("Supabase plan participants fetch failed", error);
    });
  }, [activePlanId, loadPlanParticipants, refreshTick, screen]);

  const closePlanDetailSession = useCallback(() => {
    const session = planDetailSessionRef.current;
    if (!session) return;
    const plan = allPlanDetailsRef.current.find((item) => planKey(item.id) === session.planId);
    const joined = plan?.author.id === currentUserIdRef.current
      || myParticipantIdsRef.current.some((item) => planKey(item.id) === session.planId);
    track("plan_detail_closed", {
      plan_id: session.planId,
      source: session.source,
      joined,
      duration_sec: Math.round((Date.now() - session.openedAt) / 1000),
    });
    planDetailSessionRef.current = null;
  }, []);

  useEffect(() => {
    if (screen !== "planEvent") {
      closePlanDetailSession();
      return;
    }

    const planId = planKey(activePlanId);
    const currentSession = planDetailSessionRef.current;
    if (currentSession?.planId === planId && currentSession.source === planEventSource) return;
    closePlanDetailSession();
    planDetailSessionRef.current = {
      planId,
      source: planEventSource,
      openedAt: Date.now(),
    };
  }, [activePlanId, closePlanDetailSession, planEventSource, screen]);

  useEffect(() => {
    if (screen !== "planEvent") return;
    return subscribeToPlanParticipants(planKey(activePlanId), () => {
      void loadPlanParticipants(activePlanId).catch((error) => {
        console.error("Supabase plan participants realtime refresh failed", error);
      });
    });
  }, [activePlanId, loadPlanParticipants, screen]);

  useEffect(() => {
    let cancelled = false;
    const loadMyFollows = async () => {
      try {
        const sets = await loadConnectionSets(currentUserId);
        if (cancelled) return;
        setConnectionSetsByUser((items) => ({ ...items, [currentUserId]: sets }));
      } catch (error) {
        console.error("Supabase follows fetch failed", error);
      }
    };

    void loadMyFollows();
    return () => {
      cancelled = true;
    };
  }, [currentUserId, loadConnectionSets, refreshTick]);

  useEffect(() => {
    if (screen !== "profile" || viewingOwnProfile) return;
    let cancelled = false;
    const loadViewedConnections = async () => {
      try {
        const sets = await loadConnectionSets(viewingExpertId);
        if (cancelled) return;
        setConnectionSetsByUser((items) => ({ ...items, [viewingExpertId]: sets }));
      } catch (error) {
        console.error("Supabase profile follows fetch failed", error);
      }
    };
    void loadViewedConnections();
    return () => {
      cancelled = true;
    };
  }, [loadConnectionSets, refreshTick, screen, viewingExpertId, viewingOwnProfile]);

  useEffect(() => {
    if (screen !== "profileConnections" || !profileConnectionsOwnerId) return;
    void loadConnectionSets(profileConnectionsOwnerId).catch((error) => {
      console.error("Supabase profile connections fetch failed", error);
    });
  }, [loadConnectionSets, profileConnectionsOwnerId, refreshTick, screen]);

  useEffect(() => {
    if (startParamHandled) return;
    if (!termsAccepted) return;
    const consumedStorage = startParamConsumedKey ? window.localStorage : window.sessionStorage;
    const consumedKey = startParamConsumedKey || sessionStartParamConsumedKey;
    const openLastTab = () => {
      const savedTab = readJson<Screen>(lastTabStorageKey, "home");
      if (savedTab === "profile") {
        setViewingOwnProfile(true);
        setScreen("profile");
        return;
      }
      if (savedTab === "plans" || savedTab === "chats" || savedTab === "home") {
        setScreen(savedTab);
      }
    };
    if (consumedKey) {
      try {
        if (consumedStorage.getItem(consumedKey) === "1") {
          openLastTab();
          setStartParamHandled(true);
          return;
        }
      } catch (error) {
        console.error("start_param consumed read failed", error);
      }
    }
    const markStartParamConsumed = () => {
      if (!consumedKey) return;
      try {
        consumedStorage.setItem(consumedKey, "1");
      } catch (error) {
        console.error("start_param consumed write failed", error);
      }
    };
    if (!initialStart) {
      setStartParamHandled(true);
      return;
    }
    if (initialStart.kind === "plans") {
      setPreviousScreen("home");
      setScreen("plans");
      markStartParamConsumed();
      setStartParamHandled(true);
      return;
    }

    let cancelled = false;
    const rawPlanId = initialStart.planId;
    const openStartPlan = async () => {
      const localPlan = allPlanDetails.find((plan) => planKey(plan.id) === rawPlanId);
      if (localPlan) {
        setActivePlanId(localPlan.id);
        setPlanEventOrigin("home");
        setPlanEventSource("deeplink");
        setPreviousScreen("home");
        setScreen("planEvent");
        track("plan_view", { plan_id: planKey(localPlan.id), source: "deeplink" });
        markStartParamConsumed();
        setStartParamHandled(true);
        return;
      }

      try {
        const remotePlan = await fetchPlan(rawPlanId);
        if (cancelled) return;
        if (!remotePlan || remotePlan.hidden) {
          setAppToast("План не найден или удалён");
          window.setTimeout(() => setAppToast(""), 2400);
          markStartParamConsumed();
          setStartParamHandled(true);
          return;
        }
        const sanitizedPlan = sanitizePlan(remotePlan);
        setRemotePublicPlans((plans) => plans.some((plan) => planKey(plan.id) === planKey(sanitizedPlan.id)) ? plans : [sanitizedPlan, ...plans]);
        setActivePlanId(sanitizedPlan.id);
        setPlanEventOrigin("home");
        setPlanEventSource("deeplink");
        setPreviousScreen("home");
        setScreen("planEvent");
        track("plan_view", { plan_id: planKey(sanitizedPlan.id), source: "deeplink" });
        markStartParamConsumed();
      } catch (error) {
        console.error("Supabase startapp plan fetch failed", error);
        if (!cancelled) {
          setAppToast("План не найден или удалён");
          window.setTimeout(() => setAppToast(""), 2400);
          markStartParamConsumed();
        }
      } finally {
        if (!cancelled) setStartParamHandled(true);
      }
    };

    void openStartPlan();
    return () => {
      cancelled = true;
    };
  }, [allPlanDetails, initialStart, lastTabStorageKey, sessionStartParamConsumedKey, startParamConsumedKey, startParamHandled, termsAccepted]);

  useEffect(() => {
    if (screen !== "profile" || viewingOwnProfile || isDemoProfileId(viewingExpertId)) return;
    let cancelled = false;
    const loadViewedAuthorPlans = async () => {
      try {
        const plans = (await fetchPlansByAuthor(viewingExpertId)).map(sanitizePlan);
        if (cancelled) return;
        setProfileRemotePlans((items) => ({ ...items, [viewingExpertId]: plans }));
        const counts = await fetchJoinedCounts(plans.map((plan) => ({
          id: planKey(plan.id),
          authorId: plan.author.id,
        })));
        if (!cancelled) {
          setJoinedCounts((items) => ({
            ...items,
            ...counts,
          }));
        }
      } catch (error) {
        console.error("Supabase profile plans fetch failed", error);
      }
    };

    void loadViewedAuthorPlans();
    return () => {
      cancelled = true;
    };
  }, [screen, viewingExpertId, viewingOwnProfile]);

  useEffect(() => {
    let cancelled = false;

    const loadRemoteThreads = async () => {
      try {
        const rows = await fetchUserThreadMessages(currentUserId);
        if (cancelled) return;
        const peerIds = Array.from(new Set(rows
          .map((row) => getPeerIdFromThreadId(row.thread_id, currentUserId))
          .filter((id): id is string => Boolean(id))));
        const missingProfileIds = peerIds.filter((id) => !remoteProfiles[id] && !localPeerById.has(id));
        const profiles = await fetchProfilesByIds(missingProfileIds);
        if (cancelled) return;
        if (profiles.length > 0) {
          setRemoteProfiles((items) => ({
            ...items,
            ...Object.fromEntries(profiles.map((profile) => [profile.id, normalizeProfile(profile)])),
          }));
        }
        mergeRemoteThreads(rows, profiles);
      } catch (error) {
        console.error("Supabase chat threads fetch failed", error);
      }
    };

    void loadRemoteThreads();
    const unsubscribe = subscribeToUserMessages(currentUserId, (message) => {
      const peerId = getPeerIdFromThreadId(message.thread_id, currentUserId);
      if (!peerId) return;
      if (screen === "chat" && activeChatPeer?.id === peerId) return;
      if (remoteProfiles[peerId] || localPeerById.has(peerId)) {
        mergeRemoteThreads([message]);
        return;
      }
      void fetchProfilesByIds([peerId]).then((profiles) => {
        if (cancelled) return;
        if (profiles.length > 0) {
          setRemoteProfiles((items) => ({
            ...items,
            ...Object.fromEntries(profiles.map((profile) => [profile.id, normalizeProfile(profile)])),
          }));
        }
        mergeRemoteThreads([message], profiles);
      }).catch((error) => {
        console.error("Supabase incoming chat profile fetch failed", error);
        mergeRemoteThreads([message]);
      });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [activeChatPeer?.id, currentUserId, localPeerById, mergeRemoteThreads, refreshTick, remoteProfiles, screen]);

  useEffect(() => {
    let cancelled = false;
    const syncProfile = async () => {
      const telegramProfile = normalizeProfile(buildTelegramProfile(telegramUser));
      try {
        const storedProfile = await fetchProfile(telegramProfile.id);
        if (cancelled) return;
        if (storedProfile) {
          const normalizedStoredProfile = normalizeProfile(storedProfile);
          setEditableProfile(normalizedStoredProfile);
          const mirroredProfile = await mirrorTelegramPhotoToStorage(normalizedStoredProfile);
          if (!cancelled && mirroredProfile.photoUrl !== normalizedStoredProfile.photoUrl) {
            setEditableProfile(mirroredProfile);
            await upsertProfile(mirroredProfile);
          }
          return;
        }
        const mirroredProfile = await mirrorTelegramPhotoToStorage(telegramProfile);
        if (!cancelled && mirroredProfile.photoUrl !== telegramProfile.photoUrl) {
          setEditableProfile(mirroredProfile);
        }
        await upsertProfile(mirroredProfile);
      } catch (error) {
        console.error("Supabase profile sync failed", error);
        window.setTimeout(() => {
          if (cancelled) return;
          void upsertProfile(telegramProfile).catch((retryError) => {
            console.error("Supabase profile sync retry failed", retryError);
          });
        }, 3000);
      }
    };

    void syncProfile();
    return () => {
      cancelled = true;
    };
  }, [telegramUser]);

  useEffect(() => {
    writeJson(profileStorageKey, normalizeProfile(editableProfile));
  }, [editableProfile, profileStorageKey]);

  useEffect(() => {
    writeJson(myPlansStorageKey, myParticipantIds);
    setEditableProfile((profile) => ({ ...profile, plansCount: myParticipantIds.length }));
  }, [myParticipantIds, myPlansStorageKey]);

  useEffect(() => {
    writeJson(checkedItemsStorageKey, checkedItemKeys);
  }, [checkedItemKeys, checkedItemsStorageKey]);

  useEffect(() => {
    writeJson(createdPlansStorageKey, createdPlans.map(sanitizePlan));
  }, [createdPlans, createdPlansStorageKey]);

  useEffect(() => {
    writeJson(deletedPlansStorageKey, deletedPlanIds);
  }, [deletedPlanIds, deletedPlansStorageKey]);

  useEffect(() => {
    const availablePlanKeys = new Set(allPlans.map((plan) => planKey(plan.id)));
    setMyParticipantIds((items) => {
      const next = items.filter((item) => availablePlanKeys.has(planKey(item.id)));
      return next.length === items.length ? items : next;
    });
  }, [allPlans]);

  useEffect(() => {
    let cancelled = false;
    const pruneLocalPlanCache = async () => {
      try {
        const ownRemotePlans = await fetchPlansByAuthor(currentUserId);
        if (cancelled) return;
        const existingOwnPlanIds = new Set(ownRemotePlans.filter((plan) => plan.hidden !== true).map((plan) => planKey(plan.id)));
        const localRealCreatedIds = createdPlans
          .filter((plan) => !isDemoCommunityPlanId(plan.id) && plan.author.id === currentUserId)
          .map((plan) => planKey(plan.id));
        const participantRealIds = myParticipantIds
          .map((item) => planKey(item.id))
          .filter((id) => !isDemoCommunityPlanId(id));
        const idsToCheck = Array.from(new Set([...localRealCreatedIds, ...participantRealIds]))
          .filter((id) => !existingOwnPlanIds.has(id));
        const checkedPlans = await Promise.all(idsToCheck.map(async (id) => [id, await fetchPlan(id)] as const));
        if (cancelled) return;
        const existingPlanIds = new Set(existingOwnPlanIds);
        checkedPlans.forEach(([id, plan]) => {
          if (plan && plan.hidden !== true) existingPlanIds.add(id);
        });
        setCreatedPlans((plans) => {
          const next = plans.filter((plan) => isDemoCommunityPlanId(plan.id) || plan.author.id !== currentUserId || existingPlanIds.has(planKey(plan.id)));
          return next.length === plans.length ? plans : next;
        });
        setMyParticipantIds((items) => {
          const next = items.filter((item) => isDemoCommunityPlanId(item.id) || existingPlanIds.has(planKey(item.id)));
          return next.length === items.length ? items : next;
        });
      } catch (error) {
        console.error("Supabase local plan cache prune failed", error);
      }
    };

    void pruneLocalPlanCache();
    return () => {
      cancelled = true;
    };
  }, [currentUserId, refreshTick]);

  useEffect(() => {
    const cleanedFollowing = myFollowing.map(sanitizeConnection);
    writeJson(followingStorageKey, cleanedFollowing);
  }, [followingStorageKey, myFollowing]);

  useEffect(() => {
    writeJson(chatThreadIdsStorageKey, chatThreads.map((thread) => thread.peer.id));
    chatThreads.forEach((thread) => writeJson(chatThreadStorageKey(thread.peer.id), sanitizeChatThread(thread)));
  }, [chatThreadIdsStorageKey, chatThreads]);

  const navigate = (s: Screen, from?: Screen) => {
    if (s === "home" || s === "plans" || s === "chats" || (s === "profile" && !from)) {
      setNavStack([]);
      setProfileSourceTab(s === "profile" ? "profile" : s);
    } else {
      pushNavSnapshot();
    }
    if (s === "detail" && from) setDetailOrigin(from);
    if (s === "create") setCreateOrigin(from ?? screen);
    if (s === "search") setSearchOrigin(from ?? screen);
    if (s === "profile") setViewingOwnProfile(!from);
    setPreviousScreen(screen);
    setScreen(s);
  };

  const acceptTerms = async () => {
    const acceptedAt = new Date().toISOString();
    track("terms_accepted", {});
    try {
      window.localStorage.setItem(termsAcceptedStorageKey, "true");
    } catch (error) {
      console.error("localStorage terms accepted write failed", error);
    }
    try {
      await acceptProfileTerms(editableProfile, acceptedAt);
    } catch (error) {
      console.error("Supabase terms accepted update failed", error);
    } finally {
      setTermsAccepted(true);
    }
  };

  const openArticle = (a: Article, from: Screen) => {
    pushNavSnapshot();
    setActiveArticle(a);
    setArticleOrigin(from);
    setScreen("article");
  };

  const openPlanEvent = (id: PlanId, from: Screen = "plans") => {
    const source = planSourceFromScreen(from);
    pushNavSnapshot();
    setActivePlanId(id);
    setPlanEventOrigin(from);
    setPlanEventSource(source);
    setPreviousScreen(screen);
    setScreen("planEvent");
    track("plan_view", { plan_id: planKey(id), source });
    if (isDemoCommunityPlanId(id)) return;
    void fetchPlan(planKey(id)).then((remotePlan) => {
      if (!remotePlan || remotePlan.hidden) return;
      const sanitizedPlan = sanitizePlan(remotePlan);
      const replaceOrPrepend = (plans: HomeFeedPlan[]) =>
        plans.some((plan) => planKey(plan.id) === planKey(sanitizedPlan.id))
          ? plans.map((plan) => planKey(plan.id) === planKey(sanitizedPlan.id) ? sanitizedPlan : plan)
          : [sanitizedPlan, ...plans];
      setRemotePublicPlans(replaceOrPrepend);
      setCreatedPlans((plans) => plans.map((plan) => planKey(plan.id) === planKey(sanitizedPlan.id) ? sanitizedPlan : plan));
      setProfileRemotePlans((items) => Object.fromEntries(Object.entries(items).map(([authorId, plans]) => [authorId, plans.map((plan) => planKey(plan.id) === planKey(sanitizedPlan.id) ? sanitizedPlan : plan)])));
    }).catch((error) => {
      console.error("Supabase plan refresh before open failed", error);
    });
  };

  const openExpertProfile = (expertId: string) => {
    if (!isDemoProfileId(expertId)) {
      void fetchProfile(expertId).then((profile) => {
        if (profile) setRemoteProfiles((items) => ({ ...items, [profile.id]: normalizeProfile(profile) }));
      }).catch((error) => {
        console.error("Supabase profile fetch before open failed", error);
      });
    }
    pushNavSnapshot();
    if (screen !== "profile" && screen !== "profileConnections") setProfileSourceTab(currentRootTab);
    setViewingExpertId(expertId);
    setViewingOwnProfile(false);
    setPreviousScreen(screen);
    setScreen("profile");
  };

  const openSearchProfile = (profile: ExpertProfile) => {
    const normalizedProfile = normalizeProfile(profile);
    setRemoteProfiles((items) => ({ ...items, [normalizedProfile.id]: normalizedProfile }));
    openExpertProfile(normalizedProfile.id);
  };

  const openConnectionProfile = (connection: ExpertConnection) => {
    if (isDemoProfileId(connection.id)) {
      openExpertProfile(connection.id);
      return;
    }
    const fallbackProfile = normalizeProfile({
      ...expertProfile,
      id: connection.id,
      telegramId: Number(connection.id) || 0,
      name: connection.name,
      bio: "",
      photoUrl: connection.avatarUrl,
      photoUrls: connection.avatarUrl ? [connection.avatarUrl] : [],
      coverUrls: null,
      isMe: false,
      isFollowedByMe: (connectionSetsByUser[currentUserId]?.following ?? []).some((item) => item.id === connection.id),
    });
    delete fallbackProfile.cannedReplies;
    setRemoteProfiles((items) => ({ ...items, [connection.id]: items[connection.id] ?? fallbackProfile }));
    openExpertProfile(connection.id);
    void fetchProfile(connection.id).then((profile) => {
      if (profile) setRemoteProfiles((items) => ({ ...items, [profile.id]: normalizeProfile(profile) }));
    }).catch((error) => {
      console.error("Supabase connection profile fetch failed", error);
    });
  };

  const openChatPeerProfile = (peer: ChatPeer) => {
    const localExpert = experts.find((expert) => expert.id === peer.id);
    if (localExpert) {
      openExpertProfile(peer.id);
      return;
    }
    const fallbackProfile = normalizeProfile({
      ...expertProfile,
      id: peer.id,
      telegramId: Number(peer.id) || 0,
      name: peer.name,
      bio: "",
      photoUrl: peer.avatarUrl,
      photoUrls: peer.avatarUrl ? [peer.avatarUrl] : [],
      coverUrls: null,
      isMe: false,
      isFollowedByMe: false,
    });
    delete fallbackProfile.cannedReplies;
    setRemoteProfiles((items) => ({ ...items, [peer.id]: items[peer.id] ?? fallbackProfile }));
    openExpertProfile(peer.id);
    void fetchProfile(peer.id).then((profile) => {
      if (profile) setRemoteProfiles((items) => ({ ...items, [profile.id]: normalizeProfile(profile) }));
    }).catch((error) => {
      console.error("Supabase chat peer profile fetch failed", error);
    });
  };

  const getCannedPeer = (peer: ChatPeer): ChatPeer => {
    if (isNumericUserId(peer.id)) return asRealPeer(peer);
    if (isRealProfilePeer(peer, remoteProfiles)) return asRealPeer(peer);
    const expert = experts.find((item) => item.id === peer.id);
    if (expert) {
      return { id: expert.id, name: peer.name || expert.name, avatarUrl: peer.avatarUrl ?? expert.photoUrl, cannedReplies: expert.cannedReplies, isDemo: expert.isDemo };
    }
    const participant = participantChatPeers.find((item) => item.id === peer.id);
    if (participant) return participant;
    return peer;
  };

  const openChatWithPeer = (peer: ChatPeer) => {
    if (peer.id === currentUserId) return;
    const nextPeer = getCannedPeer(peer);
    if (nextPeer.id === currentUserId) return;
    pushNavSnapshot();
    setActiveChatPeer(nextPeer);
    setChatThreads((threads) => threads.map((thread) => thread.peer.id === nextPeer.id ? { ...thread, unreadCount: 0 } : thread));
    setPreviousScreen(screen);
    setScreen("chat");
  };

  const sendChatMessage = (peer: ChatPeer, text: string, sender: ChatMessage["sender"], status?: ChatMessage["status"], messageId = crypto.randomUUID()): ChatMessage | null => {
    const body = text.trim();
    if (!body) return null;
    const normalizedPeer = getCannedPeer(peer);
    if (normalizedPeer.readOnly) return null;
    const message: ChatMessage = {
      id: messageId,
      sender,
      text: body,
      createdAt: Date.now(),
      status,
    };
    setChatThreads((threads) => {
      const existing = threads.find((thread) => thread.peer.id === normalizedPeer.id);
      if (existing) {
        return threads.map((thread) => thread.peer.id === normalizedPeer.id
          ? { ...thread, peer: normalizedPeer, messages: sortChatMessages([...thread.messages, message]), updatedAt: message.createdAt }
          : thread);
      }
      return [{ peer: normalizedPeer, messages: [message], updatedAt: message.createdAt }, ...threads];
    });
    return message;
  };

  const receiveRemoteChatMessage = useCallback((peer: ChatPeer, message: ChatMessage) => {
    setChatThreads((threads) => {
      const existing = threads.find((thread) => thread.peer.id === peer.id);
      if (existing) {
        if (existing.messages.some((item) => item.id === message.id)) {
          return threads.map((thread) => thread.peer.id === peer.id
            ? {
                ...thread,
                peer,
                messages: sortChatMessages(thread.messages.map((item) => item.id === message.id ? { ...item, ...message } : item)),
                updatedAt: Math.max(thread.updatedAt, message.createdAt),
              }
            : thread);
        }
        return threads.map((thread) => thread.peer.id === peer.id
          ? { ...thread, peer, messages: sortChatMessages([...thread.messages, message]), updatedAt: message.createdAt }
          : thread);
      }
      return [{ peer, messages: [message], updatedAt: message.createdAt }, ...threads];
    });
  }, []);

  const confirmRemoteChatMessage = useCallback((peer: ChatPeer, localId: string, message: ChatMessage) => {
    setChatThreads((threads) => threads.map((thread) => {
      if (thread.peer.id !== peer.id) return thread;
      const hasRemoteMessage = thread.messages.some((item) => item.id === message.id);
      return {
        ...thread,
        peer,
        messages: sortChatMessages(thread.messages
          .filter((item) => !(hasRemoteMessage && item.id === localId))
          .map((item) => item.id === localId ? { ...item, ...message } : item)),
        updatedAt: Math.max(thread.updatedAt, message.createdAt),
      };
    }));
  }, []);

  const openProfileConnections = (type: ConnectionType, ownerIsCurrentUser = false, ownerId = currentUserId) => {
    pushNavSnapshot();
    if (!ownerIsCurrentUser) setProfileSourceTab(currentRootTab);
    setProfileConnectionsType(type);
    setProfileConnectionsCanEditFollowing(ownerIsCurrentUser);
    setProfileConnectionsOwnerId(ownerId);
    setPreviousScreen(screen);
    setScreen("profileConnections");
  };

  const addCatalogPlanToRoutine = (id: PlanId, source: PlanViewSource = planSourceFromScreen(screen)) => {
    const plan = allPlans.find((item) => planKey(item.id) === planKey(id));
    const ref = { kind: plan?.kind ?? "plan", id } satisfies ParticipantPlanRef;
    const key = participantKey(ref);
    const idKey = planKey(id);
    const currentPeer = { id: currentUserId, name: currentAuthor.name, avatarUrl: currentAuthor.avatarUrl, realUser: true } satisfies ChatPeer;
    const wasJoined = myParticipantIds.some((item) => participantKey(item) === key);
    const isAuthorJoiningOwnPlan = plan?.author.id === currentUserId;
    if (!wasJoined) track("plan_join", { plan_id: idKey, source });
    setMyParticipantIds((ids) => ids.some((item) => participantKey(item) === key) ? ids : [ref, ...ids]);
    setJoinedParticipantPeers((items) => ({
      ...items,
      [idKey]: items[idKey]?.some((peer) => peer.id === currentUserId) ? items[idKey] : [...(items[idKey] ?? []), currentPeer],
    }));
    if (!wasJoined && !isAuthorJoiningOwnPlan) setJoinedCounts((items) => ({ ...items, [idKey]: (items[idKey] ?? 0) + 1 }));
    void upsertPlanParticipant(idKey, currentUserId, "joined").catch((error) => {
      console.error("Supabase plan join failed", error);
      setMyParticipantIds((ids) => ids.filter((item) => participantKey(item) !== key));
      setJoinedParticipantPeers((items) => ({ ...items, [idKey]: (items[idKey] ?? []).filter((peer) => peer.id !== currentUserId) }));
      if (!wasJoined && !isAuthorJoiningOwnPlan) setJoinedCounts((items) => ({ ...items, [idKey]: Math.max(0, (items[idKey] ?? 1) - 1) }));
    });
  };

  const addPlanToMine = (id: PlanId) => {
    addCatalogPlanToRoutine(id);
    setViewingOwnProfile(true);
    setHighlightedPlanId(id);
    window.setTimeout(() => setHighlightedPlanId(null), 1500);
    setScreen(previousScreen === "profile" ? "profile" : "plans");
  };

  const removePlanFromMine = (id: PlanId, scope: "single" | "program" = "single", source: PlanViewSource = planSourceFromScreen(screen)) => {
    const plan = allPlans.find((item) => planKey(item.id) === planKey(id));
    const idsToRemove = scope === "program" && plan?.items?.length
      ? new Set([planKey(id), ...plan.items.map((item) => planKey(item.id))])
      : new Set([planKey(id)]);
    setMyParticipantIds((ids) => ids.filter((item) => !idsToRemove.has(planKey(item.id))));
    setCheckedItemKeys((keys) => keys.filter((key) => !Array.from(idsToRemove).some((planId) => key.endsWith(`:${planId}`))));
    idsToRemove.forEach((planId) => {
      const removedRef = { kind: "plan", id: planId } satisfies ParticipantPlanRef;
      const removedKey = participantKey(removedRef);
      const wasJoined = myParticipantIds.some((item) => participantKey(item) === removedKey);
      if (wasJoined) track("plan_leave", { plan_id: planId, source });
      const currentPeer = { id: currentUserId, name: currentAuthor.name, avatarUrl: currentAuthor.avatarUrl, realUser: true } satisfies ChatPeer;
      const isAuthorLeavingOwnPlan = plan?.author.id === currentUserId;
      setJoinedParticipantPeers((items) => ({ ...items, [planId]: (items[planId] ?? []).filter((peer) => peer.id !== currentUserId) }));
      if (!isAuthorLeavingOwnPlan) setJoinedCounts((items) => ({ ...items, [planId]: Math.max(0, (items[planId] ?? 1) - 1) }));
      void deletePlanParticipant(planId, currentUserId).catch((error) => {
        console.error("Supabase plan leave failed", error);
        if (wasJoined) setMyParticipantIds((ids) => ids.some((item) => participantKey(item) === removedKey) ? ids : [removedRef, ...ids]);
        setJoinedParticipantPeers((items) => ({
          ...items,
          [planId]: items[planId]?.some((peer) => peer.id === currentUserId) ? items[planId] : [...(items[planId] ?? []), currentPeer],
        }));
        if (!isAuthorLeavingOwnPlan) setJoinedCounts((items) => ({ ...items, [planId]: (items[planId] ?? 0) + 1 }));
      });
    });
  };

  const deletePlan = (id: PlanId) => {
    const plan = allPlans.find((item) => planKey(item.id) === planKey(id));
    if (plan?.author.id && plan.author.id !== currentUserId) return;
    const idKey = planKey(id);
    setDeletedPlanIds((ids) => ids.some((item) => planKey(item) === planKey(id)) ? ids : [id, ...ids]);
    setCreatedPlans((plans) => plans.filter((plan) => planKey(plan.id) !== idKey));
    setRemotePublicPlans((plans) => plans.filter((plan) => planKey(plan.id) !== idKey));
    setProfileRemotePlans((items) => Object.fromEntries(Object.entries(items).map(([authorId, plans]) => [
      authorId,
      plans.filter((plan) => planKey(plan.id) !== idKey),
    ])));
    setMyParticipantIds((ids) => ids.filter((item) => planKey(item.id) !== idKey));
    setCheckedItemKeys((keys) => keys.filter((key) => !key.endsWith(`:${idKey}`)));
    setJoinedCounts((items) => {
      const next = { ...items };
      delete next[idKey];
      return next;
    });
    setJoinedParticipantPeers((items) => {
      const next = { ...items };
      delete next[idKey];
      return next;
    });
    void deletePlanRemote(idKey).catch((error) => {
      console.error("Supabase plan delete failed", error);
    });
    setScreen("plans");
  };

  const editPlan = (plan: HomeFeedPlan) => {
    setEditingPlanId(plan.id);
    setCreateOrigin("planEvent");
    setScreen("create");
  };

  const updatePlan = (plan: HomeFeedPlan) => {
    const basePlan = allPlanDetails.find((item) => planKey(item.id) === planKey(plan.id)) ?? plan;
    const basePresentation = getPlanParticipantPresentation(basePlan);
    const sanitizedPlan = sanitizePlan({
      ...plan,
      participants: basePresentation.avatars.length ? basePresentation.avatars : basePlan.participants,
      participantsLabel: basePresentation.count > 0 ? basePresentation.label : basePlan.participantsLabel,
    });
    const idKey = planKey(sanitizedPlan.id);
    const replacePlan = (items: HomeFeedPlan[]) => items.map((item) => planKey(item.id) === idKey ? sanitizedPlan : item);
    setCreatedPlans(replacePlan);
    setRemotePublicPlans(replacePlan);
    setProfileRemotePlans((items) => Object.fromEntries(Object.entries(items).map(([authorId, plans]) => [authorId, replacePlan(plans)])));
    void (async () => {
      try {
        await updatePlanRemote(sanitizedPlan);
        const rows = await fetchParticipants(idKey);
        const participantIds = Array.from(new Set(rows
          .filter((row) => row.status === "joined")
          .map((row) => row.user_id)))
          .filter((participantId) => participantId !== currentUserId && !isDemoProfileId(participantId));
        await Promise.all(participantIds.map((participantId) => {
          const threadId = makeThreadId(currentUserId, participantId);
          return sendMessage({
            id: crypto.randomUUID(),
            threadId,
            senderId: currentUserId,
            text: `Пользователь ${currentAuthor.name} внес(ла) изменения в план «${sanitizedPlan.title}»`,
            kind: "plan_update",
            planId: idKey,
          });
        }));
      } catch (error) {
        console.error("Supabase plan update or participant notification failed", error);
      }
    })();
    setEditingPlanId(null);
    setActivePlanId(sanitizedPlan.id);
    setScreen("planEvent");
  };

  const canHidePlanFromHome = (plan: HomeFeedPlan) =>
    isModerator && plan.author.id !== currentUserId && !isDemoCommunityPlanId(plan.id);

  const hidePlanFromHome = (plan: HomeFeedPlan) => {
    if (!canHidePlanFromHome(plan)) return;
    const idKey = planKey(plan.id);
    setModeratorHiddenPlanIds((ids) => ids.some((id) => planKey(id) === idKey) ? ids : [plan.id, ...ids]);
    setRemotePublicPlans((plans) => plans.filter((item) => planKey(item.id) !== idKey));
    setCreatedPlans((plans) => plans.filter((item) => planKey(item.id) !== idKey));
    setProfileRemotePlans((items) => Object.fromEntries(Object.entries(items).map(([authorId, plans]) => [
      authorId,
      plans.filter((item) => planKey(item.id) !== idKey),
    ])));
    setMyParticipantIds((items) => items.filter((item) => planKey(item.id) !== idKey));
    setCheckedItemKeys((keys) => keys.filter((key) => !key.endsWith(`:${idKey}`)));
    void setPlanHidden(planKey(plan.id), true).catch((error) => {
      console.error("Supabase plan hide failed", error);
      setModeratorHiddenPlanIds((ids) => ids.filter((id) => planKey(id) !== planKey(plan.id)));
    });
  };

  const clearAppStorageAndReload = () => {
    try {
      Object.keys(window.localStorage)
        .filter((key) => key.startsWith("wellwellwell:") || key.startsWith("startParamConsumed:"))
        .forEach((key) => window.localStorage.removeItem(key));
      Object.keys(window.sessionStorage)
        .filter((key) => key.startsWith("startParamConsumed:") || key.startsWith("wellwellwell:"))
        .forEach((key) => window.sessionStorage.removeItem(key));
    } catch (error) {
      console.error("Local account reset failed", error);
    }
    window.location.reload();
  };

  const deleteAccount = async () => {
    try {
      const authoredPlans = await fetchPlansByAuthor(currentUserId);
      const authoredPlanIds = authoredPlans.map((plan) => planKey(plan.id));
      await deleteUserPlanParticipants(currentUserId);
      await deletePlanParticipantsForPlans(authoredPlanIds);
      await deleteCommentsByAuthor(currentUserId);
      await deleteUserMessages(currentUserId);
      await deleteUserFollows(currentUserId);
      await deletePlansByAuthor(currentUserId);
      await deleteProfile(currentUserId);
      clearAppStorageAndReload();
    } catch (error) {
      console.error("Supabase account delete failed", error);
      setAppToast("Не удалось удалить аккаунт, попробуй позже");
      window.setTimeout(() => setAppToast(""), 2600);
    }
  };

  const toggleCheckedItem = (key: string) => {
    setCheckedItemKeys((keys) => {
      const checked = keys.includes(key);
      if (!checked) track("plan_check", { plan_id: planIdFromProgressKey(key) });
      return checked ? keys.filter((item) => item !== key) : [...keys, key];
    });
  };

  const createPlan = (plans: HomeFeedPlan[], result: CreatedPlanResult) => {
    const sanitizedPlans = plans.map(sanitizePlan);
    const ids = sanitizedPlans.map((plan) => plan.id);
    setCreatedPlans((items) => [...sanitizedPlans, ...items.filter((item) => !ids.includes(item.id))]);
    setHighlightedPlanId(ids[0]);
    window.setTimeout(() => setHighlightedPlanId(null), 1500);
    setViewingOwnProfile(true);
    sanitizedPlans.forEach((plan) => {
      void createPlanRemote(plan).then((remotePlan) => {
        track("plan_created", { plan_id: planKey(remotePlan?.id ?? plan.id) });
        if (!remotePlan) return;
        setCreatedPlans((items) => items.map((item) => planKey(item.id) === planKey(plan.id) ? remotePlan : item));
        setHighlightedPlanId(remotePlan.id);
        void upsertPlanParticipant(planKey(remotePlan.id), currentUserId, "joined").catch((error) => {
          console.error("Supabase plan author participant failed", error);
        });
        result.participants.forEach((participantId) => {
          if (isDemoProfileId(participantId)) return;
          const threadId = makeThreadId(currentUserId, participantId);
          const messageId = crypto.randomUUID();
          const text = `${currentAuthor.name} приглашает тебя в план «${remotePlan.title}»`;
          void upsertPlanParticipant(planKey(remotePlan.id), participantId, "invited").catch((error) => {
            console.error("Supabase plan invite participant failed", error);
          });
          void sendMessage({
            id: messageId,
            threadId,
            senderId: currentUserId,
            text,
            kind: "invite",
            planId: planKey(remotePlan.id),
          }).catch((error) => {
            console.error("Supabase plan invite message failed", error);
          });
        });
      }).catch((error) => {
        console.error("Supabase plan create failed", error);
      });
    });
  };

  const acceptInvitePlan = (plan: HomeFeedPlan) => {
    const sanitizedPlan = sanitizePlan(plan);
    setCreatedPlans((items) => items.some((item) => planKey(item.id) === planKey(sanitizedPlan.id)) ? items : [sanitizedPlan, ...items]);
    const ref = { kind: "plan", id: sanitizedPlan.id } satisfies ParticipantPlanRef;
    setMyParticipantIds((items) => items.some((item) => participantKey(item) === participantKey(ref)) ? items : [ref, ...items]);
  };

  const adjustProfileFollowersCount = (profile: ExpertProfile, delta: number) => {
    setProfileFollowCounts((items) => {
      const current = items[profile.id] ?? {
        followers: profile.followersCount,
        following: profile.followingCount,
      };
      return {
        ...items,
        [profile.id]: {
          ...current,
          followers: Math.max(0, current.followers + delta),
        },
      };
    });
  };

  const setOptimisticFollowState = (profile: ExpertProfile, nextFollowed: boolean) => {
    const connection = sanitizeConnection({ id: profile.id, name: profile.name, avatarUrl: profile.photoUrl, isFollowedByMe: true });
    const meConnection = sanitizeConnection({ id: currentUserId, name: currentAuthor.name, avatarUrl: currentAuthor.avatarUrl, isFollowedByMe: false });
    setConnectionSetsByUser((items) => {
      const mySets = items[currentUserId] ?? { followers: localDemoFollowersFor(currentUserId), following: localDemoFollowingFor(currentUserId) };
      const targetSets = items[profile.id] ?? { followers: localDemoFollowersFor(profile.id), following: localDemoFollowingFor(profile.id) };
      return {
        ...items,
        [currentUserId]: {
          ...mySets,
          following: nextFollowed
            ? dedupeConnections([connection, ...mySets.following])
            : mySets.following.filter((item) => item.id !== profile.id),
        },
        [profile.id]: {
          ...targetSets,
          followers: nextFollowed
            ? dedupeConnections([meConnection, ...targetSets.followers])
            : targetSets.followers.filter((item) => item.id !== currentUserId),
        },
      };
    });
  };

  const toggleFollowing = (profile: ExpertProfile, nextFollowed: boolean) => {
    if (!isDemoProfile(profile)) {
      const connection = { id: profile.id, name: profile.name, avatarUrl: profile.photoUrl, isFollowedByMe: true };
      const wasFollowed = (connectionSetsByUser[currentUserId]?.following ?? []).some((item) => item.id === profile.id);
      if (wasFollowed === nextFollowed) return;
      if (nextFollowed) track("follow", { target_id: profile.id, target_is_demo: false });
      setOptimisticFollowState(profile, nextFollowed);
      setDbFollowing((items) => nextFollowed
        ? items.some((item) => item.id === profile.id) ? items : [connection, ...items]
        : items.filter((item) => item.id !== profile.id));
      adjustProfileFollowersCount(profile, nextFollowed ? 1 : -1);
      void (nextFollowed ? follow(currentUserId, profile.id) : unfollow(currentUserId, profile.id)).catch((error) => {
        console.error("Supabase follow update failed", error);
        setOptimisticFollowState(profile, !nextFollowed);
        setDbFollowing((items) => nextFollowed
          ? items.filter((item) => item.id !== profile.id)
          : items.some((item) => item.id === profile.id) ? items : [connection, ...items]);
        adjustProfileFollowersCount(profile, nextFollowed ? -1 : 1);
      }).finally(() => {
        void Promise.all([
          loadConnectionSets(currentUserId),
          loadConnectionSets(profile.id),
        ]).catch((error) => {
          console.error("Supabase follows reload failed", error);
        });
      });
      return;
    }
    const wasDemoFollowed = myFollowing.some((item) => item.id === profile.id)
      || dbFollowingIds.has(profile.id)
      || (connectionSetsByUser[currentUserId]?.following ?? []).some((item) => item.id === profile.id);
    if (wasDemoFollowed === nextFollowed) return;
    const connection = { id: profile.id, name: profile.name, avatarUrl: profile.photoUrl, isFollowedByMe: true };
    if (nextFollowed) track("follow", { target_id: profile.id, target_is_demo: true });
    setMyFollowing((items) => {
      if (!nextFollowed) return items.filter((item) => item.id !== profile.id);
      if (items.some((item) => item.id === profile.id)) return items;
      return [connection, ...items];
    });
    setConnectionSetsByUser((items) => {
      const mySets = items[currentUserId] ?? { followers: localDemoFollowersFor(currentUserId), following: localDemoFollowingFor(currentUserId) };
      return {
        ...items,
        [currentUserId]: {
          ...mySets,
          following: nextFollowed
            ? dedupeConnections([connection, ...mySets.following])
            : mySets.following.filter((item) => item.id !== profile.id),
        },
      };
    });
    void (nextFollowed ? follow(currentUserId, profile.id) : unfollow(currentUserId, profile.id)).catch((error) => {
      console.error("Supabase demo follow update failed", error);
      setMyFollowing((items) => nextFollowed
        ? items.filter((item) => item.id !== profile.id)
        : items.some((item) => item.id === profile.id) ? items : [connection, ...items]);
      setConnectionSetsByUser((items) => {
        const mySets = items[currentUserId] ?? { followers: localDemoFollowersFor(currentUserId), following: localDemoFollowingFor(currentUserId) };
        return {
          ...items,
          [currentUserId]: {
            ...mySets,
            following: nextFollowed
              ? mySets.following.filter((item) => item.id !== profile.id)
              : dedupeConnections([connection, ...mySets.following]),
          },
        };
      });
    }).finally(() => {
      void loadConnectionSets(currentUserId).catch((error) => {
        console.error("Supabase follows reload failed", error);
      });
    });
  };

  const renderScreen = () => {
    switch (screen) {
      case "home":
        return (
          <HomeScreen
            plans={publicPlans}
            onNavigate={navigate}
            onPlanOpen={(id) => openPlanEvent(id, "home")}
            onAuthorOpen={openExpertProfile}
            onMessagePeer={openChatWithPeer}
            canMessageAuthor={(authorId) => authorId !== currentUserId && !isDemoProfileId(authorId)}
            canHidePlan={canHidePlanFromHome}
            onHidePlan={hidePlanFromHome}
            initialScrollTop={homeScrollTopRef.current}
            onScrollTopChange={(scrollTop) => {
              homeScrollTopRef.current = scrollTop;
            }}
          />
        );
      case "plans":
        return (
          <PlansScreen
            onNavigate={navigate}
            onPlanOpen={(id) => openPlanEvent(id, "plans")}
            participantPlans={myPlans}
            checkedItemKeys={checkedItemKeys}
            onToggleCheck={toggleCheckedItem}
            onRemoveParticipant={removePlanFromMine}
            highlightedPlanId={highlightedPlanId}
          />
        );
      case "create":
        return (
          <CreateScreen
            onNavigate={(next) => {
              if (next !== "create") setEditingPlanId(null);
              navigate(next);
            }}
            backTo={createOrigin}
            onCreatePlan={createPlan}
            onUpdatePlan={updatePlan}
            currentAuthor={currentAuthor}
            editingPlan={editingPlanId ? allPlanDetails.find((plan) => planKey(plan.id) === planKey(editingPlanId)) ?? null : null}
          />
        );
      case "chats":
        return <ChatsScreen threads={chatThreads} onOpenThread={openChatWithPeer} currentUserId={currentUserId} availablePeers={chatSearchPeers} />;
      case "chat": {
        if (!activeChatPeer) return <ChatsScreen threads={chatThreads} onOpenThread={openChatWithPeer} currentUserId={currentUserId} availablePeers={chatSearchPeers} />;
        const thread = chatThreads.find((item) => item.peer.id === activeChatPeer.id);
        return (
          <ChatScreen
            peer={getCannedPeer(activeChatPeer)}
            messages={thread?.messages ?? []}
            currentUserId={currentUserId}
            myAvatarUrl={editableProfile.photoUrl}
            onBack={() => goBackInStack(previousScreen === "chat" ? "chats" : previousScreen)}
            onSendMessage={sendChatMessage}
            onReceiveRemoteMessage={receiveRemoteChatMessage}
            onConfirmRemoteMessage={confirmRemoteChatMessage}
            onPeerProfile={openChatPeerProfile}
            onAcceptInvitePlan={acceptInvitePlan}
            onPlanOpen={(planId) => openPlanEvent(planId, "chat")}
          />
        );
      }
      case "detail":
        return <DetailScreen onNavigate={navigate} backTo={detailOrigin} />;
      case "article":
        return activeArticle
          ? <ArticleScreen article={activeArticle} onBack={() => setScreen(articleOrigin)} onProfile={() => setScreen("profile")} />
          : null;
      case "search":
        return (
          <SearchScreen
            onBack={() => goBackInStack("home")}
            plans={searchOrigin === "plans" ? myPlans : publicPlans}
            onPlanOpen={(id) => openPlanEvent(id, "search")}
            currentUserId={currentUserId}
            onProfile={openSearchProfile}
            onMessagePeer={(peer) => openChatWithPeer(asRealPeer(peer))}
            canMessageProfile={canMessageProfile}
          />
        );
      case "profile":
        const baseViewedProfile = viewingOwnProfile
          ? editableProfile
          : remoteProfiles[viewingExpertId] ?? experts.find((expert) => expert.id === viewingExpertId && expert.isDemo === true) ?? buildUnknownProfile(viewingExpertId);
        const loadedViewedConnectionSets = connectionSetsByUser[baseViewedProfile.id];
        const viewedConnectionSets = loadedViewedConnectionSets ?? {
          followers: localDemoFollowersFor(baseViewedProfile.id),
          following: localDemoFollowingFor(baseViewedProfile.id),
        };
        const viewedFollowersCount = loadedViewedConnectionSets
          ? loadedViewedConnectionSets.followers.length
          : isDemoProfile(baseViewedProfile) ? baseViewedProfile.followersCount : viewedConnectionSets.followers.length;
        const viewedFollowingCount = loadedViewedConnectionSets
          ? loadedViewedConnectionSets.following.length
          : isDemoProfile(baseViewedProfile) ? baseViewedProfile.followingCount : viewedConnectionSets.following.length;
        const viewedProfile = viewingOwnProfile
          ? {
              ...baseViewedProfile,
              followersCount: viewedFollowersCount,
              followingCount: viewedFollowingCount,
            }
          : {
              ...baseViewedProfile,
              followersCount: viewedFollowersCount,
              followingCount: viewedFollowingCount,
              isFollowedByMe: isDemoProfile(baseViewedProfile)
                ? myFollowing.some((item) => item.id === baseViewedProfile.id)
                  || dbFollowingIds.has(baseViewedProfile.id)
                  || (connectionSetsByUser[currentUserId]?.following ?? []).some((item) => item.id === baseViewedProfile.id)
                : (connectionSetsByUser[currentUserId]?.following ?? []).some((item) => item.id === baseViewedProfile.id),
            };
        const isCurrentUserProfile = viewedProfile.id === currentUserId;
        const viewedRemotePlans = (profileRemotePlans[viewedProfile.id] ?? []).map((plan) => {
          const joinedCount = joinedCounts[planKey(plan.id)];
          return joinedCount === undefined ? plan : { ...plan, participantsLabel: `${1 + joinedCount} чел.` };
        });
        const viewedPlans = isCurrentUserProfile
          ? myPlans
          : [...viewedRemotePlans, ...allPlans.filter((plan) => (plan.author.id ?? currentUserId) === viewedProfile.id)]
              .filter((plan, index, plans) => plans.findIndex((item) => planKey(item.id) === planKey(plan.id)) === index);
        return (
          <ProfileScreen
            onNavigate={navigate}
            onArticle={a => openArticle(a, "profile" as Screen)}
            onPlanOpen={id => { openPlanEvent(id, "profile"); }}
            onConnectionsOpen={(type) => openProfileConnections(type, isCurrentUserProfile, viewedProfile.id)}
            onEdit={() => setScreen("editProfile")}
            onBack={() => goBackInStack(previousScreen)}
            onAddPlan={() => {
              setPreviousScreen("profile");
              setScreen("addPlan");
            }}
            onRemovePlan={removePlanFromMine}
            onToggleFollow={toggleFollowing}
              onMessageProfile={(peer) => openChatWithPeer(viewedProfile.isDemo && !isNumericUserId(peer.id) ? { ...peer, isDemo: true } : asRealPeer(peer))}
            canMessage={canMessageProfile(viewedProfile)}
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
            onDeleteAccount={deleteAccount}
            onSave={(profile) => {
              const normalizedProfile = normalizeProfile(profile);
              setEditableProfile(normalizedProfile);
              void upsertProfile(normalizedProfile).catch((error) => {
                console.error("Supabase profile save failed", error);
              });
              setScreen("profile");
            }}
          />
        );
      case "addPlan":
        return (
          <AddPlanScreen
            plans={publicPlans}
            selectedPlanIds={myParticipantIds.map((item) => item.id)}
            onBack={() => goBackInStack(previousScreen)}
            onAddPlan={addPlanToMine}
            onCreate={() => {
              setCreateOrigin("plans");
              setScreen("create");
            }}
          />
        );
      case "profileConnections":
        const connectionsOwnerId = profileConnectionsOwnerId || currentUserId;
        const connectionSets = connectionSetsByUser[connectionsOwnerId] ?? {
          followers: localDemoFollowersFor(connectionsOwnerId),
          following: localDemoFollowingFor(connectionsOwnerId),
        };
        return (
          <ProfileConnectionsScreen
            type={profileConnectionsType}
            onBack={() => goBackInStack(previousScreen)}
            onProfileOpen={openConnectionProfile}
            canEditFollowing={profileConnectionsCanEditFollowing}
            followerItems={connectionSets.followers}
            followingItems={connectionSets.following}
            onToggleFollowing={(id) => {
              const targetConnection = connectionSets.following.find((item) => item.id === id);
              if (isDemoProfileId(id)) {
                setMyFollowing((items) => items.filter((item) => item.id !== id));
                setConnectionSetsByUser((items) => {
                  const current = items[currentUserId];
                  if (!current) return items;
                  return {
                    ...items,
                    [currentUserId]: {
                      ...current,
                      following: current.following.filter((item) => item.id !== id),
                    },
                  };
                });
                return;
              }
              setConnectionSetsByUser((items) => {
                const current = items[currentUserId];
                const target = items[id];
                return {
                  ...items,
                  ...(current ? {
                    [currentUserId]: {
                      ...current,
                      following: current.following.filter((item) => item.id !== id),
                    },
                  } : {}),
                  ...(target ? {
                    [id]: {
                      ...target,
                      followers: target.followers.filter((item) => item.id !== currentUserId),
                    },
                  } : {}),
                };
              });
              setDbFollowing((items) => items.filter((item) => item.id !== id));
              void unfollow(currentUserId, id).catch((error) => {
                console.error("Supabase unfollow from list failed", error);
                if (targetConnection) {
                  setConnectionSetsByUser((items) => {
                    const current = items[currentUserId] ?? { followers: localDemoFollowersFor(currentUserId), following: localDemoFollowingFor(currentUserId) };
                    return {
                      ...items,
                      [currentUserId]: {
                        ...current,
                        following: dedupeConnections([targetConnection, ...current.following]),
                      },
                    };
                  });
                }
              }).finally(() => {
                void Promise.all([
                  loadConnectionSets(currentUserId),
                  loadConnectionSets(id),
                ]).catch((error) => {
                  console.error("Supabase follows reload failed", error);
                });
              });
            }}
          />
        );
      case "planEvent": {
        const feedPlan = allPlanDetails.find(plan => plan.id === activePlanId);
        if (feedPlan) {
          const participantItems = getPlanParticipantItems(feedPlan);
          const participantAvatars = participantItems.map((participant) => participant.avatarUrl).filter((url): url is string => Boolean(url));
          const participantCount = getPlanParticipantPresentation(feedPlan).count;
          const authorProfile = feedPlan.author.id
            ? remoteProfiles[feedPlan.author.id]
              ?? experts.find((expert) => expert.id === feedPlan.author.id && expert.isDemo === true)
              ?? buildUnknownProfile(feedPlan.author.id)
            : null;
          const detailProfileById = {
            ...Object.fromEntries(experts.map((profile) => [profile.id, { name: profile.name, avatarUrl: profile.photoUrl }])),
            ...Object.fromEntries(Object.values(remoteProfiles).map((profile) => [profile.id, { name: profile.name, avatarUrl: profile.photoUrl }])),
            [currentUserId]: { name: currentAuthor.name, avatarUrl: currentAuthor.avatarUrl },
            ...(feedPlan.author.id ? { [feedPlan.author.id]: { name: authorProfile?.name ?? feedPlan.author.name, avatarUrl: authorProfile?.photoUrl ?? feedPlan.author.avatarUrl } } : {}),
          };
          const isAuthorFollowedByMe = authorProfile
            ? isDemoProfile(authorProfile)
              ? myFollowing.some((item) => item.id === authorProfile.id)
                || dbFollowingIds.has(authorProfile.id)
                || (connectionSetsByUser[currentUserId]?.following ?? []).some((item) => item.id === authorProfile.id)
              : (connectionSetsByUser[currentUserId]?.following ?? []).some((item) => item.id === authorProfile.id)
            : false;
          return (
            <EventDetailScreen
              title={feedPlan.isChallenge ? `Челлендж: ${feedPlan.title}` : feedPlan.title}
              coverSrc={feedPlan.coverUrl as string | undefined}
              backgroundGradient={feedPlan.gradient}
              tag={feedPlan.tag}
              schedule={feedPlan.schedule}
              shareUrl={getPlanDeepLink(feedPlan)}
              participantAvatars={participantAvatars}
              participantsLabel={`${participantCount} чел.`}
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
                participants: participantCount,
                plusN: participantCount > participantAvatars.length ? `+${participantCount - participantAvatars.length}` : "",
                joinLabel: "Присоединиться",
              }}
              format={feedPlan.format}
              duration={feedPlan.duration}
              onBack={() => goBackInStack(planEventOrigin)}
              planId={feedPlan.id}
              externalJoinUrl={feedPlan.externalJoinUrl}
              initiallyJoined={feedPlan.author.id === currentUserId || myParticipantIds.some((item) => item.id === feedPlan.id)}
              onJoin={(id) => addCatalogPlanToRoutine(id, planSourceFromScreen(planEventOrigin))}
              onLeave={(id) => removePlanFromMine(id, "single", planEventSource)}
              onProfile={() => feedPlan.author.id ? openExpertProfile(feedPlan.author.id) : setScreen("profile")}
              onProfileOpen={openExpertProfile}
              onMessageAuthor={feedPlan.author.id === currentUserId || isDemoProfileId(feedPlan.author.id) ? undefined : (peer) => openChatWithPeer({ ...peer, id: feedPlan.author.id ?? peer.id })}
              isAuthorFollowedByMe={isAuthorFollowedByMe}
              onToggleAuthorFollow={authorProfile && feedPlan.author.id !== currentUserId ? (nextFollowed) => toggleFollowing({
                ...authorProfile,
                name: authorProfile.name || feedPlan.author.name,
                photoUrl: authorProfile.photoUrl ?? feedPlan.author.avatarUrl,
              }, nextFollowed) : undefined}
              participantItems={participantItems}
              onMessageParticipant={isDemoCommunityPlanId(feedPlan.id) ? undefined : openChatWithPeer}
              currentAuthor={currentAuthor}
              canDelete={feedPlan.author.id === currentUserId}
              onDelete={() => deletePlan(feedPlan.id)}
              canEdit={feedPlan.author.id === currentUserId}
              onEdit={() => editPlan(feedPlan)}
              canHide={canHidePlanFromHome(feedPlan)}
              onHide={() => {
                hidePlanFromHome(feedPlan);
                setScreen(planEventOrigin);
              }}
              refreshKey={refreshTick}
              profileById={detailProfileById}
            />
          );
        }
        return <WorkInProgress />;
      }
    }
  };

  if (!termsAccepted) {
    return <WelcomeScreen onAccept={acceptTerms} />;
  }

  const showNav = !NO_BOTTOM_NAV.includes(screen);
  const unreadChatsCount = chatThreads
    .filter((thread) => !isDemoPeer(thread.peer))
    .reduce((sum, thread) => sum + (thread.unreadCount ?? 0), 0);

  return (
    <div
      className="flex flex-col w-full h-screen overflow-hidden bg-white"
      style={{ fontFamily: "var(--font-sans)", height: "100dvh" }}
    >
      {appToast && (
        <div
          className="fixed left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-[14px] font-medium text-white shadow-lg"
          style={{ top: "calc(env(safe-area-inset-top) + 14px)", backgroundColor: GREEN }}
        >
          {appToast}
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {renderScreen()}
      </div>
      {showNav && (
        <div className={`flex-shrink-0 flex items-center justify-around bg-white px-2 pb-safe pt-2 ${screen === "profile" ? "" : "border-t border-gray-200"}`}
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
        >
          {([
            { id: "home" as Screen, label: "Лента", Icon: Newspaper },
            { id: "plans" as Screen, label: "Мои планы", Icon: Calendar },
            { id: "create" as Screen, label: "Создать", Icon: Plus },
            { id: "chats" as Screen, label: "Чаты", Icon: MessageCircle },
            { id: "profile" as Screen, label: "Профиль", Icon: User },
          ] as { id: Screen; label: string; Icon: React.FC<{ size: number; strokeWidth: number; color: string }> }[]).map(({ id, label, Icon }) => {
            const isActive = (id === "profile" ? screen === "profile" && viewingOwnProfile : screen === id)
              || (id !== "profile" && (screen === "profile" || screen === "profileConnections") && profileSourceTab === id)
              || (id === "plans" && (screen === "detail" || screen === "planEvent") && planEventOrigin === "plans")
              || (id === "home" && (screen === "search" || (screen === "planEvent" && planEventOrigin === "home")));
            return (
              <button
                key={id}
                onClick={() => {
                  setNavStack([]);
                  setProfileSourceTab(id === "profile" ? "profile" : id);
                  navigate(id, id === "create" ? screen : undefined);
                }}
                className="relative flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1"
              >
                <span className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 1.7} color={isActive ? GREEN : "#9CA3AF"} />
                  {id === "chats" && unreadChatsCount > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white" style={{ backgroundColor: GREEN }}>
                      {unreadChatsCount > 99 ? "99+" : unreadChatsCount}
                    </span>
                  )}
                </span>
                <span className="whitespace-nowrap text-[10px] font-medium" style={{ color: isActive ? GREEN : "#9CA3AF" }}>{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
