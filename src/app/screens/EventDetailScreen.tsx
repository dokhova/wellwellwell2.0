import { useState } from "react";
import { ArrowLeft, Calendar, Check, ChevronRight, Copy, MapPin, Plus, Share2, Trash2, Users, Video } from "lucide-react";
import type { EventDetailProps } from "@/app/types";
import { DETAIL_AVATARS, normalizePlanTag, PLAN_TAG_GRADIENTS, PLAN_TAG_LABELS } from "@/app/data/plans";
import { ALL_DAYS, GREEN, PART_OF_DAY_RANGES, UNSPLASH, WEEKDAY_VALUES } from "@/app/data/constants";
import { HomeSheet } from "@/app/components/HomeSheet";

function CommentsBlock({
  comment,
  setComment,
  comments,
  onSend,
}: {
  comment: string;
  setComment: (v: string) => void;
  comments: { id: number; author: string; avatarUrl: string; time: string; text: string }[];
  onSend: () => void;
}) {
  const canSend = comment.trim().length > 0;

  return (
    <div
      className="border-t border-border bg-surface px-4 pt-[18px] pb-6"
    >
      <h3 className="mb-3.5 flex items-center gap-2 text-[15px] font-semibold text-foreground">
        Комментарии <span className="text-[15px] font-normal text-muted-foreground">{comments.length}</span>
      </h3>
      <div className="mb-[18px] flex items-center gap-2.5">
        <img src={UNSPLASH.userAvatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
        <div className="flex-1 bg-input rounded-full px-3.5 py-[9px] flex items-center gap-2">
          <input
            value={comment}
            onChange={e => setComment(e.target.value)}
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
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((item) => (
            <div key={item.id} className="flex gap-2.5">
              <img src={item.avatarUrl} alt="" className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="truncate text-[14px] font-medium text-foreground">{item.author}</p>
                  <span className="text-[12px] text-muted-foreground">{item.time}</span>
                </div>
                <p className="mt-0.5 text-[14px] leading-5 text-foreground">{item.text}</p>
              </div>
            </div>
          ))}
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
    return <img src={avatarUrl} alt={name} className="flex-shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
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
  authorId, onMessageAuthor, participantItems, onMessageParticipant,
  canDelete = false, onDelete,
}: EventDetailProps) {
  void authorVerified;
  void readTime;
  void badgeDate;
  const [joined, setJoined] = useState(Boolean(initiallyJoined));
  const [toast, setToast] = useState("");
  const [sheet, setSheet] = useState<"participants" | "profile" | "share" | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<{ id: number; author: string; avatarUrl: string; time: string; text: string }[]>([]);
  const [copied, setCopied] = useState(false);
  const description = paragraphs.join("\n\n");
  const participantAvatars = planParticipantAvatars?.length ? planParticipantAvatars : DETAIL_AVATARS;
  const organizerAction = onProfile ?? (() => setSheet("profile"));
  const needsDescriptionClamp = description.length > 260;
  const formatLabel = format === "online" ? "Онлайн" : "Офлайн";
  const tagLabel = tag ? PLAN_TAG_LABELS[normalizePlanTag(tag)] : "План";
  const participantCountLabel = participantsLabel ?? `${meta.participants} участников`;
  const overflowLabel = meta.plusN.startsWith("+") ? meta.plusN : "";

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
      ? exactTimeLabel(schedule.start, typeof schedule.end === "string" ? schedule.end : undefined)
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
    if (joined) {
      cancelJoin();
    } else {
      joinPlan();
    }
  };

  const sendComment = () => {
    const text = comment.trim();
    if (!text) return;
    setComments((items) => [
      ...items,
      {
        id: Date.now(),
        author: "Вы",
        avatarUrl: UNSPLASH.userAvatar,
        time: "сейчас",
        text,
      },
    ]);
    setComment("");
  };

  const copyShareLink = async () => {
    await navigator.clipboard?.writeText(shareUrl ?? `https://wellwellwell.app/plans/${encodeURIComponent(title)}`);
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
              <img src={coverSrc} alt={title} className="absolute inset-0 h-full w-full object-cover" />
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
            </div>
            <div className="absolute inset-x-4 bottom-[18px] flex flex-col items-center text-center">
              <div className="flex -space-x-2">
                {participantAvatars.slice(0, 4).map((url, i) => (
                  <img key={i} src={url} alt="" className="h-[30px] w-[30px] rounded-full border-2 border-white object-cover" />
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

          <button
            onClick={toggleJoin}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border text-[15px] active:opacity-90"
            style={joined ? { backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--foreground)", fontWeight: 500 } : { backgroundColor: GREEN, borderColor: GREEN, color: "#fff", fontWeight: 600 }}
          >
            {joined ? <Check size={18} strokeWidth={2.4} color={GREEN} /> : <Plus size={18} strokeWidth={2.3} color="#fff" />}
            {joined ? "Вы участвуете" : "Присоединиться"}
          </button>

          <div className="mt-4 border-t border-border pt-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <button onClick={organizerAction} className="flex min-w-0 items-center gap-2.5 text-left active:opacity-80">
                <AuthorAvatar name={authorName} avatarUrl={authorAvatarUrl} />
                <span className="truncate text-[15px] font-medium text-foreground">{authorName}</span>
              </button>
              <div className="flex flex-shrink-0 items-center gap-2">
                {onMessageAuthor && (
                  <button
                    onClick={() => onMessageAuthor({ id: authorId ?? authorName, name: authorName, avatarUrl: authorAvatarUrl })}
                    className="rounded-full border px-3 py-1.5 text-[12px] font-semibold"
                    style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                  >
                    Написать
                  </button>
                )}
                <button
                  onClick={() => setSubscribed((value) => !value)}
                  className="rounded-full border px-3 py-1.5 text-[12px] font-semibold"
                  style={subscribed ? { borderColor: "var(--border)", color: "var(--foreground)" } : { borderColor: GREEN, backgroundColor: GREEN, color: "#fff" }}
                >
                  {subscribed ? "Подписан" : "Подписаться"}
                </button>
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
                  <span className="text-[14px] text-foreground">{meta.participants} участников</span>
                </div>
                <div className="flex items-center">
                  <div className="flex -space-x-2">
                    {participantAvatars.slice(0, 3).map((url, i) => (
                      <img key={i} src={url} alt="" className="h-7 w-7 rounded-full border object-cover" style={{ borderColor: "var(--surface)" }} />
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

        <CommentsBlock comment={comment} setComment={setComment} comments={comments} onSend={sendComment} />
      </div>

      {sheet === "participants" && (
        <HomeSheet title="Участники" onClose={() => setSheet(null)}>
          <div className="space-y-2">
            {participantAvatars.map((url, i) => {
              const participant = participantItems?.[i] ?? { id: `participant-${i}`, name: `Участник ${i + 1}`, avatarUrl: url };
              return (
                <div key={`${participant.id}-${i}`} className="flex w-full items-center gap-3 rounded-2xl bg-gray-100 px-4 py-3 text-left">
                  <img src={participant.avatarUrl ?? url} alt="" className="h-9 w-9 rounded-full object-cover" />
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-gray-900">{participant.name}</span>
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
            <p className="pt-2 text-center text-[13px] text-gray-400">И ещё {meta.plusN} участников</p>
          </div>
        </HomeSheet>
      )}

      {sheet === "share" && (
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
