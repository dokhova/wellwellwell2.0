export type Screen = "home" | "plans" | "create" | "detail" | "article" | "search" | "planEvent" | "profile" | "profileConnections" | "editProfile" | "addPlan";

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

export const PLAN_TAGS = ["running", "cycling", "yoga", "recovery", "other"] as const;
export type PlanTag = typeof PLAN_TAGS[number];
export type TagFilter = PlanTag | "all";

export type TimeMode = "exact" | "partOfDay";
export type PartOfDay = "morning" | "day" | "evening";
export type Visibility = "all" | "onlyMe";
export type PlanRepeat =
  | { type: "days"; days: number }
  | { type: "weekly" }
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
  id: number;
  tag?: PlanTag;
  isChallenge?: boolean;
  format?: "online" | "offline";
  duration?: string;
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
  shareUrl: string;
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
  onBack: () => void;
  initiallyJoined?: boolean;
  planId?: number;
  onJoin?: (planId: number) => void;
  onLeave?: (planId: number) => void;
  onProfile?: () => void;
}

export type Period = "День" | "Неделя" | "Месяц";
