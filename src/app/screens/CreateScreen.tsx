import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Camera, Check, ChevronDown, Eye, Image as ImageIcon, Lock, MapPin, Maximize2, Plus, Search, Users, X } from "lucide-react";
import type { HomeFeedPlan, PlanTag, Schedule, Screen, Visibility } from "@/app/types";
import { ALL_DAYS, GREEN, PART_OF_DAY_RANGES, PLAN_DARK, WEEKDAY_VALUES } from "@/app/data/constants";
import { DEFAULT_PLAN_AUTHOR, PLAN_TAG_LABELS, PLAN_TAGS } from "@/app/data/plans";
import { HomeSheet } from "@/app/components/HomeSheet";
import { sanitizeImageUrl, uploadPhoto } from "@/app/lib/api/storage";
import { fetchRecentProfiles, searchProfiles } from "@/app/lib/api/profiles";
import { getNearestWeekdayDate, getRepeatUntil, normalizeSchedule, toIsoDate, toLocalIsoDate } from "@/app/lib/schedule";
import { formatWeekdayRanges } from "@/app/lib/weekdayRanges";

type Sheet = null | "background" | "date" | "time" | "place" | "description" | "details" | "tag";
type PlanDraft = { title: string; description: string; coverImage: string | null; photos: string[]; schedule: Schedule; gradient?: string };
type Person = { id: string; name: string; avatarUrl: string | null };
const TITLE_LIMIT = 80;
const DESCRIPTION_LIMIT = 3000;
const GRADIENT_PRESETS: string[] = [
  "linear-gradient(160deg, #00A89D 0%, #00655E 100%)",
  "linear-gradient(160deg, #00C2B2 0%, #0E7490 100%)",
  "linear-gradient(160deg, #2E6BFF 0%, #00C2B2 100%)",
  "linear-gradient(160deg, #34C759 0%, #00887F 100%)",
  "linear-gradient(160deg, #7C5CFF 0%, #C13BFF 100%)",
  "linear-gradient(160deg, #FF7E5F 0%, #FF3D77 100%)",
  "linear-gradient(160deg, #FF9D2E 0%, #FF3D3D 100%)",
  "linear-gradient(160deg, #2B3A67 0%, #0B1026 100%)",
];

