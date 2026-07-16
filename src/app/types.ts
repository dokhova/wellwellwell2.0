export type Screen = "home" | "plans" | "create" | "chats" | "chat" | "detail" | "article" | "search" | "planEvent" | "profile" | "profileConnections" | "editProfile" | "addPlan";

export interface Article {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  authorVerified?: boolean;
  readTime: string;
  coverUrl: string | null;
  avatarUrl: string | null;
  avatarBrand?: boolean;
}

export const PLAN_TAGS = ["running", "cycling", "yoga", "fitness", "recovery", "other"] as const;
export type PlanTag = typeof PLAN_TAGS[number];
export type TagFilter = PlanTag | "all";

export type TimeMode = "exact" | "partOfDay";
export type PartOfDay = "morning" | "day" | "evening";
export type Visibility = "all" | "onlyMe";
export type PlanKind = "plan";
export type PlanId = string | number;
export type ParticipantPlanRef = { kind: PlanKind; id: PlanId };

export interface ChatPeer {
  id: string;
  name: string;
  avatarUrl: string | null;
  cannedReplies?: string[];
  realUser?: boolean;
  isDemo?: boolean;
  isSaved?: boolean;
  onToggleSaved?: () => void;
  readOnly?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "me" | "peer";
  text: string;
  createdAt: number;
  readAt?: number | null;
  status?: "sending" | "sent";
  kind?: "text" | "invite" | "plan_update";
  planId?: string | null;
  inviteStatus?: "accepted" | "declined" | null;
}

export interface ChatThread {
  peer: ChatPeer;
  messages: ChatMessage[];
  updatedAt: number;
  pinned?: boolean;
  unreadCount?: number;
}
export type PlanRepeat =
  | { type: "none" }
  | { type: "days"; days: number }
  | { type: "weekly"; until?: string }
  | { type: "untilWeek"; week: number }
  | { type: "forever" };
export type ScheduleEnd =
  | { type: "never" }
  | { type: "date"; date: string }
  | { type: "weeks"; weeks: number };

export interface Schedule {
  timeMode?: TimeMode;
  mode?: TimeMode;
  time: string | null;
  partOfDay: PartOfDay | null;
  weekdays: number[];
  end?: ScheduleEnd | string;
  start?: string;
  repeat?: PlanRepeat;
  repeatUntilDate?: string;
}

export interface HomeFeedPlan {
  id: PlanId;
  kind?: PlanKind;
  visibility?: Visibility;
  hidden?: boolean;
  tag?: PlanTag;
  isChallenge?: boolean;
  format?: "online" | "offline";
  duration?: string;
  level?: "well" | "veryWell" | "tooWell";
  distanceLabel?: string;
  photos?: string[];
  authorSubtitle?: string;
  title: string;
  description: string;
  habit?: {
    title: string;
    durationMin: number;
  };
  coverUrl?: string;
  gradient?: string;
  schedule: Schedule;
  participants: string[];
  participantsLabel: string;
  timeDate: string;
  address?: string;
  lat?: number;
  lng?: number;
  author: {
    id?: string;
    name: string;
    avatarUrl: string | null;
  };
  externalJoinUrl?: string;
  shareUrl?: string;
  items?: HomeFeedPlan[];
}

export interface EventMeta {
  date: string;
  time: string;
  location: string;
  locationSub: string;
  participants: number;
  plusN: string;
  joinLabel: string;
}

export interface EventDetailProps {
  title: string;
  coverSrc?: string;
  backgroundGradient?: string;
  tag?: PlanTag;
  schedule?: Schedule;
  shareUrl?: string;
  participantAvatars?: string[];
  participantsLabel?: string;
  authorName: string;
  authorAvatarUrl: string | null;
  authorVerified?: boolean;
  readTime?: string;
  badgeDate: string;
  paragraphs: string[];
  meta: EventMeta;
  format?: "online" | "offline";
  duration?: string;
  level?: "well" | "veryWell" | "tooWell";
  distanceLabel?: string;
  photos?: string[];
  authorSubtitle?: string;
  participantCount?: number;
  isDemo?: boolean;
  onBack: () => void;
  initiallyJoined?: boolean;
  planId?: PlanId;
  onJoin?: (planId: PlanId) => void;
  externalJoinUrl?: string;
  onLeave?: (planId: PlanId) => void;
  onProfile?: () => void;
  authorId?: string;
  onMessageAuthor?: (peer: ChatPeer) => void;
  isAuthorFollowedByMe?: boolean;
  onToggleAuthorFollow?: (nextFollowed: boolean) => void;
  participantItems?: ChatPeer[];
  onMessageParticipant?: (peer: ChatPeer) => void;
  onProfileOpen?: (profileId: string) => void;
  profileById?: Record<string, { name: string; avatarUrl: string | null }>;
  currentAuthor?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  canDelete?: boolean;
  onDelete?: () => void;
  canEdit?: boolean;
  onEdit?: () => void;
  canHide?: boolean;
  onHide?: () => void;
  refreshKey?: number;
}

export type Period = "День" | "Неделя" | "Месяц";
