import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Calendar, Check, ChevronRight, Copy, Edit3, Eye, Image as ImageIcon, MapPin, Plus, Share2, Trash2, Users, Video, X } from "lucide-react";
import type { EventDetailProps } from "@/app/types";
import { normalizePlanTag, PLAN_TAG_GRADIENTS, PLAN_TAG_LABELS } from "@/app/data/plans";
import { ALL_DAYS, GREEN, PART_OF_DAY_RANGES, UNSPLASH, WEEKDAY_VALUES } from "@/app/data/constants";
import { HomeSheet } from "@/app/components/HomeSheet";
import { addComment, deleteComment, fetchComments, type CommentRow } from "@/app/lib/api/comments";
import { fetchProfilesByIds } from "@/app/lib/api/profiles";
import { track } from "@/app/lib/analytics";
import { uploadPhoto } from "@/app/lib/api/storage";
import { pluralizeParticipants } from "@/app/lib/pluralize";

type MentionCandidate = { id: string; name: string; avatarUrl: string | null };
type LocalComment = { id: string; authorId: string | null; author: string; avatarUrl: string | null; time: string; text: string; photoUrl: string | null; mentionedUserIds: string[]; persisted: boolean };

const MENTION_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g;
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
    <p className="mt-0.5 text-[14px] leading-5 text-foreground">
      {parts.map((part, index) => typeof part === "string" ? (
        <span key={index}>{part}</span>
      ) : (
        <button
          key={part.key}
          type="button"
          onClick={() => onProfileOpen?.(part.id)}
          className="inline font-medium active:opacity-80"
          style={{ color: "#00887F" }}
        >
          @{part.name}
        </button>
      ))}
    </p>
  );
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
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [mentionTrigger, setMentionTrigger] = useState<{ start: number; end: number; query: string } | null>(null);
  const canSend = photoUploadProgress === null && (comment.trim().length > 0 || Boolean(photoUrl));
  const filteredMentionCandidates = mentionTrigger
    ? mentionCandidates.filter((candidate) => candidate.name.toLowerCase().includes(mentionTrigger.query.toLowerCase()))
    : [];

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

  return (
    <div
      className="border-t border-border bg-surface px-4 pt-[18px] pb-6"
    >
      <h3 className="mb-3.5 flex items-center gap-2 text-[15px] font-semibold text-foreground">
        Комментарии <span className="text-[15px] font-normal text-muted-foreground">{comments.length}</span>
      </h3>
      <div className="relative mb-[18px]">
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
          <div className="absolute bottom-full left-10 right-0 z-20 mb-2 max-h-56 overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-lg">
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
                <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-foreground">{candidate.name}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2.5">
          <AuthorAvatar name={currentAuthor?.name ?? "Вы"} avatarUrl={currentAuthor?.avatarUrl ?? null} size={32} />
          <div className="flex-1 bg-input rounded-full px-3.5 py-[9px] flex items-center gap-2">
          <label className="flex h-6 w-6 flex-shrink-0 cursor-pointer items-center justify-center">
            <ImageIcon size={17} color="var(--muted-foreground)" />
            <input type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) onPhotoSelected(file); }} />
          </label>
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
            placeholder="Напишите комментарий..."
            className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            onClick={onSend}
            disabled={!canSend}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity"
            style={{
              backgroundColor: canSend ? GREEN : "var(--muted)",
              opacity: canSend ? 1 : 0.7,
            }}
          >
            <ChevronRight size={16} strokeWidth={2.3} color={canSend ? "#fff" : "var(--muted-foreground)"} />
          </button>
          </div>
        </div>
      </div>
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((item) => {
            const canDelete = currentAuthor && (item.authorId === currentAuthor.id || planAuthorId === currentAuthor.id);
            const resolvedAuthor = item.authorId ? profileById[item.authorId] : null;
            const authorName = resolvedAuthor?.name ?? item.author;
            const authorAvatarUrl = normalizeAvatarUrl(resolvedAuthor?.avatarUrl ?? item.avatarUrl);
            return (
            <div key={item.id} className="flex gap-2.5">
              <button
                onClick={() => {
                  if (item.authorId) onProfileOpen?.(item.authorId);
                }}
                className="h-8 w-8 flex-shrink-0 rounded-full active:opacity-80"
                aria-label="Открыть профиль"
              >
                <AuthorAvatar name={authorName} avatarUrl={authorAvatarUrl} size={32} />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="truncate text-[14px] font-medium text-foreground">{authorName}</p>
                  <span className="text-[12px] text-muted-foreground">{item.time}</span>
                </div>
                <CommentText text={item.text} onProfileOpen={onProfileOpen} />
                {item.photoUrl && <img loading="lazy" decoding="async" src={item.photoUrl} alt="" className="mt-1.5 max-h-48 rounded-xl object-cover" />}
              </div>
              {canDelete && (
                <button onClick={() => onDelete(item)} className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground active:opacity-80" aria-label="Удалить комментарий">
                  <Trash2 size={15} strokeWidth={2} />
                </button>
              )}
            </div>
            );
          })}
        </div>
      ) : (
        <div className="flex justify-center py-8">
          <p className="text-[13px] text-muted-foreground">Пока нет комментариев</p>
        </div>
      )}
    </div>
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