function emojiPattern(color: string, emojis: string[]): string {
  const cell = 140;
  const items = emojis.map((emoji, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = column === 0 ? 34 : 104;
    const y = 40 + row * 66;
    return `<text x='${x}' y='${y}' font-size='30' text-anchor='middle'>${emoji}</text>`;
  }).join("");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${cell}' height='${cell}'>${items}</svg>`;
  return `${color} url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const EMOJI_PRESETS: { color: string; bg: string }[] = [
  { color: "#0E7A6E", bg: emojiPattern("#0E7A6E", ["🏃", "👟", "💧", "🔥"]) },
  { color: "#1E6F5C", bg: emojiPattern("#1E6F5C", ["⚡", "🔥", "🏅", "💪"]) },
  { color: "#F5820D", bg: emojiPattern("#F5820D", ["🎉", "🎁", "🎂", "🎈"]) },
  { color: "#2E6BFF", bg: emojiPattern("#2E6BFF", ["☀", "☕", "🌊", "⚡"]) },
  { color: "#2E8B57", bg: emojiPattern("#2E8B57", ["🌸", "🌿", "🏔", "☀"]) },
  { color: "#6F4E37", bg: emojiPattern("#6F4E37", ["☕", "🍩", "📖", "✨"]) },
];

const DEFAULT_BG = GRADIENT_PRESETS[0];

export type CreatedPlanResult = {
  plan: PlanDraft;
  visibility: Visibility;
  participants: string[];
  location: { address: string } | "online" | null;
  videoMeeting: { enabled: boolean; link: string };
};

const defaultSchedule = (): Schedule => ({
  mode: "partOfDay",
  timeMode: "partOfDay",
  time: null,
  partOfDay: null,
  weekdays: [],
  repeat: { type: "none" },
});

const defaultPlan = (): PlanDraft => ({ title: "", description: "", coverImage: null, photos: [], schedule: defaultSchedule(), gradient: undefined });

export const finalizeSchedule = (schedule: Schedule): Schedule => {
  const mode = schedule.timeMode ?? schedule.mode ?? "partOfDay";
  if (schedule.repeat?.type !== "none" || mode !== "partOfDay" || !schedule.partOfDay) return schedule;

  const referenceDate = new Date();
  const occurrenceDates = schedule.weekdays
    .filter((weekday) => weekday >= 1 && weekday <= 7)
    .map((weekday) => getNearestWeekdayDate([weekday], referenceDate));
  const occurrenceDate = getNearestWeekdayDate(schedule.weekdays, referenceDate);
  const lastOccurrenceDate = occurrenceDates.reduce(
    (latest, date) => date.getTime() > latest.getTime() ? date : latest,
    occurrenceDate,
  );
  const [startTime, endTime] = PART_OF_DAY_RANGES[schedule.partOfDay].range.split("-");
  return {
    ...schedule,
    start: `${toLocalIsoDate(occurrenceDate)}T${startTime}`,
    end: `${toLocalIsoDate(lastOccurrenceDate)}T${endTime}`,
  };
};

export function CreateScreen({
  onNavigate,
  backTo = "plans",
  onCreatePlan,
  onUpdatePlan,
  currentAuthor = DEFAULT_PLAN_AUTHOR,
  editingPlan,
}: {
  onNavigate: (s: Screen) => void;
  backTo?: Screen;
  onCreatePlan: (plans: HomeFeedPlan[], result: CreatedPlanResult) => void;
  onUpdatePlan?: (plan: HomeFeedPlan, result: CreatedPlanResult) => void;
  currentAuthor?: HomeFeedPlan["author"];
  editingPlan?: HomeFeedPlan | null;
}) {
  const isEditing = Boolean(editingPlan);
  const [people, setPeople] = useState<Person[]>([]);

  const [activeSheet, setActiveSheet] = useState<Sheet>(null);
  const [draft, setDraft] = useState<PlanDraft>(() => editingPlan ? {
    title: editingPlan.title.slice(0, TITLE_LIMIT),
    description: editingPlan.description.slice(0, DESCRIPTION_LIMIT),
    coverImage: editingPlan.coverUrl ?? null,
    photos: editingPlan.photos ?? [],
    schedule: normalizeSchedule(editingPlan.schedule),
    gradient: editingPlan.gradient,
  } : defaultPlan());
  const [titleError, setTitleError] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [maxParticipantsError, setMaxParticipantsError] = useState("");
  const [visibility, setVisibility] = useState<Visibility>(editingPlan?.visibility ?? "all");
  const [selectedTag, setSelectedTag] = useState<PlanTag>(editingPlan?.tag ?? "other");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [maxParticipants, setMaxParticipants] = useState<string>(() => editingPlan?.maxParticipants ? String(editingPlan.maxParticipants) : "");
  const [selectedPeople, setSelectedPeople] = useState<Person[]>([]);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [participantQuery, setParticipantQuery] = useState("");
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [galleryUploadProgress, setGalleryUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [galleryToast, setGalleryToast] = useState("");
  const [locationMode, setLocationMode] = useState<"online" | "offline">(editingPlan?.format ?? "online");
  const [locationAddress, setLocationAddress] = useState(editingPlan?.address ?? "");
  const planType = "simple" as const;
  const currentSchedule = draft.schedule;
  const scheduleDate = currentSchedule.start ? currentSchedule.start.slice(0, 10) : "";
  const scheduleTime = currentSchedule.time || "00:00";
  const isRepeating = currentSchedule.repeat?.type === "weekly";
  const selectedParticipantItems = selectedPeople.filter((person) => selectedParticipants.includes(person.id));
  const filteredPeople = people;

  useEffect(() => {
    if (!participantsOpen) {
      setPeople([]);
      setParticipantsLoading(false);
      return;
    }
    let cancelled = false;
    const normalizedQuery = participantQuery.trim();
    const loadPeople = async () => {
      setParticipantsLoading(true);
      try {
        const profiles = normalizedQuery ? await searchProfiles(normalizedQuery) : await fetchRecentProfiles();
        if (cancelled) return;
        setPeople(profiles
          .filter((profile) => profile.id !== currentAuthor.id && !profile.isDemo)
          .map((profile) => ({ id: profile.id, name: profile.name, avatarUrl: sanitizeImageUrl(profile.photoUrl) })));
      } catch (error) {
        console.error("Supabase participant search failed", error);
        if (!cancelled) setPeople([]);
      } finally {
        if (!cancelled) setParticipantsLoading(false);
      }
    };
    void loadPeople();
    return () => {
      cancelled = true;
    };
  }, [currentAuthor.id, participantQuery, participantsOpen]);

  const updatePlan = (next: Partial<PlanDraft>) => setDraft((item) => ({ ...item, ...next }));
  const updateSchedule = (next: Partial<Schedule>) => updatePlan({ schedule: { ...currentSchedule, ...next } });
  const todayIso = () => new Date().toISOString().slice(0, 10);
  const writeSchedule = (patch: { date?: string; time?: string; repeating?: boolean; weekdays?: number[] }) => {
    const date = (patch.date ?? scheduleDate) || todayIso();
    const time = patch.time ?? scheduleTime;
    const repeating = patch.repeating ?? isRepeating;
    const weekdays = patch.weekdays ?? currentSchedule.weekdays ?? [];
    updateSchedule({
      mode: "exact",
      timeMode: "exact",
      start: date ? `${date}T${time}` : undefined,
      time,
      partOfDay: null,
      weekdays: repeating ? weekdays : [],
      repeat: repeating ? { type: "weekly" } : { type: "none" },
      end: undefined,
    });
    setScheduleError("");
  };
  const updateTitle = (value: string) => {
    updatePlan({ title: value.slice(0, TITLE_LIMIT) });
    setTitleError("");
  };
  const updateDescription = (value: string) => updatePlan({ description: value.slice(0, DESCRIPTION_LIMIT) });
  const uploadGalleryPhotos = async (files: File[]) => {
    const selectedFiles = files.slice(0, Math.max(0, 10 - draft.photos.length));
    if (selectedFiles.length === 0) return;

    setUploadProgress(0);
    setGalleryUploadProgress({ current: 1, total: selectedFiles.length });
    let failedUploads = 0;
    try {
      for (let index = 0; index < selectedFiles.length; index += 1) {
        setGalleryUploadProgress({ current: index + 1, total: selectedFiles.length });
        try {
          const publicUrl = await uploadPhoto(selectedFiles[index], { onProgress: setUploadProgress });
          if (publicUrl) {
            setDraft((item) => ({ ...item, photos: [...item.photos, publicUrl] }));
          } else {
            failedUploads += 1;
          }
        } catch (error) {
          console.error("Gallery photo upload failed", error);
          failedUploads += 1;
        }
      }
    } finally {
      setUploadProgress(null);
      setGalleryUploadProgress(null);
    }

    if (failedUploads > 0) {
      setGalleryToast("Не все фото загрузились");
      window.setTimeout(() => setGalleryToast(""), 2600);
    }
  };

  const getRepeatEnd = (schedule: Schedule) => {
    if (schedule.repeat?.type === "none") return schedule.start;
    if (schedule.repeat?.type === "weekly") return getRepeatUntil(schedule);
    return typeof schedule.end === "string" ? schedule.end : undefined;
  };

  const validateSchedule = (schedule: Schedule) => {
    const mode = schedule.timeMode ?? schedule.mode ?? "partOfDay";
    if (mode === "partOfDay") {
      if (!schedule.partOfDay) return "Выберите время суток";
      if (schedule.weekdays.length === 0) return "Выберите хотя бы один день недели";
    }
    if (mode === "exact" && !schedule.start) return "Выберите дату и время начала";
    if (mode === "exact" && schedule.repeat?.type === "none" && schedule.start) {
      const startDate = toIsoDate(schedule.start);
      if (startDate && startDate < toLocalIsoDate(new Date())) return "Дата уже прошла";
    }
    if (schedule.repeat?.type === "weekly" && schedule.weekdays.length === 0) return "Выберите хотя бы один день недели";
    return "";
  };

  const getTimeDate = (schedule: Schedule) => {
    if ((schedule.mode === "exact" || schedule.timeMode === "exact") && schedule.start) {
      const date = new Date(schedule.start);
      if (Number.isNaN(date.getTime())) return "Точное время";
      const startLabel = date.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      const repeatEnd = getRepeatEnd(schedule);
      const endDate = repeatEnd ? new Date(repeatEnd) : null;
      const endLabel = endDate && !Number.isNaN(endDate.getTime())
        ? endDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
        : "";
      if (schedule.repeat?.type === "weekly") {
        const daysLabel = formatWeekdayRanges(schedule.weekdays);
        const timeLabel = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
        return `${daysLabel} · ${timeLabel}${endLabel ? ` · до ${endLabel}` : ""}`;
      }
      return startLabel;
    }
    const partLabel = schedule.partOfDay ? PART_OF_DAY_RANGES[schedule.partOfDay].label : "Расписание";
    if (schedule.repeat?.type === "none" && schedule.start) {
      const date = new Date(schedule.start);
      if (!Number.isNaN(date.getTime())) {
        if (schedule.weekdays.length > 1) return `${formatWeekdayRanges(schedule.weekdays)} · ${partLabel}`;
        const dateLabel = date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
        return `${dateLabel} · ${partLabel}`;
      }
    }
    return schedule.repeat?.type === "weekly"
      ? `${formatWeekdayRanges(schedule.weekdays)} · ${partLabel}`
      : partLabel;
  };

  const handleCreate = () => {
    if (!draft.title.trim()) {
      setTitleError("Введите название");
      return;
    }

    const baseSchedule = draft.schedule;
    const invalidSchedule = validateSchedule(baseSchedule);
    if (invalidSchedule) {
      setScheduleError(invalidSchedule);
      setActiveSheet("date");
      return;
    }

    const finalizedSchedule = finalizeSchedule(baseSchedule);
    const trainingProgram = undefined;
    const finalizedDraft = { ...draft, schedule: finalizedSchedule, trainingProgram };
    const maxParticipantsValue = maxParticipants.trim();
    const parsedMaxParticipants = maxParticipantsValue ? Number.parseInt(maxParticipantsValue, 10) : undefined;
    if (
      maxParticipantsValue
      && (!Number.isInteger(Number(maxParticipantsValue)) || parsedMaxParticipants === undefined || parsedMaxParticipants < 2)
    ) {
      setMaxParticipantsError("Минимум 2 участника");
      setActiveSheet("details");
      return;
    }
    setMaxParticipantsError("");

    if (isEditing && editingPlan) {
      const updatedPlan: HomeFeedPlan = {
        ...editingPlan,
        visibility,
        tag: selectedTag,
        format: locationMode,
        level: editingPlan.level,
        distanceLabel: editingPlan.distanceLabel,
        duration: editingPlan.duration,
        title: draft.title.trim(),
        description: draft.description.trim(),
        habit: { ...(editingPlan.habit ?? { durationMin: 15 }), title: draft.title.trim() },
        coverUrl: draft.coverImage ?? undefined,
        gradient: draft.gradient ?? DEFAULT_BG,
        photos: draft.photos.length > 0 ? draft.photos : undefined,
        schedule: finalizedSchedule,
        trainingProgram,
        maxParticipants: parsedMaxParticipants,
        timeDate: getTimeDate(finalizedSchedule),
        address: locationMode === "offline" && locationAddress.trim() ? locationAddress.trim() : undefined,
      };
      const result: CreatedPlanResult = {
        plan: { ...finalizedDraft, title: draft.title.trim(), description: draft.description.trim() },
        visibility,
        participants: selectedParticipants,
        location: locationMode === "online" ? "online" : locationAddress.trim() ? { address: locationAddress.trim() } : null,
        videoMeeting: { enabled: false, link: "" },
      };
      onUpdatePlan?.(updatedPlan, result);
      return;
    }

    const id = Date.now();
    const authorParticipants = currentAuthor.avatarUrl ? [currentAuthor.avatarUrl] : [];
    const newPlan: HomeFeedPlan = {
      id,
      kind: "plan",
      visibility,
      tag: selectedTag,
      format: locationMode,
      level: undefined,
      distanceLabel: undefined,
      duration: undefined,
      title: draft.title.trim(),
      description: draft.description.trim(),
      habit: { title: draft.title.trim(), durationMin: 15 },
      coverUrl: draft.coverImage ?? undefined,
      photos: draft.photos.length > 0 ? draft.photos : undefined,
      gradient: draft.gradient ?? DEFAULT_BG,
      schedule: finalizedSchedule,
      trainingProgram,
      participants: authorParticipants,
      participantsLabel: "1 чел.",
      maxParticipants: parsedMaxParticipants,
      timeDate: getTimeDate(finalizedSchedule),
      address: locationMode === "offline" && locationAddress.trim() ? locationAddress.trim() : undefined,
      author: currentAuthor,
    };
    const result: CreatedPlanResult = {
      plan: { ...finalizedDraft, title: draft.title.trim(), description: draft.description.trim() },
      visibility,
      participants: selectedParticipants,
      location: locationMode === "online" ? "online" : locationAddress.trim() ? { address: locationAddress.trim() } : null,
      videoMeeting: { enabled: false, link: "" },
    };

    onCreatePlan([newPlan], result);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.75 } });
    window.setTimeout(() => onNavigate("plans"), 750);
  };

  const descriptionLeft = DESCRIPTION_LIMIT - draft.description.length;

  const uploadCoverImage = async (file: File) => {
    setUploadProgress(0);
    try {
      const publicUrl = await uploadPhoto(file, { onProgress: setUploadProgress });
      if (publicUrl) {
        updatePlan({ coverImage: publicUrl });
        setActiveSheet(null);
      }
    } catch (error) {
      console.error("Cover photo upload failed", error);
    } finally {
      setUploadProgress(null);
    }
  };

  const cardBackground = draft.coverImage ? null : draft.gradient ?? DEFAULT_BG;
  const confirmDate = () => {
    const error = validateSchedule(currentSchedule);
    setScheduleError(error);
    if (!error) setActiveSheet(null);
  };

  const dateSummary = isRepeating
    ? currentSchedule.weekdays.length ? formatWeekdayRanges(currentSchedule.weekdays) : "Дни недели"
    : scheduleDate && currentSchedule.start
      ? new Date(currentSchedule.start).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
      : "Добавить";

  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {draft.coverImage
          ? <img src={draft.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ filter: "blur(34px)", transform: "scale(1.2)" }} />
          : <div className="absolute inset-0" style={{ background: cardBackground ?? DEFAULT_BG, filter: "blur(34px)", transform: "scale(1.2)" }} />}
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.42)" }} />
      </div>

      <div className="relative z-10 flex h-full flex-col overflow-y-auto">
        <div className="relative aspect-[4/5] w-full">
          <div
            className="absolute inset-0"
            style={{
              WebkitMaskImage: "linear-gradient(to bottom, black 78%, transparent 100%)",
              maskImage: "linear-gradient(to bottom, black 78%, transparent 100%)",
            }}
          >
            {draft.coverImage
              ? <img src={draft.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
              : <div className="absolute inset-0" style={{ background: cardBackground ?? DEFAULT_BG }} />}
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.45) 88%)" }} />
          </div>

          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
            <button type="button" onClick={() => onNavigate(backTo)} className="flex h-10 w-10 items-center justify-center rounded-full text-white backdrop-blur-md" style={{ background: "rgba(0,0,0,0.30)" }} aria-label="Закрыть">
              <X size={20} />
            </button>
            <button type="button" onClick={handleCreate} className="rounded-full px-4 py-2 text-[15px] font-semibold text-white backdrop-blur-md" style={{ background: "rgba(0,168,157,0.55)" }}>
              {isEditing ? "Сохранить" : "Создать"}
            </button>
          </div>

          <button type="button" onClick={() => setActiveSheet("background")} className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-[15px] font-semibold text-white backdrop-blur-md" style={{ background: "rgba(0,0,0,0.30)" }}>
            <ImageIcon size={18} />
            Изменить фон
          </button>

          <div className="absolute inset-x-4 bottom-6 flex flex-col items-center gap-2 text-center" style={{ textShadow: "0 1px 12px rgba(0,0,0,0.45)" }}>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setActiveSheet("tag")} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-medium text-white backdrop-blur-md" style={{ background: "rgba(255,255,255,0.18)" }}>
                {PLAN_TAG_LABELS[selectedTag]}
                <ChevronDown size={14} />
              </button>
              <button type="button" onClick={() => setVisibility((value) => value === "all" ? "onlyMe" : "all")} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-medium text-white backdrop-blur-md" style={{ background: "rgba(255,255,255,0.18)" }}>
                {visibility === "all" ? <><Eye size={14} />Все</> : <><Lock size={14} />Только я</>}
              </button>
            </div>
            <textarea value={draft.title} maxLength={TITLE_LIMIT} onChange={(event) => updateTitle(event.target.value)} placeholder="Название плана" rows={2} className="w-full resize-none bg-transparent text-center text-[32px] font-bold leading-[1.08] text-white outline-none placeholder:text-white/45" />
            {titleError && <p className="text-[12px] font-medium text-white/90">{titleError}</p>}
            <div className="flex items-center gap-2">
              {currentAuthor.avatarUrl
                ? <img src={currentAuthor.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                : <span className="h-6 w-6 rounded-full bg-white/25" />}
              <span className="text-[13px] text-white/90">Организует {currentAuthor.name}</span>
            </div>
          </div>
        </div>

        <div className="px-4 pb-8 pt-2 text-white">
          <h2 className="mb-3 mt-6 text-[12px] font-medium uppercase tracking-[0.08em]" style={{ color: PLAN_DARK.textSecondary }}>Детали</h2>
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" onClick={() => setActiveSheet("date")} className="rounded-xl p-4 text-left backdrop-blur-md active:opacity-85" style={{ background: PLAN_DARK.card }}>
              <span className="text-[13px]" style={{ color: PLAN_DARK.textSecondary }}>Дата</span>
              <span className="mt-2 block text-[24px] font-bold leading-tight text-white">{dateSummary}</span>
            </button>
            <button type="button" onClick={() => setActiveSheet("time")} className="rounded-xl p-4 text-left backdrop-blur-md active:opacity-85" style={{ background: PLAN_DARK.card }}>
              <span className="text-[13px]" style={{ color: PLAN_DARK.textSecondary }}>Время</span>
              <span className="mt-2 block text-[24px] font-bold leading-tight text-white">{scheduleTime}</span>
            </button>
            <button type="button" onClick={() => setActiveSheet("details")} className="min-h-[106px] rounded-xl p-4 text-left backdrop-blur-md active:opacity-85" style={{ background: PLAN_DARK.card }}>
              <span className="text-[13px]" style={{ color: PLAN_DARK.textSecondary }}>Участники</span>
              {selectedParticipantItems.length > 0 ? (
                <div className="mt-3 flex -space-x-2">
                  {selectedParticipantItems.slice(0, 5).map((person) => person.avatarUrl
                    ? <img key={person.id} src={person.avatarUrl} alt={person.name} className="h-9 w-9 rounded-full border-2 object-cover" style={{ borderColor: PLAN_DARK.bg }} />
                    : <span key={person.id} className="h-9 w-9 rounded-full border-2 bg-white/15" style={{ borderColor: PLAN_DARK.bg }} />)}
                </div>
              ) : <span className="mt-2 flex items-center gap-2 text-[18px] font-bold text-white"><Plus size={20} />Пригласить</span>}
            </button>
            <button type="button" onClick={() => setActiveSheet("place")} className="min-h-[106px] rounded-xl p-4 text-left backdrop-blur-md active:opacity-85" style={{ background: PLAN_DARK.card }}>
              <span className="text-[13px]" style={{ color: PLAN_DARK.textSecondary }}>{locationMode === "online" ? "Формат" : "Где"}</span>
              <span className="mt-2 block overflow-hidden text-[18px] font-bold leading-tight text-white" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                {locationMode === "online" ? "Онлайн" : locationAddress.trim() || "Добавить место"}
              </span>
            </button>
          </div>

          <h2 className="mb-3 mt-6 text-[12px] font-medium uppercase tracking-[0.08em]" style={{ color: PLAN_DARK.textSecondary }}>Описание</h2>
          <button type="button" onClick={() => setActiveSheet("description")} className="w-full rounded-xl p-4 text-left backdrop-blur-md active:opacity-85" style={{ background: PLAN_DARK.card }}>
            {draft.description
              ? <p className="overflow-hidden whitespace-pre-line text-[15px] leading-[1.45] text-white" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>{draft.description}</p>
              : <span className="text-[15px]" style={{ color: PLAN_DARK.textSecondary }}>Добавить описание</span>}
          </button>

          <h2 className="mb-3 mt-6 text-[12px] font-medium uppercase tracking-[0.08em]" style={{ color: PLAN_DARK.textSecondary }}>Фотографии</h2>
          <label className={`relative block w-full rounded-xl p-4 text-left backdrop-blur-md ${uploadProgress === null ? "active:opacity-85" : "opacity-70"}`} style={{ background: PLAN_DARK.card }}>
            {draft.photos.length > 0 ? (
              <>
                <span className="mb-3 block text-[15px] font-semibold text-white">{draft.photos.length} фото</span>
                <span className="grid grid-cols-3 gap-2">
                  {draft.photos.slice(0, 3).map((photo, index) => <img key={`${photo}-${index}`} src={photo} alt="" className="aspect-[4/3] w-full rounded-[10px] object-cover" />)}
                </span>
              </>
            ) : <span className="text-[15px]" style={{ color: PLAN_DARK.textSecondary }}>Загрузить фотографии</span>}
            <input type="file" accept="image/*" multiple disabled={uploadProgress !== null} className="hidden" onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              void uploadGalleryPhotos(files);
            }} />
            {uploadProgress !== null && galleryUploadProgress && (
              <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 text-center text-[16px] font-semibold text-white">
                {galleryUploadProgress.current} из {galleryUploadProgress.total}, {uploadProgress}%
              </span>
            )}
          </label>
        </div>
      </div>

      {activeSheet === "background" && (
        <HomeSheet title="Фон" onClose={() => setActiveSheet(null)} panelClassName="max-h-[85vh]" bodyClassName="overflow-y-auto">
          <div className="relative">
            <div className="grid grid-cols-2 gap-2">
              <label className="flex h-12 items-center justify-center gap-2 rounded-xl bg-card text-[14px] font-semibold active:opacity-80">
                <ImageIcon size={18} color={GREEN} />
                Фото
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadProgress !== null}
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void uploadCoverImage(file);
                  }}
                />
              </label>
              <label className="flex h-12 items-center justify-center gap-2 rounded-xl bg-card text-[14px] font-semibold active:opacity-80">
                <Camera size={18} color={GREEN} />
                Камера
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  disabled={uploadProgress !== null}
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void uploadCoverImage(file);
                  }}
                />
              </label>
            </div>

            {draft.coverImage && (
              <button type="button" onClick={() => updatePlan({ coverImage: null })} className="mt-3 h-11 w-full rounded-xl bg-card text-[14px] font-semibold" style={{ color: GREEN }}>
                Убрать фото
              </button>
            )}

            <h3 className="mb-3 mt-6 text-[16px] font-semibold">Градиенты</h3>
            <div className="grid grid-cols-3 gap-2">
              {GRADIENT_PRESETS.map((preset, index) => {
                const active = draft.gradient === preset || (draft.gradient == null && index === 0);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      updatePlan({ gradient: preset, coverImage: null });
                      setActiveSheet(null);
                    }}
                    aria-label={`Выбрать фон ${index + 1}`}
                    className="relative h-[72px] rounded-xl border-2"
                    style={{ background: preset, borderColor: active ? GREEN : "transparent" }}
                  >
                    {active && <Check size={20} className="absolute right-2 top-2 text-white" />}
                  </button>
                );
              })}
            </div>

            <h3 className="mb-3 mt-6 text-[16px] font-semibold">Эмодзи</h3>
            <div className="grid grid-cols-3 gap-2">
              {EMOJI_PRESETS.map((preset, index) => {
                const active = draft.gradient === preset.bg;
                return (
                  <button
                    key={preset.bg}
                    type="button"
                    onClick={() => {
                      updatePlan({ gradient: preset.bg, coverImage: null });
                      setActiveSheet(null);
                    }}
                    aria-label={`Выбрать эмодзи-фон ${index + 1}`}
                    className="relative h-[72px] rounded-xl border-2"
                    style={{ background: preset.bg, borderColor: active ? GREEN : "transparent" }}
                  >
                    {active && <Check size={20} className="absolute right-2 top-2 text-white" />}
                  </button>
                );
              })}
            </div>

            {uploadProgress !== null && !galleryUploadProgress && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60">
                <span className="text-[22px] font-semibold text-white">{uploadProgress}%</span>
              </div>
            )}
          </div>
        </HomeSheet>
      )}

      {activeSheet === "tag" && (
        <HomeSheet variant="dark" title="Тег" onClose={() => setActiveSheet(null)} onConfirm={() => setActiveSheet(null)}>
          <div className="grid grid-cols-2 gap-2">
            {PLAN_TAGS.map((tag) => {
              const active = tag === selectedTag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSelectedTag(tag);
                    setActiveSheet(null);
                  }}
                  className="relative rounded-xl border-2 bg-white/[0.06] px-4 py-3 text-left text-[14px] font-medium text-white"
                  style={{ borderColor: active ? GREEN : "transparent" }}
                >
                  {PLAN_TAG_LABELS[tag]}
                  {active && <Check size={16} className="absolute right-3 top-3" style={{ color: GREEN }} />}
                </button>
              );
            })}
          </div>
        </HomeSheet>
      )}

      {activeSheet === "date" && (
        <HomeSheet
          variant="dark"
          title="Дата"
          onClose={() => setActiveSheet(null)}
          onConfirm={confirmDate}
          panelClassName="max-h-[85vh]"
          bodyClassName="overflow-y-auto"
        >
          <div className="overflow-hidden rounded-2xl bg-white/[0.06]">
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-[16px] text-white">Дата начала</span>
              <label className="relative flex-shrink-0 rounded-full bg-white/10 px-3 py-2 text-[15px] text-white">
                {scheduleDate && currentSchedule.start
                  ? new Date(currentSchedule.start).toLocaleDateString("ru-RU", { day: "numeric", month: "short", weekday: "short" })
                  : "Выбрать"}
                <input type="date" value={scheduleDate} onChange={(event) => writeSchedule({ date: event.target.value })} className="absolute inset-0 cursor-pointer opacity-0" style={{ colorScheme: "dark" }} />
              </label>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-4">
              <span className="text-[16px] text-white">Повторять</span>
              <button
                type="button"
                role="switch"
                aria-checked={isRepeating}
                onClick={() => writeSchedule({ repeating: !isRepeating })}
                className="relative h-7 w-12 flex-shrink-0 rounded-full transition-colors"
                style={{ background: isRepeating ? GREEN : "rgba(255,255,255,0.22)" }}
              >
                <span className="absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform" style={{ left: 2, transform: isRepeating ? "translateX(20px)" : "translateX(0)" }} />
              </button>
            </div>
            {isRepeating && (
              <div className="border-t border-white/10 px-3 py-4">
                <div className="grid grid-cols-7 gap-1">
                  {WEEKDAY_VALUES.map((weekday, index) => {
                    const active = currentSchedule.weekdays.includes(weekday);
                    return (
                      <button key={weekday} type="button" onClick={() => writeSchedule({ weekdays: active ? currentSchedule.weekdays.filter((item) => item !== weekday) : [...currentSchedule.weekdays, weekday] })} className="flex aspect-square items-center justify-center rounded-full text-[12px] font-medium text-white" style={{ background: active ? GREEN : "rgba(255,255,255,0.10)" }}>
                        {ALL_DAYS[index]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {scheduleError && <p className="px-4 pt-2 text-[12px] font-medium text-red-400">{scheduleError}</p>}
        </HomeSheet>
      )}

      {activeSheet === "time" && (
        <HomeSheet variant="dark" title="Время" onClose={() => setActiveSheet(null)} onConfirm={() => setActiveSheet(null)}>
          <div className="rounded-2xl bg-white/[0.06]">
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-[16px] text-white">Время начала</span>
              <label className="relative flex-shrink-0 rounded-full bg-white/10 px-3 py-2 text-[15px] text-white">
                {scheduleTime}
                <input type="time" value={scheduleTime} onChange={(event) => writeSchedule({ time: event.target.value })} className="absolute inset-0 cursor-pointer opacity-0" style={{ colorScheme: "dark" }} />
              </label>
            </div>
          </div>
        </HomeSheet>
      )}

      {activeSheet === "place" && (
        <HomeSheet variant="dark" title="Место" onClose={() => setActiveSheet(null)} onConfirm={() => setActiveSheet(null)} panelClassName="max-h-[85vh]" bodyClassName="overflow-y-auto">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/10 p-1">
            {(["online", "offline"] as const).map((mode) => {
              const active = locationMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setLocationMode(mode)}
                  className={`h-10 rounded-lg text-[14px] font-semibold transition-colors ${active ? "text-white" : "text-white/80"}`}
                  style={active ? { backgroundColor: GREEN } : undefined}
                >
                  {mode === "online" ? "Онлайн" : "Офлайн"}
                </button>
              );
            })}
          </div>

          {locationMode === "offline" ? (
            <div className="mt-5">
              {/* TODO: подключить Яндекс.Карты (Suggest + карта) — заменить заглушку */}
              <div className="flex h-11 items-center gap-2 rounded-xl bg-white/10 px-3">
                <Search size={17} className="flex-shrink-0 text-white/60" />
                <input
                  value={locationAddress}
                  onChange={(event) => setLocationAddress(event.target.value)}
                  placeholder="Адрес места"
                  className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/40"
                />
              </div>
              <div className="relative mt-3 flex h-28 w-full flex-col items-center justify-center gap-1 rounded-xl bg-white/[0.06]">
                <button type="button" className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/10" aria-label="Развернуть карту">
                  <Maximize2 size={15} className="text-white/60" />
                </button>
                <MapPin size={20} className="text-white/40" />
                <span className="text-[12px] text-white/40">место встречи</span>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-[14px] text-white/70">Онлайн-встреча</p>
          )}
        </HomeSheet>
      )}

      {activeSheet === "description" && (
        <HomeSheet variant="dark" title="Описание" onClose={() => setActiveSheet(null)} onConfirm={() => setActiveSheet(null)}>
          <textarea
            value={draft.description}
            maxLength={DESCRIPTION_LIMIT}
            onChange={(event) => updateDescription(event.target.value)}
            placeholder="Что будешь делать, и с какой целью"
            rows={6}
            className="w-full resize-none rounded-2xl bg-white/[0.06] px-4 py-3.5 text-[15px] leading-5 text-white outline-none placeholder:text-white/40"
          />
          {descriptionLeft < DESCRIPTION_LIMIT * 0.2 && <p className="mt-2 text-right text-[12px] text-white/40">{descriptionLeft}</p>}
        </HomeSheet>
      )}

      {activeSheet === "details" && (
        <HomeSheet variant="dark" title="Детали" onClose={() => setActiveSheet(null)} onConfirm={() => setActiveSheet(null)} panelClassName="max-h-[85vh]" bodyClassName="overflow-y-auto">
          <div className="overflow-hidden rounded-2xl bg-white/[0.06]">
            <button type="button" onClick={() => setParticipantsOpen(true)} className="flex w-full items-center gap-3 px-4 py-4 text-left">
              <Users size={19} className="flex-shrink-0 text-white" />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-white">Участники</p>
                <p className="mt-0.5 text-[12px] text-white/50">{selectedParticipantItems.length ? `Выбрано: ${selectedParticipantItems.length}` : "Выбрать участников"}</p>
              </div>
              {selectedParticipantItems.length > 0 ? (
                <div className="flex -space-x-2">
                  {selectedParticipantItems.slice(0, 4).map((person) => person.avatarUrl
                    ? <img loading="lazy" decoding="async" key={person.id} src={person.avatarUrl} alt={person.name} className="h-7 w-7 rounded-full border-2 border-[#1C1C1E] object-cover" />
                    : <span key={person.id} className="h-7 w-7 rounded-full border-2 border-[#1C1C1E] bg-white/15" />)}
                </div>
              ) : <Plus size={19} className="text-white" />}
            </button>

            <div className="border-t border-white/10 px-4 py-4">
              <label>
                <span className="text-[15px] font-medium text-white">Лимит участников</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="2"
                  step="1"
                  value={maxParticipants}
                  onChange={(event) => {
                    setMaxParticipants(event.target.value);
                    setMaxParticipantsError("");
                  }}
                  placeholder="Без ограничения"
                  className="mt-2 h-11 w-full rounded-xl bg-white/10 px-3 text-[14px] text-white outline-none placeholder:text-white/40"
                />
              </label>
              {maxParticipantsError && <p className="mt-2 text-[12px] font-medium text-red-400">{maxParticipantsError}</p>}
            </div>
          </div>
        </HomeSheet>
      )}
      {galleryToast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-foreground px-4 py-3 text-[14px] font-medium text-background shadow-lg">
          {galleryToast}
        </div>
      )}
      {participantsOpen && (
        <HomeSheet variant="dark" title="Участники" onClose={() => setParticipantsOpen(false)} panelClassName="max-h-[85vh] flex flex-col" bodyClassName="flex min-h-0 flex-col">
          <div className="mb-3 flex h-11 flex-shrink-0 items-center gap-2 rounded-xl bg-white/10 px-3">
            <Search size={17} strokeWidth={1.9} className="text-white/60" />
            <input
              value={participantQuery}
              onChange={(event) => setParticipantQuery(event.target.value)}
              placeholder="Поиск по имени"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/40"
            />
          </div>
          <div className="max-h-[60vh] min-h-0 space-y-1 overflow-y-auto pb-2">
            {participantsLoading && <p className="px-3 py-4 text-center text-[13px] text-white/50">Загружаем участников...</p>}
            {!participantsLoading && filteredPeople.length === 0 && <p className="px-3 py-4 text-center text-[13px] text-white/50">Пользователи не найдены</p>}
            {filteredPeople.map((person) => {
              const active = selectedParticipants.includes(person.id);
              return (
                <button
                  key={person.id}
                  onClick={() => {
                    setSelectedParticipants((items) => active ? items.filter((id) => id !== person.id) : [...items, person.id]);
                    setSelectedPeople((items) => active ? items.filter((item) => item.id !== person.id) : items.some((item) => item.id === person.id) ? items : [...items, person]);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left"
                  style={active ? { background: "rgba(255,255,255,0.10)" } : undefined}
                >
                  {person.avatarUrl ? <img loading="lazy" decoding="async" src={person.avatarUrl} alt={person.name} className="h-9 w-9 rounded-full object-cover" /> : <span className="h-9 w-9 rounded-full bg-white/10" />}
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-white">{person.name}</span>
                  {active && <Check size={16} color={GREEN} />}
                </button>
              );
            })}
          </div>
          <div className="flex-shrink-0 border-t border-white/10 pt-3">
            <button onClick={() => setParticipantsOpen(false)} className="h-12 w-full rounded-xl text-[15px] font-semibold text-white" style={{ backgroundColor: GREEN }}>
              Пригласить участников
            </button>
          </div>
        </HomeSheet>
      )}
    </div>
  );
}
