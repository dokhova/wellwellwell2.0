import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowUp, Bookmark, CheckSquare, ChevronRight, Copy, Edit3, Eye, Heart, MessageCircle, Paperclip, Plus, Repeat2, Share2, Trash2, UserPlus, Users, X } from "lucide-react";
import type { EventDetailProps } from "@/app/types";
import { normalizePlanTag, PLAN_TAG_LABELS } from "@/app/data/plans";
import { ALL_DAYS, GREEN, PART_OF_DAY_RANGES, PLAN_DARK, UNSPLASH, WEEKDAY_VALUES } from "@/app/data/constants";
import { HomeSheet } from "@/app/components/HomeSheet";
import { addComment, deleteComment, fetchCommentLikes, fetchComments, likeComment, unlikeComment, type CommentRow } from "@/app/lib/api/comments";
import { fetchProfilesByIds } from "@/app/lib/api/profiles";
import { track } from "@/app/lib/analytics";
import { uploadPhoto } from "@/app/lib/api/storage";
import { pluralizeParticipants } from "@/app/lib/pluralize";

type MentionCandidate = { id: string; name: string; avatarUrl: string | null };
type LocalComment = { id: string; authorId: string | null; author: string; avatarUrl: string | null; time: string; text: string; photoUrl: string | null; parentId: string | null; mentionedUserIds: string[]; persisted: boolean };

const MENTION_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g;
const COVER_MASK = "linear-gradient(180deg, #000 0%, #000 52%, rgba(0,0,0,0.96) 60%, rgba(0,0,0,0.85) 68%, rgba(0,0,0,0.68) 76%, rgba(0,0,0,0.45) 84%, rgba(0,0,0,0.22) 91%, rgba(0,0,0,0.07) 96%, transparent 100%)";
type DraftMention = { id: string; name: string };

const formatCommentTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
};

const normalizeAvatarUrl = (value?: string | null) => {
  const url = value?.trim();
  return url && !url.startsWith("blob:") ? url : null;
};

const mapCommentRow = (row: CommentRow): LocalComment => ({
  id: row.id,
  authorId: row.author_id,
  author: row.author_name,
  avatarUrl: normalizeAvatarUrl(row.author_avatar_url),
  time: formatCommentTime(row.created_at),
  text: row.text,
  photoUrl: row.photo_url,
  parentId: row.parent_id,
  mentionedUserIds: row.mentioned_user_ids ?? [],
  persisted: true,
});