// ─── Unified EventDetailScreen ────────────────────────────────────────────────

export function EventDetailScreen({
  title, coverSrc, backgroundGradient, authorName, authorAvatarUrl, authorVerified,
  readTime, badgeDate, paragraphs, meta, format = "offline", duration, tag, schedule, shareUrl,
  participantAvatars: planParticipantAvatars, participantsLabel, onBack, initiallyJoined, planId, onJoin, onLeave, onProfile,
  authorId, onMessageAuthor, isAuthorFollowedByMe = false, onToggleAuthorFollow, participantItems, onMessageParticipant,
  currentAuthor, canDelete = false, onDelete, canEdit = false, onEdit, canHide = false, onHide, refreshKey, onProfileOpen, profileById = {},
}: EventDetailProps) {
  void authorVerified;
  void readTime;
  void badgeDate;
  const [joined, setJoined] = useState(Boolean(initiallyJoined));
  const [toast, setToast] = useState("");
  const [sheet, setSheet] = useState<"participants" | "profile" | "share" | null>(null);
  const [subscribed, setSubscribed] = useState(isAuthorFollowedByMe);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [comment, setComment] = useState("");
  const [commentPhotoUrl, setCommentPhotoUrl] = useState<string | null>(null);
  const [commentPhotoPreviewUrl, setCommentPhotoPreviewUrl] = useState<string | null>(null);
  const [commentPhotoUploadProgress, setCommentPhotoUploadProgress] = useState<number | null>(null);
  const commentPhotoUploadToken = useRef(0);
  const [draftMentions, setDraftMentions] = useState<DraftMention[]>([]);
  const [comments, setComments] = useState<LocalComment[]>([]);
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
  const participantCountLabel = participantsLabel ?? `${participants.length} чел.`;
  const overflowLabel = meta.plusN.startsWith("+") ? meta.plusN : "";
  const extraParticipantsCount = Number.parseInt(meta.plusN.replace(/\D/g, ""), 10);
  const extraParticipantsLabel = Number.isFinite(extraParticipantsCount)
    ? pluralizeParticipants(extraParticipantsCount)
    : `${meta.plusN} участников`;
  const isOwnPlan = Boolean(currentAuthor?.id && authorId === currentAuthor.id);

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

  const schedulePrimary =
    schedule?.mode === "partOfDay" || schedule?.timeMode === "partOfDay"
      ? `${weekdayLabel(schedule.weekdays) || "Дни не выбраны"} · ${schedule.partOfDay ? PART_OF_DAY_RANGES[schedule.partOfDay].label : "Время суток"}`
      : schedule?.mode === "exact" || schedule?.timeMode === "exact"
        ? exactDateLabel(schedule.start)
        : meta.date;
  const scheduleSecondary =
    schedule?.mode === "exact" || schedule?.timeMode === "exact"
      ? [exactTimeLabel(schedule.start, typeof schedule.end === "string" ? schedule.end : undefined), repeatEndDateLabel() ? `до ${repeatEndDateLabel()}` : ""].filter(Boolean).join(" · ")
      : "";

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
        const rows = await fetchComments(String(planId));
        if (!cancelled) {
          setComments((localItems) => [
            ...localItems.filter((item) => !item.persisted),
            ...rows.map(mapCommentRow),
          ]);
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
      mentionedUserIds,
      persisted: false,
    };
    setComments((items) => [
      ...items,
      localComment,
    ]);
    setComment("");
    setDraftMentions([]);
    removeCommentPhoto();
    if (planId === undefined) return;
    track("comment_sent", { plan_id: String(planId), mentions_count: mentionedUserIds.length, has_photo: Boolean(photoUrl) });
    void addComment({
      planId: String(planId),
      authorId: author.id,
      authorName: author.name,
      authorAvatarUrl: author.avatarUrl,
      text,
      mentionedUserIds,
      photoUrl,
    }).then((savedComment) => {
      if (!savedComment) return;
      setComments((items) => items.map((item) => item.id === localComment.id ? mapCommentRow(savedComment) : item));
    }).catch((error) => {
      console.error("Supabase comment insert failed", error);
    });
  };

  const removeComment = (item: LocalComment) => {
    setComments((items) => items.filter((commentItem) => commentItem.id !== item.id));
    if (!item.persisted) return;
    void deleteComment(item.id).catch((error) => {
      console.error("Supabase comment delete failed", error);
    });
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

  return (
    <div className="relative flex h-full flex-col bg-surface">
      {toast && (
        <div
          className="absolute left-1/2 z-40 -translate-x-1/2 rounded-full px-4 py-2 text-[14px] font-medium text-white shadow-lg"
          style={{ top: "calc(env(safe-area-inset-top) + 14px)", backgroundColor: GREEN }}
        >
          {toast}
        </div>
      )}

      <div className="flex h-14 flex-shrink-0 items-center px-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[15px] font-medium text-foreground active:opacity-80">
          <ArrowLeft size={20} strokeWidth={2} />
          <span>Назад</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pb-4">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl" style={{ background: backgroundGradient ?? PLAN_TAG_GRADIENTS.other }}>
            {coverSrc && (
              <img loading="lazy" decoding="async" src={coverSrc} alt={title} className="absolute inset-0 h-full w-full object-cover" />
            )}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.10) 46%, rgba(0,0,0,0.55) 100%)" }}
            />
            <div className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1.5 text-[13px] font-medium leading-4 text-white">
              {tagLabel}
            </div>
            <div className="absolute right-4 top-4 flex items-center gap-2">
              {canDelete && (
                <button
                  onClick={() => {
                    const confirmed = window.confirm("Удалить план полностью? Он исчезнет из ленты и у всех, кто к нему присоединился");
                    if (confirmed) onDelete?.();
                  }}
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-black/50 active:opacity-85"
                  aria-label="Удалить план"
                >
                  <Trash2 size={16} strokeWidth={2} color="#fff" />
                </button>
              )}
              {canEdit && (
                <button
                  onClick={onEdit}
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-black/50 active:opacity-85"
                  aria-label="Редактировать план"
                >
                  <Edit3 size={16} strokeWidth={2} color="#fff" />
                </button>
              )}
              {canHide && (
                <button
                  onClick={() => {
                    const confirmed = window.confirm("Скрыть план из ленты?");
                    if (confirmed) onHide?.();
                  }}
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-black/50 active:opacity-85"
                  aria-label="Скрыть из ленты"
                >
                  <Eye size={16} strokeWidth={2} color="#fff" />
                </button>
              )}
              {shareUrl && (
                <button
                  onClick={() => {
                    setCopied(false);
                    setSheet("share");
                  }}
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-black/50 active:opacity-85"
                  aria-label="Поделиться"
                >
                  <Share2 size={16} strokeWidth={2} color="#fff" />
                </button>
              )}
            </div>
            <div className="absolute inset-x-4 bottom-[18px] flex flex-col items-center text-center">
              <div className="flex -space-x-2">
                {participants.slice(0, 4).map((participant, i) => (
                  participant.avatarUrl ? (
                    <button
                      key={participant.id ?? i}
                      onClick={(event) => {
                        event.stopPropagation();
                        onProfileOpen?.(participant.id);
                      }}
                      className="h-[30px] w-[30px] rounded-full active:opacity-80"
                      aria-label="Открыть профиль"
                    >
                      <img loading="lazy" decoding="async" src={participant.avatarUrl} alt="" className="h-[30px] w-[30px] rounded-full border-2 border-white object-cover" />
                    </button>
                  ) : (
                    <span key={participant.id ?? i} className="h-[30px] w-[30px] rounded-full border-2 border-white bg-white/30" />
                  )
                ))}
              </div>
              <p className="mt-1.5 text-[12px] leading-4 text-white/85">{participantCountLabel}</p>
              <h1
                className="mt-2 max-w-full text-[28px] font-bold leading-[34px] text-white"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {title}
              </h1>
            </div>
          </div>

          {!isOwnPlan && (
            <button
              onClick={toggleJoin}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border text-[15px] active:opacity-90"
              style={joined ? { backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--foreground)", fontWeight: 500 } : { backgroundColor: GREEN, borderColor: GREEN, color: "#fff", fontWeight: 600 }}
            >
              {joined ? <Check size={18} strokeWidth={2.4} color={GREEN} /> : <Plus size={18} strokeWidth={2.3} color="#fff" />}
              {joined ? "Вы участвуете" : "Присоединиться"}
            </button>
          )}

          <div className="mt-4 border-t border-border pt-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <button onClick={organizerAction} className="flex min-w-0 items-center gap-2.5 text-left active:opacity-80">
                <AuthorAvatar name={authorName} avatarUrl={authorAvatarUrl} />
                <span className="truncate text-[15px] font-medium text-foreground">{authorName}</span>
              </button>
              <div className="flex flex-shrink-0 items-center gap-2">
                {onMessageAuthor && !isOwnPlan && (
                  <button
                    onClick={() => onMessageAuthor({ id: authorId ?? authorName, name: authorName, avatarUrl: authorAvatarUrl })}
                    className="rounded-full border px-3 py-1.5 text-[12px] font-semibold"
                    style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                  >
                    Написать
                  </button>
                )}
                {!isOwnPlan && (
                  <button
                    onClick={toggleAuthorFollow}
                    className="rounded-full border px-3 py-1.5 text-[12px] font-semibold"
                    style={subscribed ? { borderColor: "var(--border)", color: "var(--foreground)" } : { borderColor: GREEN, backgroundColor: GREEN, color: "#fff" }}
                  >
                    {subscribed ? "Подписан" : "Подписаться"}
                  </button>
                )}
              </div>
            </div>

            <div className="mb-4 text-[14px] leading-[1.5] text-muted-foreground">
              <p
                style={!descriptionExpanded && needsDescriptionClamp ? {
                  display: "-webkit-box",
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  whiteSpace: "pre-line",
                } : { whiteSpace: "pre-line" }}
              >
                {description}
              </p>
              {needsDescriptionClamp && (
                <button
                  onClick={() => setDescriptionExpanded((value) => !value)}
                  className="inline text-[14px] font-medium"
                  style={{ color: GREEN }}
                >
                  {descriptionExpanded ? "Свернуть" : "Подробнее"}
                </button>
              )}
            </div>

            <div className="space-y-3.5 pb-5">
              <div className="flex items-start gap-3">
                <Calendar size={20} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-[14px] leading-5 text-foreground">{schedulePrimary}</p>
                  {(scheduleSecondary || duration) && <p className="text-[13px] leading-4 text-muted-foreground">{scheduleSecondary || duration}</p>}
                </div>
              </div>

              {format === "offline" && meta.location && (
                <div className="flex items-start gap-3">
                  <MapPin size={20} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-[14px] leading-5 text-foreground">{meta.location}</p>
                    {meta.locationSub && <p className="text-[13px] leading-4 text-muted-foreground">{meta.locationSub}</p>}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Video size={20} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] leading-5 text-foreground">{formatLabel}</p>
                </div>
              </div>

              <button
                onClick={() => setSheet("participants")}
                className="flex w-full items-center justify-between gap-3 text-left active:opacity-85"
              >
                <div className="flex items-center gap-3">
                  <Users size={20} strokeWidth={1.8} className="flex-shrink-0 text-muted-foreground" />
                  <span className="text-[14px] text-foreground">{pluralizeParticipants(participants.length)}</span>
                </div>
                <div className="flex items-center">
                  <div className="flex -space-x-2">
                    {participants.slice(0, 3).map((participant, i) => (
                      participant.avatarUrl ? (
                        <button
                          key={participant.id ?? i}
                          onClick={(event) => {
                            event.stopPropagation();
                            onProfileOpen?.(participant.id);
                          }}
                          className="h-7 w-7 rounded-full active:opacity-80"
                          aria-label="Открыть профиль"
                        >
                          <img loading="lazy" decoding="async" src={participant.avatarUrl} alt="" className="h-7 w-7 rounded-full border object-cover" style={{ borderColor: "var(--surface)" }} />
                        </button>
                      ) : (
                        <span key={participant.id ?? i} className="h-7 w-7 rounded-full border bg-secondary" style={{ borderColor: "var(--surface)" }} />
                      )
                    ))}
                  </div>
                  {overflowLabel && (
                    <div className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                      <span className="text-[10px] font-bold text-foreground">{overflowLabel}</span>
                    </div>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        <CommentsBlock comment={comment} setComment={setComment} comments={comments} onSend={sendComment} currentAuthor={currentAuthor} planAuthorId={authorId} onDelete={removeComment} onProfileOpen={onProfileOpen} mentionCandidates={mentionCandidates} onMentionSelected={(mention) => setDraftMentions((items) => [...items.filter((item) => item.id !== mention.id), mention])} profileById={{ ...commentAuthorProfiles, ...profileById }} photoPreviewUrl={commentPhotoPreviewUrl} photoUploadProgress={commentPhotoUploadProgress} photoUrl={commentPhotoUrl} onPhotoSelected={(file) => { void selectCommentPhoto(file); }} onPhotoRemoved={removeCommentPhoto} />
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
            <p className="pt-2 text-center text-[13px] text-gray-400">И ещё {extraParticipantsLabel}</p>
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