const extractMentionedUserIds = (text: string) => {
  const ids = new Set<string>();
  for (const match of text.matchAll(MENTION_REGEX)) {
    const id = match[2]?.trim();
    if (id) ids.add(id);
  }
  return Array.from(ids);
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const serializeDraftMentions = (text: string, mentions: DraftMention[]) => {
  let serialized = text;
  const usedIds = new Set<string>();

  mentions.forEach((mention) => {
    if (usedIds.has(mention.id)) return;
    const pattern = new RegExp(`@${escapeRegExp(mention.name)}(?=\\s|$|[.,!?;:])`, "g");
    serialized = serialized.replace(pattern, `@[${mention.name}](${mention.id})`);
    usedIds.add(mention.id);
  });

  return serialized;
};

const getMentionTrigger = (text: string, cursor: number | null) => {
  if (cursor === null) return null;
  const beforeCursor = text.slice(0, cursor);
  const match = beforeCursor.match(/(^|\s)@([^\s@]*)$/);
  if (!match) return null;
  const query = match[2] ?? "";
  return { start: beforeCursor.length - query.length - 1, end: cursor, query };
};

function CommentText({ text, onProfileOpen }: { text: string; onProfileOpen?: (profileId: string) => void }) {
  const parts: Array<string | { name: string; id: string; key: string }> = [];
  let lastIndex = 0;

  for (const match of text.matchAll(MENTION_REGEX)) {
    const index = match.index ?? 0;
    if (index > lastIndex) parts.push(text.slice(lastIndex, index));
    parts.push({ name: match[1] ?? "", id: match[2] ?? "", key: `${index}-${match[2]}` });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return (
    <p className="mt-1 text-[15px] leading-[1.45] text-white">
      {parts.map((part, index) => typeof part === "string" ? (
        <span key={index}>{part}</span>
      ) : (
        <button
          key={part.key}
          type="button"
          onClick={() => onProfileOpen?.(part.id)}
          className="inline font-medium active:opacity-80"
          style={{ color: PLAN_DARK.accent }}
        >
          @{part.name}
        </button>
      ))}
    </p>
  );
}

function DescriptionText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return <>{parts.map((part, index) => /^https?:\/\//.test(part) ? <button key={`${part}-${index}`} type="button" onClick={() => { const openLink = window.Telegram?.WebApp?.openLink; if (openLink) openLink(part); else window.open(part, "_blank", "noopener,noreferrer"); }} className="inline break-all text-left underline underline-offset-2" style={{ color: PLAN_DARK.accent }}>{part}</button> : <span key={index}>{part}</span>)}</>;
}

function CommentsBlock({
  comment,
  setComment,
  comments,
  onSend,
  currentAuthor,
  planAuthorId,
  onDelete,
  onProfileOpen,
  mentionCandidates,
  onMentionSelected,
  profileById,
  photoPreviewUrl,
  photoUploadProgress,
  photoUrl,
  onPhotoSelected,
  onPhotoRemoved,
  likesByComment,
  expandedReplies,
  onToggleReplies,
  onLike,
  onReply,
  focusRequestKey,
}: {
  comment: string;
  setComment: (v: string) => void;
  comments: LocalComment[];
  onSend: () => void;
  currentAuthor?: { id: string; name: string; avatarUrl: string | null };
  planAuthorId?: string;
  onDelete: (comment: LocalComment) => void;
  onProfileOpen?: (profileId: string) => void;
  mentionCandidates: MentionCandidate[];
  onMentionSelected: (mention: DraftMention) => void;
  profileById: Record<string, { name: string; avatarUrl: string | null }>;
  photoPreviewUrl: string | null;
  photoUploadProgress: number | null;
  photoUrl: string | null;
  onPhotoSelected: (file: File) => void;
  onPhotoRemoved: () => void;
  likesByComment: Record<string, string[]>;
  expandedReplies: Set<string>;
  onToggleReplies: (commentId: string) => void;
  onLike: (comment: LocalComment) => void;
  onReply: (comment: LocalComment) => void;
  focusRequestKey: number;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [mentionTrigger, setMentionTrigger] = useState<{ start: number; end: number; query: string } | null>(null);
  const canSend = photoUploadProgress === null && (comment.trim().length > 0 || Boolean(photoUrl));
  const filteredMentionCandidates = mentionTrigger
    ? mentionCandidates.filter((candidate) => candidate.name.toLowerCase().includes(mentionTrigger.query.toLowerCase()))
    : [];
  const roots = comments.filter((item) => !item.parentId);
  const repliesByRoot = comments.reduce<Record<string, LocalComment[]>>((groups, item) => {
    if (item.parentId) (groups[item.parentId] ??= []).push(item);
    return groups;
  }, {});

  useEffect(() => {
    if (focusRequestKey > 0) window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [focusRequestKey]);

  const updateMentionTrigger = (value: string, cursor: number | null) => {
    setMentionTrigger(getMentionTrigger(value, cursor));
  };

  const insertMention = (candidate: MentionCandidate) => {
    if (!mentionTrigger) return;
    const mention = `@${candidate.name}`;
    const nextComment = `${comment.slice(0, mentionTrigger.start)}${mention} ${comment.slice(mentionTrigger.end)}`;
    const nextCursor = mentionTrigger.start + mention.length + 1;
    setComment(nextComment);
    onMentionSelected({ id: candidate.id, name: candidate.name });
    setMentionTrigger(null);
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const renderComment = (item: LocalComment, isReply = false) => {
    const canDelete = Boolean(currentAuthor && (item.authorId === currentAuthor.id || planAuthorId === currentAuthor.id));
    const resolvedAuthor = item.authorId ? profileById[item.authorId] : null;
    const authorName = resolvedAuthor?.name ?? item.author;
    const authorAvatarUrl = normalizeAvatarUrl(resolvedAuthor?.avatarUrl ?? item.avatarUrl);
    const likes = likesByComment[item.id] ?? [];
    const likedByMe = Boolean(currentAuthor && likes.includes(currentAuthor.id));
    return <div key={item.id} className={`flex gap-3 ${isReply ? "ml-11" : ""}`}>
      <button onClick={() => item.authorId && onProfileOpen?.(item.authorId)} className="h-9 w-9 flex-shrink-0 rounded-full active:opacity-80" aria-label="Открыть профиль"><AuthorAvatar name={authorName} avatarUrl={authorAvatarUrl} size={36} /></button>
      <div className="min-w-0 flex-1"><div className="flex items-baseline gap-2"><p className="truncate text-[12px] font-medium uppercase tracking-wide" style={{ color: PLAN_DARK.textSecondary }}>{authorName}</p><span className="text-[11px]" style={{ color: PLAN_DARK.textSecondary }}>{item.time}</span></div><CommentText text={item.text} onProfileOpen={onProfileOpen} />{item.photoUrl && <img loading="lazy" decoding="async" src={item.photoUrl} alt="" className="mt-2 max-h-48 rounded-xl object-cover" />}<div className="mt-2 flex items-center gap-3"><button onClick={() => onReply(item)} disabled={!item.persisted} className="text-[14px] disabled:opacity-40" style={{ color: PLAN_DARK.textSecondary }}>Ответить</button>{canDelete && <button onClick={() => onDelete(item)} className="text-[12px]" style={{ color: PLAN_DARK.textSecondary }}>Удалить</button>}</div></div>
      <button onClick={() => onLike(item)} disabled={!item.persisted || !currentAuthor} className="flex w-7 flex-shrink-0 flex-col items-center gap-0.5 disabled:opacity-40" style={{ color: likedByMe ? PLAN_DARK.accent : PLAN_DARK.textSecondary }} aria-label={likedByMe ? "Убрать лайк" : "Поставить лайк"}><Heart size={18} fill={likedByMe ? PLAN_DARK.accent : "none"} />{likes.length > 0 && <span className="text-[11px]">{likes.length}</span>}</button>
    </div>;
  };

  return (
    <section className="px-4 pb-8 pt-6">
      <h3 className="mb-3 text-[12px] font-medium uppercase tracking-[0.08em]" style={{ color: PLAN_DARK.textSecondary }}>{comments.length} комментариев</h3>
      <div className="rounded-xl" style={{ background: PLAN_DARK.card }}>
        <div className="max-h-[60vh] space-y-5 overflow-y-auto p-4">
          {roots.map((item) => {
            const replies = repliesByRoot[item.id] ?? [];
            const expanded = expandedReplies.has(item.id);
            return <div key={item.id} className="space-y-4">{renderComment(item)}{replies.length > 0 && <button onClick={() => onToggleReplies(item.id)} className="ml-11 flex items-center gap-2 text-[13px]" style={{ color: PLAN_DARK.textSecondary }}><span className="h-px w-5" style={{ background: PLAN_DARK.textSecondary }} />{expanded ? "Скрыть ответы" : `Открыть ${replies.length} ${replies.length === 1 ? "ответ" : replies.length < 5 ? "ответа" : "ответов"}`}</button>}{expanded && <div className="space-y-4">{replies.map((reply) => renderComment(reply, true))}</div>}</div>;
          })}
        </div>
        <div className="relative border-t p-3" style={{ borderColor: PLAN_DARK.divider }}>
        {photoPreviewUrl && (
          <div className="relative mb-2 ml-[42px] h-16 w-16 overflow-hidden rounded-xl">
            <img src={photoPreviewUrl} alt="" className="h-full w-full object-cover" />
            {photoUploadProgress !== null && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60">
                <span className="text-[13px] font-semibold text-white">{photoUploadProgress}%</span>
              </div>
            )}
            <button type="button" onClick={onPhotoRemoved} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/65 text-white" aria-label="Удалить фото">
              <X size={12} />
            </button>
          </div>
        )}
        {mentionTrigger && filteredMentionCandidates.length > 0 && (
          <div className="absolute bottom-full left-10 right-3 z-20 mb-2 max-h-56 overflow-y-auto rounded-xl border py-1 shadow-lg" style={{ borderColor: PLAN_DARK.divider, background: "#1C1C1F" }}>
            {filteredMentionCandidates.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  insertMention(candidate);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left active:opacity-80"
              >
                <AuthorAvatar name={candidate.name} avatarUrl={candidate.avatarUrl} size={28} />
                <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-white">{candidate.name}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2.5">
          <AuthorAvatar name={currentAuthor?.name ?? "Вы"} avatarUrl={currentAuthor?.avatarUrl ?? null} size={36} />
          <div className="flex flex-1 items-center gap-2 rounded-full px-3 py-1.5" style={{ background: "rgba(255,255,255,0.10)" }}>
          <input
            ref={inputRef}
            value={comment}
            onChange={(event) => {
              setComment(event.target.value);
              updateMentionTrigger(event.target.value, event.target.selectionStart);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape" || event.key === " ") setMentionTrigger(null);
            }}
            onClick={(event) => updateMentionTrigger(comment, event.currentTarget.selectionStart)}
            onBlur={() => window.setTimeout(() => setMentionTrigger(null), 120)}
            placeholder="Написать"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-white placeholder:text-white/50 outline-none"
          />
          <label className="flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center text-white/60"><Paperclip size={18} /><input type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) onPhotoSelected(file); }} /></label>
          <button
            onClick={onSend}
            disabled={!canSend}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity"
            style={{
              backgroundColor: "#FFFFFF",
              opacity: canSend ? 1 : 0.7,
            }}
          >
            <ArrowUp size={17} strokeWidth={2.3} color={PLAN_DARK.bg} />
          </button>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}

function AuthorAvatar({ name, avatarUrl, size = 36 }: { name: string; avatarUrl: string | null; size?: number }) {
  if (avatarUrl) {
    return <img loading="lazy" decoding="async" src={avatarUrl} alt={name} className="flex-shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="flex flex-shrink-0 items-center justify-center rounded-full" style={{ width: size, height: size, backgroundColor: "var(--secondary)" }}>
      <span className="font-bold" style={{ color: GREEN, fontSize: Math.max(12, size * 0.34) }}>{initials}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mb-3 mt-6 text-[12px] font-medium uppercase tracking-[0.08em]" style={{ color: PLAN_DARK.textSecondary }}>{children}</h2>;
}

function SmallLabel({ children }: { children: ReactNode }) {
  return <span className="text-[13px]" style={{ color: PLAN_DARK.textSecondary }}>{children}</span>;
}

function DetailCard({ children }: { children: ReactNode }) {
  return <div className="rounded-xl p-4 text-left" style={{ background: PLAN_DARK.card }}>{children}</div>;
}

// ─── Unified EventDetailScreen ────────────────────────────────────────────────

export function EventDetailScreen({
  title, coverSrc, backgroundGradient, authorName, authorAvatarUrl, authorVerified,
  readTime, badgeDate, paragraphs, meta, format = "offline", duration, level, distanceLabel, photos = [], authorSubtitle, participantCount, isDemo, isSaved = false, onToggleSaved, tag, schedule, shareUrl,
  participantAvatars: planParticipantAvatars, participantsLabel, onBack, initiallyJoined, planId, onJoin, onLeave, onProfile,
  externalJoinUrl, authorId, onMessageAuthor, isAuthorFollowedByMe = false, onToggleAuthorFollow, participantItems, onMessageParticipant,
  currentAuthor, canDelete = false, onDelete, canEdit = false, onEdit, canHide = false, onHide, refreshKey, onProfileOpen, profileById = {},
}: EventDetailProps) {
  void authorVerified;
  void readTime;
  void badgeDate;
  void externalJoinUrl;
  void backgroundGradient;
  const [joined, setJoined] = useState(Boolean(initiallyJoined));
  const [toast, setToast] = useState("");
  const [sheet, setSheet] = useState<"participants" | "profile" | "share" | "photos" | null>(null);
  const [subscribed, setSubscribed] = useState(isAuthorFollowedByMe);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [comment, setComment] = useState("");
  const [commentPhotoUrl, setCommentPhotoUrl] = useState<string | null>(null);
  const [commentPhotoPreviewUrl, setCommentPhotoPreviewUrl] = useState<string | null>(null);
  const [commentPhotoUploadProgress, setCommentPhotoUploadProgress] = useState<number | null>(null);
  const commentPhotoUploadToken = useRef(0);
  const [draftMentions, setDraftMentions] = useState<DraftMention[]>([]);
  const [comments, setComments] = useState<LocalComment[]>([]);
  const [likesByComment, setLikesByComment] = useState<Record<string, string[]>>({});
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyRootId, setReplyRootId] = useState<string | null>(null);
  const [commentFocusKey, setCommentFocusKey] = useState(0);
  const [commentAuthorProfiles, setCommentAuthorProfiles] = useState<Record<string, { name: string; avatarUrl: string | null }>>({});
  const [copied, setCopied] = useState(false);
  const description = paragraphs.join("\n\n");
  const participantAvatars = planParticipantAvatars ?? [];
  const participants = participantItems?.length
    ? participantItems
    : participantAvatars.map((url, index) => ({ id: `participant-${index}`, name: "Участник", avatarUrl: url }));
  const mentionCandidates = useMemo(() => {
    const realParticipants = participants.filter((participant) =>
      participant.name !== "Участник" && !/(^|-)participant-\d+$/.test(participant.id)
    );
    const candidates: MentionCandidate[] = [
      { id: authorId ?? authorName, name: authorName, avatarUrl: authorAvatarUrl },
      ...realParticipants.map((participant) => ({
        id: participant.id,
        name: participant.name,
        avatarUrl: participant.avatarUrl,
      })),
    ];
    return candidates.filter((candidate, index, items) =>
      Boolean(candidate.id && candidate.name)
      && items.findIndex((item) => item.id === candidate.id) === index
    );
  }, [authorAvatarUrl, authorId, authorName, participants]);
  const organizerAction = onProfile ?? (() => setSheet("profile"));
  const needsDescriptionClamp = description.length > 260;
  const formatLabel = format === "online" ? "Онлайн" : "Офлайн";
  const tagLabel = tag ? PLAN_TAG_LABELS[normalizePlanTag(tag)] : "План";
  const resolvedParticipantCount = participantCount ?? meta.participants ?? participants.length;
  const participantCountLabel = participantsLabel ?? `${resolvedParticipantCount} чел.`;
  const overflowLabel = meta.plusN.startsWith("+") ? meta.plusN : "";
  const isOwnPlan = Boolean(currentAuthor?.id && authorId === currentAuthor.id);
  const isRepeating = Boolean(schedule?.repeat && schedule.repeat.type !== "none");
  const startDate = schedule?.start ? new Date(schedule.start) : null;
  const shortWeekday = startDate && !Number.isNaN(startDate.getTime())
    ? startDate.toLocaleDateString("ru-RU", { weekday: "short" }).replace(".", "").toUpperCase()
    : "";
  const partOfDayLabel = schedule?.partOfDay ? PART_OF_DAY_RANGES[schedule.partOfDay].label : "";
  const startTimeOnly = schedule?.time || (startDate && !Number.isNaN(startDate.getTime()) ? startDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : meta.time);
  const addressParts = meta.location.split(",").map((part) => part.trim()).filter(Boolean);
  const levelConfig = level ? {
    well: { title: "Well", subtitle: "Без подготовки", color: PLAN_DARK.levelWell, bars: 1 },
    veryWell: { title: "Very well", subtitle: "Базовая подготовка", color: PLAN_DARK.levelVeryWell, bars: 2 },
    tooWell: { title: "Too well", subtitle: "Уверенная подготовка", color: PLAN_DARK.levelTooWell, bars: 3 },
  }[level] : null;

  useEffect(() => () => {
    if (commentPhotoPreviewUrl) URL.revokeObjectURL(commentPhotoPreviewUrl);
  }, [commentPhotoPreviewUrl]);

  const removeCommentPhoto = () => {
    commentPhotoUploadToken.current += 1;
    setCommentPhotoPreviewUrl(null);
    setCommentPhotoUrl(null);
    setCommentPhotoUploadProgress(null);
  };

  const selectCommentPhoto = async (file: File) => {
    const token = commentPhotoUploadToken.current + 1;
    commentPhotoUploadToken.current = token;
    setCommentPhotoPreviewUrl(URL.createObjectURL(file));
    setCommentPhotoUrl(null);
    setCommentPhotoUploadProgress(0);
    const publicUrl = await uploadPhoto(file, {
      onProgress: (percent) => {
        if (commentPhotoUploadToken.current === token) setCommentPhotoUploadProgress(percent);
      },
    });
    if (commentPhotoUploadToken.current !== token) return;
    if (!publicUrl) {
      setCommentPhotoPreviewUrl(null);
      setCommentPhotoUrl(null);
      setCommentPhotoUploadProgress(null);
      return;
    }
    setCommentPhotoUrl(publicUrl);
    setCommentPhotoUploadProgress(null);
  };

  const weekdayLabel = (days: number[]) =>
    days
      .map((day) => ALL_DAYS[WEEKDAY_VALUES.indexOf(day)])
      .filter(Boolean)
      .join(", ");
  const weeklyDays = weekdayLabel(schedule?.weekdays ?? []).toUpperCase();

  const exactDateLabel = (value?: string) => {
    if (!value) return meta.date;
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? meta.date
      : date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  };

  const repeatEndDateLabel = () => {
    if (schedule?.repeat?.type !== "days" || !schedule.start) return "";
    const startDate = new Date(schedule.start);
    if (Number.isNaN(startDate.getTime())) return "";
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + Math.max(1, schedule.repeat.days) - 1);
    return endDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  };

  const exactTimeLabel = (start?: string, end?: string) => {
    if (!start) return meta.time;
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;
    const startTime = Number.isNaN(startDate.getTime())
      ? ""
      : startDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const endTime = endDate && !Number.isNaN(endDate.getTime())
      ? endDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
      : "";
    return endTime ? `${startTime} — ${endTime}` : startTime || meta.time;
  };

  const isWeeklyExactSchedule = (schedule?.mode === "exact" || schedule?.timeMode === "exact") && schedule?.repeat?.type === "weekly";
  const schedulePrimary =
    isWeeklyExactSchedule
      ? weekdayLabel(schedule.weekdays) || exactDateLabel(schedule.start)
      : schedule?.mode === "partOfDay" || schedule?.timeMode === "partOfDay"
      ? `${weekdayLabel(schedule.weekdays) || "Дни не выбраны"} · ${schedule.partOfDay ? PART_OF_DAY_RANGES[schedule.partOfDay].label : "Время суток"}`
      : schedule?.mode === "exact" || schedule?.timeMode === "exact"
        ? exactDateLabel(schedule.start)
        : meta.date;
  const scheduleSecondary =
    isWeeklyExactSchedule
      ? exactTimeLabel(schedule.start)
      : schedule?.mode === "exact" || schedule?.timeMode === "exact"
      ? [exactTimeLabel(schedule.start, typeof schedule.end === "string" ? schedule.end : undefined), repeatEndDateLabel() ? `до ${repeatEndDateLabel()}` : ""].filter(Boolean).join(" · ")
      : "";
  const exactScheduleWeekday = (() => {
    if (isWeeklyExactSchedule || !(schedule?.mode === "exact" || schedule?.timeMode === "exact") || !schedule.start) return "";
    const date = new Date(schedule.start);
    if (Number.isNaN(date.getTime())) return "";
    const label = date.toLocaleDateString("ru-RU", { weekday: "long" });
    return label ? `${label[0].toUpperCase()}${label.slice(1)}` : "";
  })();
  const scheduleDetailsSecondary = [exactScheduleWeekday, scheduleSecondary || duration].filter(Boolean).join(" · ");

  const showJoinToast = () => {
    setToast("Добавлено в Мои планы");
    window.setTimeout(() => setToast(""), 2200);
  };

  const joinPlan = () => {
    setJoined(true);
    if (planId !== undefined) onJoin?.(planId);
    showJoinToast();
  };

  const cancelJoin = () => {
    setJoined(false);
    if (planId !== undefined) onLeave?.(planId);
  };

  const toggleJoin = () => {
    if (isOwnPlan) return;
    if (joined) {
      cancelJoin();
    } else {
      joinPlan();
    }
  };

  useEffect(() => {
    setSubscribed(isAuthorFollowedByMe);
  }, [isAuthorFollowedByMe]);

  const toggleAuthorFollow = () => {
    const nextFollowed = !subscribed;
    setSubscribed(nextFollowed);
    onToggleAuthorFollow?.(nextFollowed);
  };

  useEffect(() => {
    if (planId === undefined) return;
    let cancelled = false;

    const loadComments = async () => {
      try {
        const [rows, likes] = await Promise.all([fetchComments(String(planId)), fetchCommentLikes(String(planId))]);
        if (!cancelled) {
          setComments((localItems) => [
            ...localItems.filter((item) => !item.persisted),
            ...rows.map(mapCommentRow),
          ]);
          setLikesByComment(Object.fromEntries(Array.from(new Set(likes.map((like) => like.comment_id))).map((commentId) => [commentId, likes.filter((like) => like.comment_id === commentId).map((like) => like.user_id)])));
        }
      } catch (error) {
        console.error("Supabase comments fetch failed", error);
      }
    };

    void loadComments();
    return () => {
      cancelled = true;
    };
  }, [planId, refreshKey]);

  useEffect(() => {
    const authorIds = Array.from(new Set(comments.map((item) => item.authorId).filter((id): id is string => Boolean(id))));
    const missingIds = authorIds.filter((id) => !profileById[id] && !commentAuthorProfiles[id]);
    if (missingIds.length === 0) return;
    let cancelled = false;
    void fetchProfilesByIds(missingIds).then((profiles) => {
      if (cancelled || profiles.length === 0) return;
      setCommentAuthorProfiles((items) => ({
        ...items,
        ...Object.fromEntries(profiles.map((profile) => [profile.id, { name: profile.name, avatarUrl: profile.photoUrl }])),
      }));
    }).catch((error) => {
      console.error("Supabase comment author profiles fetch failed", error);
    });
    return () => {
      cancelled = true;
    };
  }, [commentAuthorProfiles, comments, profileById]);

  const sendComment = () => {
    const draftText = comment.trim();
    if (!draftText && !commentPhotoUrl) return;
    const text = serializeDraftMentions(draftText, draftMentions);
    const photoUrl = commentPhotoUrl;
    const author = currentAuthor ?? { id: "local", name: "Вы", avatarUrl: UNSPLASH.userAvatar };
    const mentionedUserIds = extractMentionedUserIds(text);
    const localComment: LocalComment = {
      id: `local-${Date.now()}`,
      authorId: author.id,
      author: author.name,
      avatarUrl: normalizeAvatarUrl(author.avatarUrl),
      time: "сейчас",
      text,
      photoUrl,
      parentId: replyRootId,
      mentionedUserIds,
      persisted: false,
    };
    setComments((items) => [
      ...items,
      localComment,
    ]);
    setComment("");
    setDraftMentions([]);
    setReplyRootId(null);
    removeCommentPhoto();
    if (planId === undefined) return;
    track("comment_sent", { plan_id: String(planId), mentions_count: mentionedUserIds.length, has_photo: Boolean(photoUrl), is_reply: Boolean(replyRootId) });
    void addComment({
      planId: String(planId),
      authorId: author.id,
      authorName: author.name,
      authorAvatarUrl: author.avatarUrl,
      text,
      mentionedUserIds,
      photoUrl,
      parentId: replyRootId,
    }).then((savedComment) => {
      if (!savedComment) return;
      setComments((items) => items.map((item) => item.id === localComment.id ? mapCommentRow(savedComment) : item));
    }).catch((error) => {
      console.error("Supabase comment insert failed", error);
    });
  };

  const removeComment = (item: LocalComment) => {
    setComments((items) => items.filter((commentItem) => commentItem.id !== item.id && commentItem.parentId !== item.id));
    if (!item.persisted) return;
    void deleteComment(item.id).catch((error) => {
      console.error("Supabase comment delete failed", error);
    });
  };

  const toggleCommentLike = (item: LocalComment) => {
    if (!currentAuthor || !item.persisted) return;
    const previous = likesByComment[item.id] ?? [];
    const liked = previous.includes(currentAuthor.id);
    if (planId !== undefined) track("comment_like_toggled", { plan_id: String(planId), comment_id: item.id, liked: !liked });
    setLikesByComment((items) => ({ ...items, [item.id]: liked ? previous.filter((id) => id !== currentAuthor.id) : [...previous, currentAuthor.id] }));
    void (liked ? unlikeComment(item.id, currentAuthor.id) : likeComment(item.id, currentAuthor.id)).catch((error) => {
      console.error("Supabase comment like update failed", error);
      setLikesByComment((items) => ({ ...items, [item.id]: previous }));
    });
  };

  const beginReply = (item: LocalComment) => {
    const rootId = item.parentId ?? item.id;
    const resolvedAuthor = item.authorId ? profileById[item.authorId] ?? commentAuthorProfiles[item.authorId] : null;
    const name = resolvedAuthor?.name ?? item.author;
    const id = item.authorId ?? name;
    setReplyRootId(rootId);
    setComment(`@${name} `);
    setDraftMentions([{ id, name }]);
    setCommentFocusKey((value) => value + 1);
  };

  const copyText = async (value: string) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard?.writeText(value);
      return true;
    } catch {
      const input = document.createElement("textarea");
      input.value = value;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.select();
      const copiedFallback = document.execCommand("copy");
      document.body.removeChild(input);
      return copiedFallback;
    }
  };

  const copyShareLink = async () => {
    if (!shareUrl) return;
    await copyText(shareUrl);
    if (planId !== undefined) track("plan_link_copied", { plan_id: String(planId), screen: "plan" });
    setCopied(true);
  };

  const inviteFriends = () => {
    if (!shareUrl) return;
    void copyText(shareUrl);
    if (planId !== undefined) {
      track("plan_invite_clicked", {
        plan_id: String(planId),
        method: typeof navigator.share === "function" ? "native" : "fallback",
      });
    }

    const openShareFallback = () => {
      const openTelegramLink = window.Telegram?.WebApp?.openTelegramLink;
      if (openTelegramLink) {
        openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`);
        return;
      }
      setCopied(true);
      setSheet("share");
    };

    if (typeof navigator.share === "function") {
      void navigator.share({ title, url: shareUrl }).catch((error: unknown) => {
        if (error && typeof error === "object" && "name" in error && error.name === "AbortError") return;
        openShareFallback();
      });
      return;
    }

    openShareFallback();
  };

  const toggleSaved = () => {
    if (!isSaved && planId !== undefined) track("plan_save_clicked", { plan_id: String(planId) });
    onToggleSaved?.();
    if (!isSaved) {
      setToast("Сохранено в Мои планы");
      window.setTimeout(() => setToast(""), 1800);
    }
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden" style={{ background: PLAN_DARK.bg, color: PLAN_DARK.text }}>
      {coverSrc && <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden"><img src={coverSrc} alt="" className="h-full w-full object-cover opacity-70" style={{ filter: "blur(60px)", transform: "scale(1.3)" }} /><div className="absolute inset-0 bg-black/60" /></div>}
      {toast && (
        <div
          className="absolute left-1/2 z-40 -translate-x-1/2 rounded-full px-4 py-2 text-[14px] font-medium text-white shadow-lg"
          style={{ top: "calc(env(safe-area-inset-top) + 14px)", backgroundColor: PLAN_DARK.accent }}
        >
          {toast}
        </div>
      )}

      <div className="relative z-10 flex-1 overflow-y-auto pb-6">
          <div className="relative aspect-[4/5] w-full">
            <div className="absolute inset-0 overflow-hidden" style={{ maskImage: COVER_MASK, WebkitMaskImage: COVER_MASK }}>
              {coverSrc && <img loading="lazy" decoding="async" src={coverSrc} alt={title} className="h-full w-full object-cover" />}
            </div>
            <button onClick={onBack} className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm active:opacity-80" style={{ top: "calc(env(safe-area-inset-top) + 16px)" }} aria-label="Назад"><ArrowLeft size={20} /></button>
            <div className="absolute right-4 flex items-center gap-2" style={{ top: "calc(env(safe-area-inset-top) + 16px)" }}>
              {canDelete && (
                <button
                  onClick={() => {
                    const confirmed = window.confirm("Удалить план полностью? Он исчезнет из ленты и у всех, кто к нему присоединился");
                    if (confirmed) onDelete?.();
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm active:opacity-85"
                  aria-label="Удалить план"
                >
                  <Trash2 size={18} strokeWidth={2} color="#fff" />
                </button>
              )}
              {canEdit && (
                <button
                  onClick={onEdit}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm active:opacity-85"
                  aria-label="Редактировать план"
                >
                  <Edit3 size={18} strokeWidth={2} color="#fff" />
                </button>
              )}
              {canHide && (
                <button
                  onClick={() => {
                    const confirmed = window.confirm("Скрыть план из ленты?");
                    if (confirmed) onHide?.();
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm active:opacity-85"
                  aria-label="Скрыть из ленты"
                >
                  <Eye size={18} strokeWidth={2} color="#fff" />
                </button>
              )}
              {!isOwnPlan && <button onClick={organizerAction} className="h-10 w-10 overflow-hidden rounded-full bg-black/35 active:opacity-85" aria-label="Открыть профиль"><AuthorAvatar name={authorName} avatarUrl={authorAvatarUrl} size={40} /></button>}
            </div>
            <div className="absolute inset-x-4 bottom-5 flex flex-col items-center text-center">
              <span className="rounded-full px-3 py-1.5 text-[13px] font-medium text-white backdrop-blur-md" style={{ background: "rgba(255,255,255,0.18)" }}>{tagLabel}</span>
              <h1 className="mt-3 max-w-full text-[32px] font-bold leading-[1.08] text-white" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{title}</h1>
              <div className="mt-4 flex items-center justify-center gap-5 text-[14px]" style={{ color: PLAN_DARK.textSecondary }}>
                <span className="flex items-center gap-1.5"><MessageCircle size={18} />{comments.length}</span>
                <span className="flex items-center gap-1.5"><Users size={18} />{resolvedParticipantCount}</span>
                {shareUrl && <button onClick={() => { setCopied(false); setSheet("share"); }} className="ml-2 active:opacity-75" aria-label="Поделиться"><Share2 size={20} /></button>}
              </div>
            </div>
          </div>
          <div className="px-4">
            <div className={`grid ${isOwnPlan ? "grid-cols-2" : "grid-cols-3"} py-5 text-center`}>
              {!isOwnPlan && <button onClick={toggleJoin} className="flex flex-col items-center gap-1.5 rounded-xl py-3 text-[13px]" style={joined ? { color: PLAN_DARK.accent, background: "rgba(47,191,175,0.15)" } : undefined}>{joined ? <CheckSquare size={22} /> : <Plus size={22} />}<span>{joined ? "Участвую" : "Участвовать"}</span></button>}
              <button onClick={inviteFriends} className={`flex flex-col items-center gap-1.5 py-3 text-[13px] ${isOwnPlan ? "" : "border-l"}`} style={{ borderColor: PLAN_DARK.divider }}><UserPlus size={22} /><span>Пригласить</span></button>
              <button onClick={toggleSaved} className="flex flex-col items-center gap-1.5 border-l py-3 text-[13px]" style={{ borderColor: PLAN_DARK.divider, color: isSaved ? PLAN_DARK.accent : undefined }}><Bookmark size={22} fill={isSaved ? PLAN_DARK.accent : "none"} /><span>{isSaved ? "Сохранено" : "Сохранить"}</span></button>
            </div>

            <SectionTitle>Детали</SectionTitle>
            <div className="grid grid-cols-2 gap-2.5">
              <DetailCard><SmallLabel>{isWeeklyExactSchedule ? "Каждую неделю" : exactDateLabel(schedule?.start)}</SmallLabel><div className="mt-2 flex items-center gap-2 text-[28px] font-bold">{shortWeekday || weeklyDays}{isRepeating && <Repeat2 size={20} style={{ color: PLAN_DARK.textSecondary }} />}</div></DetailCard>
              <DetailCard><SmallLabel>Старт</SmallLabel><div className={`${partOfDayLabel ? "text-[17px]" : "text-[28px]"} mt-2 font-bold`}>{partOfDayLabel || startTimeOnly}</div></DetailCard>
              <button onClick={() => setSheet("participants")} className={`rounded-xl p-4 text-left active:opacity-85 ${format === "offline" && !meta.location ? "col-span-2" : ""}`} style={{ background: PLAN_DARK.card }}>
                <div className="flex items-center justify-between"><SmallLabel>{pluralizeParticipants(resolvedParticipantCount)}</SmallLabel><ChevronRight size={18} style={{ color: PLAN_DARK.textSecondary }} /></div>
                <div className="mt-3 flex items-center -space-x-2">{participants.slice(0, 5).map((participant, index) => <AuthorAvatar key={participant.id} name={participant.name} avatarUrl={participant.avatarUrl} size={index === Math.min(2, participants.length - 1) ? 44 : 28} />)}{overflowLabel && <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold">{overflowLabel}</span>}</div>
              </button>
              {format === "offline" && meta.location ? <DetailCard><SmallLabel>Где</SmallLabel><p className="mt-2 font-bold">{addressParts[0]}</p><p className="mt-1 text-[13px]" style={{ color: PLAN_DARK.textSecondary }}>{addressParts.slice(1).join(", ")}</p></DetailCard> : format === "online" ? <DetailCard><SmallLabel>Формат</SmallLabel><p className="mt-2 text-[24px] font-bold">Онлайн</p></DetailCard> : null}
            </div>

            {(levelConfig || distanceLabel || duration) && <><SectionTitle>Уровень</SectionTitle><div className="grid grid-cols-2 gap-2.5">{levelConfig && <DetailCard><SmallLabel>{levelConfig.subtitle}</SmallLabel><div className="mt-2 flex items-center justify-between text-[24px] font-bold"><span>{levelConfig.title}</span><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">{[0,1,2].map((bar) => <rect key={bar} x={2 + bar * 6} y={13 - bar * 4} width="4" height={5 + bar * 4} rx="1" fill={bar < levelConfig.bars ? levelConfig.color : "rgba(255,255,255,0.25)"} />)}</svg></div></DetailCard>}{(distanceLabel || duration) && <DetailCard><SmallLabel>{distanceLabel ? "Дистанция" : "Время"}</SmallLabel><p className="mt-2 text-[24px] font-bold">{distanceLabel || duration}</p></DetailCard>}</div></>}

            {description && <><SectionTitle>Описание</SectionTitle><div className="rounded-xl p-4 text-[15px] leading-[1.45]" style={{ background: PLAN_DARK.card }}><p style={!descriptionExpanded && needsDescriptionClamp ? { display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden", whiteSpace: "pre-line" } : { whiteSpace: "pre-line" }}><DescriptionText text={description} /></p>{needsDescriptionClamp && <button onClick={() => setDescriptionExpanded((value) => !value)} className="mt-1 font-medium" style={{ color: PLAN_DARK.accent }}>{descriptionExpanded ? "Свернуть" : "Подробнее"}</button>}</div></>}

            {photos.length > 0 && <button onClick={() => setSheet("photos")} className="mt-5 w-full rounded-xl p-4 text-left" style={{ background: PLAN_DARK.card }}><div className="mb-3 flex items-center justify-between text-[15px] font-semibold"><span>{photos.length} фото</span><ChevronRight size={18} /></div><div className="grid grid-cols-3 gap-2">{photos.slice(0,3).map((photo, index) => <img key={`${photo}-${index}`} src={photo} alt="" className="aspect-[4/3] w-full rounded-[10px] object-cover" />)}</div></button>}

            <div className="flex items-center gap-3 py-7"><button onClick={organizerAction}><AuthorAvatar name={authorName} avatarUrl={authorAvatarUrl} size={44} /></button><button onClick={organizerAction} className="min-w-0 flex-1 text-left"><p className="truncate text-[16px] font-semibold">{authorName}</p>{authorSubtitle && <p className="text-[13px]" style={{ color: PLAN_DARK.textSecondary }}>{authorSubtitle}</p>}</button>{onMessageAuthor && !isOwnPlan && isDemo !== true && <button onClick={() => onMessageAuthor({ id: authorId ?? authorName, name: authorName, avatarUrl: authorAvatarUrl })} className="text-[13px] font-medium" style={{ color: PLAN_DARK.accent }}>Написать</button>}{!isOwnPlan && onToggleAuthorFollow && <button onClick={toggleAuthorFollow} className="text-[13px] font-medium" style={{ color: subscribed ? PLAN_DARK.textSecondary : PLAN_DARK.accent }}>{subscribed ? "В подписках" : "+ Подписаться"}</button>}</div>
          </div>

        <CommentsBlock comment={comment} setComment={setComment} comments={comments} onSend={sendComment} currentAuthor={currentAuthor} planAuthorId={authorId} onDelete={removeComment} onProfileOpen={onProfileOpen} mentionCandidates={mentionCandidates} onMentionSelected={(mention) => setDraftMentions((items) => [...items.filter((item) => item.id !== mention.id), mention])} profileById={{ ...commentAuthorProfiles, ...profileById }} photoPreviewUrl={commentPhotoPreviewUrl} photoUploadProgress={commentPhotoUploadProgress} photoUrl={commentPhotoUrl} onPhotoSelected={(file) => { void selectCommentPhoto(file); }} onPhotoRemoved={removeCommentPhoto} likesByComment={likesByComment} expandedReplies={expandedReplies} onToggleReplies={(id) => setExpandedReplies((items) => { const next = new Set(items); if (next.has(id)) next.delete(id); else next.add(id); return next; })} onLike={toggleCommentLike} onReply={beginReply} focusRequestKey={commentFocusKey} />
      </div>

      {sheet === "participants" && (
        <HomeSheet title="Участники" onClose={() => setSheet(null)}>
          <div className="space-y-2">
            {participants.map((participant, i) => {
              return (
                <div key={`${participant.id}-${i}`} className="flex w-full items-center gap-3 rounded-2xl bg-gray-100 px-4 py-3 text-left">
                  <button
                    onClick={() => {
                      setSheet(null);
                      onProfileOpen?.(participant.id);
                    }}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full active:opacity-80"
                    aria-label="Открыть профиль"
                  >
                    {participant.avatarUrl ? (
                      <img loading="lazy" decoding="async" src={participant.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <span className="h-9 w-9 rounded-full bg-secondary" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSheet(null);
                      onProfileOpen?.(participant.id);
                    }}
                    className="min-w-0 flex-1 truncate text-left text-[15px] font-medium text-gray-900 active:opacity-80"
                  >
                    {participant.name}
                  </button>
                  {onMessageParticipant && (
                    <button
                      onClick={() => {
                        setSheet(null);
                        onMessageParticipant(participant);
                      }}
                      className="flex-shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold text-white"
                      style={{ backgroundColor: GREEN }}
                    >
                      Написать
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </HomeSheet>
      )}

      {sheet === "share" && shareUrl && (
        <HomeSheet title="Поделиться" onClose={() => setSheet(null)}>
          <button
            onClick={copyShareLink}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white"
            style={{ backgroundColor: GREEN }}
          >
            <Copy size={17} strokeWidth={2.2} />
            {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
          </button>
        </HomeSheet>
      )}

      {sheet === "photos" && (
        <HomeSheet title="Фото" onClose={() => setSheet(null)}>
          <div className="grid grid-cols-3 gap-1">
            {photos.map((photo, index) => <img key={`${photo}-${index}`} src={photo} alt="" className="aspect-square w-full rounded-lg object-cover" />)}
          </div>
        </HomeSheet>
      )}

      {sheet === "profile" && (
        <HomeSheet title="Профиль" onClose={() => setSheet(null)}>
          <div className="flex flex-col items-center py-4 text-center">
            <AuthorAvatar name={authorName} avatarUrl={authorAvatarUrl} size={64} />
            <p className="mt-3 text-[17px] font-semibold text-gray-900">{authorName}</p>
            <p className="mt-1 text-[14px] text-gray-400">Профиль организатора в работе.</p>
          </div>
        </HomeSheet>
      )}
    </div>
  );
}

// ─── Screen: Plan Detail ──────────────────────────────────────────────────────
