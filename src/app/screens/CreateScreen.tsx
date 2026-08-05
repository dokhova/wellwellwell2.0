import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { AlignLeft, Calendar, Camera, Check, ChevronRight, Eye, Image as ImageIcon, Lock, MapPin, Plus, Repeat2, Search, SlidersHorizontal, Users, X } from "lucide-react";
import type { HomeFeedPlan, PartOfDay, PlanRepeat, Schedule, Screen, TimeMode, Visibility } from "@/app/types";
import { ALL_DAYS, GREEN, GREEN_LIGHT, PART_OF_DAY_RANGES, WEEKDAY_VALUES } from "@/app/data/constants";
import { DEFAULT_PLAN_AUTHOR } from "@/app/data/plans";
import { HomeSheet } from "@/app/components/HomeSheet";
import { sanitizeImageUrl, uploadPhoto } from "@/app/lib/api/storage";
import { fetchRecentProfiles, searchProfiles } from "@/app/lib/api/profiles";
import { getNearestWeekdayDate, getRepeatUntil, normalizeSchedule, toIsoDate, toLocalIsoDate } from "@/app/lib/schedule";
import { formatWeekdayRanges } from "@/app/lib/weekdayRanges";

type Sheet = null | "background" | "datetime" | "place" | "description" | "details";
type PlanDraft = { title: string; description: string; coverImage: string | null; photos: string[]; schedule: Schedule; gradient?: string };
type Person = { id: string; name: string; avatarUrl: string | null };
const TITLE_LIMIT = 80;
const DESCRIPTION_LIMIT = 3000;
const BG_PRESETS: string[] = [
  "linear-gradient(160deg, #00A89D 0%, #00655E 100%)",
  "linear-gradient(160deg, #00C2B2 0%, #0E7490 100%)",
  "linear-gradient(160deg, #2E6BFF 0%, #00C2B2 100%)",
  "linear-gradient(160deg, #34C759 0%, #00887F 100%)",
  "linear-gradient(160deg, #7C5CFF 0%, #C13BFF 100%)",
  "linear-gradient(160deg, #FF7E5F 0%, #FF3D77 100%)",
  "linear-gradient(160deg, #FF9D2E 0%, #FF3D3D 100%)",
  "linear-gradient(160deg, #FF4D8D 0%, #7C2BFF 100%)",
  "linear-gradient(160deg, #2B3A67 0%, #0B1026 100%)",
];
const DEFAULT_BG = BG_PRESETS[0];

export type CreatedPlanResult = {
  plan: PlanDraft;
  visibility: Visibility;
  participants: string[];
  location: { address: string } | "online" | null;
  videoMeeting: { enabled: boolean; link: string };
};

function OptionRow({ icon, label, subtitle, control, onClick }: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  control: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl bg-card px-4 py-3.5 text-left active:opacity-80">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-foreground">{label}</p>
        {subtitle && <p className="mt-0.5 truncate text-[12px] leading-4 text-muted-foreground">{subtitle}</p>}
      </div>
      {control}
    </button>
  );
}

const getLocalDateTime = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const splitDateTime = (value: string) => {
  const [date = "", time = ""] = value.split("T");
  return { date, time };
};

const getWeekdayFromDate = (value: string) => {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("ru-RU", { weekday: "long" });
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
  const initialDateTime = useMemo(() => getLocalDateTime(), []);
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
  const [selectedLevel, setSelectedLevel] = useState<HomeFeedPlan["level"]>(editingPlan?.level);
  const [metricMode, setMetricMode] = useState<"none" | "distance" | "time">(editingPlan?.distanceLabel ? "distance" : editingPlan?.duration ? "time" : "none");
  const [distanceValue, setDistanceValue] = useState(() => editingPlan?.distanceLabel?.match(/[\d.,]+/)?.[0]?.replace(",", ".") ?? "");
  const [distanceUnit, setDistanceUnit] = useState<"км" | "м">(editingPlan?.distanceLabel?.trim().endsWith(" км") ? "км" : "м");
  const [durationMinutes, setDurationMinutes] = useState(() => editingPlan?.duration?.match(/[\d.,]+/)?.[0]?.replace(",", ".") ?? "");
  const planType = "simple" as const;
  const currentSchedule = draft.schedule;
  const timeMode: TimeMode = currentSchedule.timeMode ?? currentSchedule.mode ?? "partOfDay";
  const partOfDay = currentSchedule.partOfDay;
  const selectedDays = currentSchedule.weekdays;
  const exactStart = currentSchedule.start ?? initialDateTime;
  const exactEnd = typeof currentSchedule.end === "string" ? currentSchedule.end : exactStart;
  const repeat = currentSchedule.repeat ?? { type: "none" };
  const startParts = splitDateTime(exactStart);
  const endParts = splitDateTime(exactEnd);
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
      setActiveSheet("datetime");
      return;
    }

    const finalizedSchedule = finalizeSchedule(baseSchedule);
    void planType;
    const trainingProgram = undefined;
    const finalizedDraft = { ...draft, schedule: finalizedSchedule, trainingProgram };
    const distanceLabel = metricMode === "distance" && Number(distanceValue) > 0 ? `${Number(distanceValue)} ${distanceUnit}` : undefined;
    const duration = metricMode === "time" && Number(durationMinutes) > 0 ? `${Number(durationMinutes)} мин` : undefined;
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
        format: locationMode,
        level: selectedLevel,
        distanceLabel,
        duration,
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
      tag: "other",
      format: locationMode,
      level: selectedLevel,
      distanceLabel,
      duration,
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

  const repeatUntil = repeat.type === "weekly" ? repeat.until : undefined;
  const repeatUntilLabel = repeatUntil
    ? new Date(`${repeatUntil}T12:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
    : "";
  const selectedDaysLabel = formatWeekdayRanges(selectedDays).toUpperCase();
  const repeatSummary = repeat.type === "weekly"
    ? `${selectedDays.length === 7 ? "Каждый день" : `Каждые ${selectedDaysLabel || "выбранные дни"}`}${repeatUntilLabel ? ` до ${repeatUntilLabel}` : ""}`
    : "";
  const descriptionLeft = DESCRIPTION_LIMIT - draft.description.length;

  const renderWeekdayGrid = (className = "mt-5") => (
    <div className={`${className} grid grid-cols-7 gap-[5px]`}>
      {ALL_DAYS.map((day, index) => {
        const value = WEEKDAY_VALUES[index];
        const active = selectedDays.includes(value);
        return (
          <button key={day} onClick={() => {
            const nextDays = active ? selectedDays.filter((item) => item !== value) : [...selectedDays, value].sort((a, b) => a - b);
            updateSchedule({ weekdays: nextDays });
            setScheduleError("");
          }} className="aspect-square rounded-full border text-[12px] font-semibold" style={active ? { backgroundColor: GREEN, borderColor: GREEN, color: "#fff" } : { borderColor: "var(--border)", color: "var(--foreground)" }}>
            {day}
          </button>
        );
      })}
    </div>
  );

  const renderSchedule = () => (
    <div className="rounded-2xl bg-card p-4">
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
        {[
          { mode: "partOfDay" as const, label: "Время суток" },
          { mode: "exact" as const, label: "Точное время" },
        ].map((item) => {
          const active = timeMode === item.mode;
          return (
            <button
              key={item.mode}
              onClick={() => {
                if (item.mode === timeMode) return;
                if (item.mode === "exact") {
                  updateSchedule({ mode: "exact", timeMode: "exact", time: null, partOfDay: null, start: exactStart, end: exactEnd || exactStart });
                } else {
                  updateSchedule({ mode: "partOfDay", timeMode: "partOfDay", time: null, start: undefined, end: undefined });
                }
                setScheduleError("");
              }}
              className="h-10 rounded-lg text-[14px] font-semibold transition-colors"
              style={active ? { backgroundColor: GREEN, color: "#fff" } : { color: "var(--foreground)" }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {timeMode === "partOfDay" ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(PART_OF_DAY_RANGES).map(([key, item]) => {
              const active = partOfDay === key;
              return (
                <button key={key} onClick={() => { updateSchedule({ partOfDay: key as PartOfDay }); setScheduleError(""); }} className="rounded-full border px-3 py-2.5 text-[14px] font-medium" style={active ? { backgroundColor: GREEN, borderColor: GREEN, color: "#fff" } : { borderColor: "var(--border)", color: "var(--foreground)" }}>
                  {item.label}
                </button>
              );
            })}
          </div>
          {renderWeekdayGrid()}
        </>
      ) : (
        <div className="space-y-3">
          {[
            { label: "Начало", date: startParts.date, time: startParts.time, onDate: (value: string) => updateSchedule({ start: `${value}T${startParts.time || "00:00"}`, end: `${value}T${endParts.time || startParts.time || "00:00"}` }), onTime: (value: string) => updateSchedule({ start: `${startParts.date}T${value || "00:00"}` }) },
            { label: "Конец", date: endParts.date || startParts.date, time: endParts.time, onDate: (value: string) => updateSchedule({ end: `${value}T${endParts.time || "00:00"}` }), onTime: (value: string) => updateSchedule({ end: `${endParts.date || startParts.date}T${value || "00:00"}` }) },
          ].map((row) => (
            <div key={row.label} className="rounded-lg border border-border px-3.5 py-3">
              <p className="mb-2 text-[13px] font-medium text-foreground">{row.label}</p>
              <div className="grid grid-cols-2 gap-3">
                <label><span className="mb-1 block text-[12px] text-muted-foreground">Дата{getWeekdayFromDate(row.date) ? ` · ${getWeekdayFromDate(row.date)}` : ""}</span><input type="date" value={row.date} onChange={(e) => row.onDate(e.target.value)} className="w-full bg-transparent text-[14px] outline-none" /></label>
                <label><span className="mb-1 block text-[12px] text-muted-foreground">Время</span><input type="time" value={row.time} onChange={(e) => row.onTime(e.target.value)} className="w-full bg-transparent text-[14px] outline-none" /></label>
              </div>
            </div>
          ))}
          {repeat.type !== "none" && renderWeekdayGrid("pt-2")}
        </div>
      )}

      <div className="mt-5">
        <div className="mb-2 flex items-center gap-2 text-[14px] font-medium"><Repeat2 size={18} />Повторять</div>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
          {[
            { label: "Не повторять", weekly: false },
            { label: "Каждую неделю", weekly: true },
          ].map((option) => {
            const active = option.weekly ? repeat.type === "weekly" : repeat.type === "none";
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => {
                  if (active) return;
                  if (!option.weekly) {
                    updateSchedule({ repeat: { type: "none" } });
                    return;
                  }
                  const startDate = new Date(exactStart);
                  const startWeekday = Number.isNaN(startDate.getTime()) ? 1 : startDate.getDay() || 7;
                  updateSchedule({
                    repeat: { type: "weekly" },
                    weekdays: selectedDays.length > 0 ? selectedDays : [startWeekday],
                  });
                }}
                className="h-10 rounded-lg text-[14px] font-semibold"
                style={active ? { backgroundColor: GREEN, color: "#fff" } : { color: "var(--foreground)" }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      {repeat.type === "weekly" && (
        <div className="mt-3 rounded-xl border border-border px-3.5 py-3">
          <div className="flex items-center gap-3">
            <label className="min-w-0 flex-1">
              <span className="mb-1 block text-[13px] font-medium text-foreground">Повторять до</span>
              <input
                type="date"
                min={startParts.date || undefined}
                value={repeat.until ?? ""}
                onChange={(event) => updateSchedule({ repeat: event.target.value ? { type: "weekly", until: event.target.value } : { type: "weekly" } })}
                className="w-full bg-transparent text-[14px] outline-none"
              />
            </label>
            {repeat.until && (
              <button type="button" onClick={() => updateSchedule({ repeat: { type: "weekly" } })} className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted" aria-label="Сбросить дату окончания повтора">
                <X size={15} />
              </button>
            )}
          </div>
          <p className="mt-3 text-[13px] text-muted-foreground">{repeatSummary}</p>
        </div>
      )}
      {scheduleError && <p className="mt-3 text-[12px] font-medium text-destructive">{scheduleError}</p>}
    </div>
  );

  const renderFinalOptions = () => (
    <div className="space-y-2">
      <div className="rounded-xl bg-card px-4 py-4">
        <p className="mb-3 text-[15px] font-medium">Уровень</p>
        <div className="grid grid-cols-3 gap-1.5">
          {([
            ["well", "Well"],
            ["veryWell", "Very well"],
            ["tooWell", "Too well"],
          ] as const).map(([value, label]) => {
            const active = selectedLevel === value;
            return <button key={label} type="button" onClick={() => setSelectedLevel(active ? undefined : value)} className="flex h-11 min-w-0 items-center justify-center overflow-hidden rounded-xl border px-1 text-center" style={active ? { borderColor: GREEN, backgroundColor: GREEN_LIGHT, color: GREEN } : { borderColor: "var(--border)" }}><span className="block max-w-full truncate text-[13px] font-semibold">{label}</span></button>;
          })}
        </div>
      </div>
      <div className="rounded-xl bg-card px-4 py-4">
        <p className="mb-3 text-[15px] font-medium">Дистанция или время</p>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {([['distance', 'Дистанция'], ['time', 'Время']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setMetricMode(metricMode === value ? "none" : value)} className="h-10 rounded-lg text-[13px] font-semibold" style={metricMode === value ? { backgroundColor: GREEN, color: "#fff" } : undefined}>{label}</button>)}
        </div>
        {metricMode === "distance" && <div className="mt-3 flex gap-2"><input type="number" inputMode="decimal" min="0" step="any" value={distanceValue} onChange={(event) => setDistanceValue(event.target.value)} placeholder="5" className="h-11 min-w-0 flex-1 rounded-xl bg-muted px-3 text-[14px] outline-none" /><div className="grid w-24 grid-cols-2 rounded-xl bg-muted p-1">{(["км", "м"] as const).map((unit) => <button key={unit} type="button" onClick={() => setDistanceUnit(unit)} className="rounded-lg text-[13px] font-semibold" style={distanceUnit === unit ? { backgroundColor: GREEN, color: "#fff" } : undefined}>{unit}</button>)}</div></div>}
        {metricMode === "time" && <div className="mt-3 flex items-center gap-2"><input type="number" inputMode="numeric" min="0" step="1" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} placeholder="60" className="h-11 min-w-0 flex-1 rounded-xl bg-muted px-3 text-[14px] outline-none" /><span className="text-[14px] text-muted-foreground">мин</span></div>}
      </div>
      <button onClick={() => setVisibility((value) => value === "all" ? "onlyMe" : "all")} className="flex w-full items-center gap-3 rounded-xl bg-card px-4 py-3.5 text-left">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">{visibility === "all" ? <Eye size={17} color={GREEN} /> : <Lock size={17} color={GREEN} />}</div>
        <span className="flex-1 text-[15px] font-medium">Видимость</span>
        <span className="text-[14px] text-muted-foreground">{visibility === "all" ? "Все" : "Только я"}</span>
      </button>
      <OptionRow
        icon={<Users size={17} color={GREEN} />}
        label="Участники"
        subtitle={selectedParticipantItems.length ? `Выбрано: ${selectedParticipantItems.length}` : "Выбрать участников"}
        onClick={() => setParticipantsOpen(true)}
        control={selectedParticipantItems.length > 0 ? <div className="flex -space-x-2">{selectedParticipantItems.slice(0, 4).map((person) => person.avatarUrl ? <img loading="lazy" decoding="async" key={person.id} src={person.avatarUrl} alt={person.name} className="h-7 w-7 rounded-full border-2 border-card object-cover" /> : <span key={person.id} className="h-7 w-7 rounded-full border-2 border-card bg-secondary" />)}</div> : <Plus size={18} color={GREEN} />}
      />
      <div className="rounded-xl bg-card px-4 py-3.5">
        <label>
          <span className="mb-2 block text-[15px] font-medium text-foreground">Лимит участников</span>
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
            className="h-11 w-full rounded-xl bg-muted px-3 text-[14px] outline-none placeholder:text-muted-foreground"
          />
        </label>
        {maxParticipantsError && <p className="mt-2 text-[12px] font-medium text-destructive">{maxParticipantsError}</p>}
      </div>
    </div>
  );

  const renderPlace = () => (
    <div className="space-y-2">
      <div className="rounded-xl bg-card px-4 py-3.5">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
          {(["online", "offline"] as const).map((mode) => {
            const active = locationMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setLocationMode(mode)}
                className="h-10 rounded-lg text-[14px] font-semibold transition-colors"
                style={active ? { backgroundColor: GREEN, color: "#fff" } : { color: "var(--foreground)" }}
              >
                {mode === "online" ? "Онлайн" : "Офлайн"}
              </button>
            );
          })}
        </div>
      </div>
      {locationMode === "offline" && <input value={locationAddress} onChange={(event) => setLocationAddress(event.target.value)} placeholder="Адрес места проведения" className="h-12 w-full rounded-xl bg-card px-4 text-[14px] outline-none placeholder:text-muted-foreground" />}
    </div>
  );

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

  const renderGalleryPhotos = () => (
    <section className="relative mt-7">
      <h3 className="text-[16px] font-semibold">Фото для галереи</h3>
      <p className="mt-1 text-[14px] text-muted-foreground">Покажи, как проходит активность</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {draft.photos.map((photo, index) => (
          <div key={`${photo}-${index}`} className="relative aspect-square overflow-hidden rounded-xl">
            <img loading="lazy" decoding="async" src={photo} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              disabled={uploadProgress !== null}
              aria-label={`Удалить фото ${index + 1}`}
              onClick={() => setDraft((item) => ({ ...item, photos: item.photos.filter((_, photoIndex) => photoIndex !== index) }))}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white disabled:opacity-50"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {draft.photos.length < 10 && (
          <label className={`flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-border bg-card ${uploadProgress === null ? "active:opacity-80" : "cursor-not-allowed opacity-50"}`}>
            <Plus size={28} color={GREEN} />
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploadProgress !== null}
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = "";
                void uploadGalleryPhotos(files);
              }}
            />
          </label>
        )}
      </div>
      {uploadProgress !== null && galleryUploadProgress && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60">
          <span className="text-center text-[18px] font-semibold text-white">
            {galleryUploadProgress.current} из {galleryUploadProgress.total}
            <span className="mt-1 block text-[14px]">{uploadProgress}%</span>
          </span>
        </div>
      )}
    </section>
  );

  const cardBackground = draft.gradient ?? DEFAULT_BG;
  const hasSchedule = timeMode === "exact"
    ? Boolean(currentSchedule.start)
    : Boolean(currentSchedule.partOfDay && currentSchedule.weekdays.length > 0);
  const dateSummary = hasSchedule ? getTimeDate(currentSchedule) : "";

  return (
    <div className="relative flex h-full flex-col bg-surface">
      <div className="flex h-14 flex-shrink-0 items-center justify-between px-4">
        <button onClick={() => onNavigate(backTo)} className="flex h-10 w-10 items-center justify-start" aria-label="Закрыть">
          <X size={20} color="var(--foreground)" />
        </button>
        <h1 className="text-[16px] font-semibold">{isEditing ? "Редактирование" : "Новый план"}</h1>
        <div className="h-10 w-10" />
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        <div className="relative aspect-[4/5] w-full">
          {draft.coverImage
            ? <img src={draft.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
            : <div className="absolute inset-0" style={{ background: cardBackground }} />}
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)" }} />

          <button
            type="button"
            onClick={() => setActiveSheet("background")}
            className="absolute right-4 top-4 rounded-full px-3 py-1.5 text-[13px] font-medium text-white backdrop-blur-md"
            style={{ background: "rgba(255,255,255,0.18)" }}
          >
            Изменить фон
          </button>

          <div className="absolute inset-x-4 bottom-16 flex flex-col items-center text-center">
            <textarea
              value={draft.title}
              maxLength={TITLE_LIMIT}
              onChange={(event) => updateTitle(event.target.value)}
              placeholder="Название плана"
              rows={2}
              className="w-full resize-none bg-transparent text-center text-[30px] font-bold leading-[1.1] text-white outline-none placeholder:text-white/60"
            />
            {titleError && <p className="mt-1 text-[12px] font-medium text-white/90">{titleError}</p>}
          </div>

          <div className="absolute inset-x-4 bottom-5 flex items-center justify-center gap-2 text-white/90">
            {currentAuthor.avatarUrl
              ? <img src={currentAuthor.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
              : <span className="h-6 w-6 rounded-full bg-white/30" />}
            <span className="text-[13px]">Организует {currentAuthor.name}</span>
          </div>
        </div>

        <div className="mt-4 space-y-2 px-4">
          <OptionRow
            icon={<Calendar size={17} color={GREEN} />}
            label="Дата и время"
            subtitle={dateSummary || "Добавить дату"}
            onClick={() => setActiveSheet("datetime")}
            control={<ChevronRight size={18} className="text-muted-foreground" />}
          />
          <OptionRow
            icon={<MapPin size={17} color={GREEN} />}
            label="Место"
            subtitle={locationMode === "online" ? "Онлайн" : locationAddress || "Добавить место"}
            onClick={() => setActiveSheet("place")}
            control={<ChevronRight size={18} className="text-muted-foreground" />}
          />
          <OptionRow
            icon={<AlignLeft size={17} color={GREEN} />}
            label="Описание"
            subtitle={draft.description ? draft.description.slice(0, 60) : "Добавить описание"}
            onClick={() => setActiveSheet("description")}
            control={<ChevronRight size={18} className="text-muted-foreground" />}
          />
          <OptionRow
            icon={<SlidersHorizontal size={17} color={GREEN} />}
            label="Детали"
            subtitle="Уровень, дистанция, участники, видимость"
            onClick={() => setActiveSheet("details")}
            control={<ChevronRight size={18} className="text-muted-foreground" />}
          />
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-border bg-card px-4 pb-4 pt-3">
        <button onClick={handleCreate} className="h-12 w-full rounded-xl text-[15px] font-semibold text-white" style={{ backgroundColor: GREEN }}>
          {isEditing ? "Сохранить" : "Создать"}
        </button>
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

            <h3 className="mb-3 mt-6 text-[16px] font-semibold">Или выбери фон</h3>
            <div className="grid grid-cols-3 gap-2">
              {BG_PRESETS.map((preset, index) => {
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

            {renderGalleryPhotos()}

            {uploadProgress !== null && !galleryUploadProgress && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60">
                <span className="text-[22px] font-semibold text-white">{uploadProgress}%</span>
              </div>
            )}
          </div>
        </HomeSheet>
      )}

      {activeSheet === "datetime" && (
        <HomeSheet title="Дата и время" onClose={() => setActiveSheet(null)} panelClassName="max-h-[85vh]" bodyClassName="overflow-y-auto">
          {renderSchedule()}
          <button
            type="button"
            onClick={() => {
              const error = validateSchedule(currentSchedule);
              setScheduleError(error);
              if (!error) setActiveSheet(null);
            }}
            className="mt-4 h-12 w-full rounded-xl text-[15px] font-semibold text-white"
            style={{ backgroundColor: GREEN }}
          >
            Готово
          </button>
        </HomeSheet>
      )}

      {activeSheet === "place" && (
        <HomeSheet title="Место" onClose={() => setActiveSheet(null)}>
          {renderPlace()}
          <button type="button" onClick={() => setActiveSheet(null)} className="mt-4 h-12 w-full rounded-xl text-[15px] font-semibold text-white" style={{ backgroundColor: GREEN }}>
            Готово
          </button>
        </HomeSheet>
      )}

      {activeSheet === "description" && (
        <HomeSheet title="Описание" onClose={() => setActiveSheet(null)}>
          <textarea
            value={draft.description}
            maxLength={DESCRIPTION_LIMIT}
            onChange={(event) => updateDescription(event.target.value)}
            placeholder="Что будешь делать, и с какой целью"
            rows={5}
            className="min-h-[150px] w-full resize-none rounded-xl bg-card px-3.5 py-3.5 text-[14px] leading-5 outline-none"
          />
          {descriptionLeft < DESCRIPTION_LIMIT * 0.2 && <p className="mt-2 text-right text-[12px] text-muted-foreground">{descriptionLeft}</p>}
          <button type="button" onClick={() => setActiveSheet(null)} className="mt-4 h-12 w-full rounded-xl text-[15px] font-semibold text-white" style={{ backgroundColor: GREEN }}>
            Готово
          </button>
        </HomeSheet>
      )}

      {activeSheet === "details" && (
        <HomeSheet title="Детали" onClose={() => setActiveSheet(null)} panelClassName="max-h-[85vh]" bodyClassName="overflow-y-auto">
          {renderFinalOptions()}
          <button type="button" onClick={() => setActiveSheet(null)} className="mt-4 h-12 w-full rounded-xl text-[15px] font-semibold text-white" style={{ backgroundColor: GREEN }}>
            Готово
          </button>
        </HomeSheet>
      )}
      {galleryToast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-foreground px-4 py-3 text-[14px] font-medium text-background shadow-lg">
          {galleryToast}
        </div>
      )}
      {participantsOpen && (
        <HomeSheet title="Участники" onClose={() => setParticipantsOpen(false)} panelClassName="max-h-[85vh] flex flex-col" bodyClassName="flex min-h-0 flex-col">
          <div className="mb-3 flex h-11 flex-shrink-0 items-center gap-2 rounded-xl bg-gray-100 px-3">
            <Search size={17} strokeWidth={1.9} className="text-gray-500" />
            <input
              value={participantQuery}
              onChange={(event) => setParticipantQuery(event.target.value)}
              placeholder="Поиск по имени"
              className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="max-h-[60vh] min-h-0 space-y-1 overflow-y-auto pb-2">
            {participantsLoading && <p className="px-3 py-4 text-center text-[13px] text-muted-foreground">Загружаем участников...</p>}
            {!participantsLoading && filteredPeople.length === 0 && <p className="px-3 py-4 text-center text-[13px] text-muted-foreground">Пользователи не найдены</p>}
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
                  style={active ? { backgroundColor: GREEN_LIGHT } : { backgroundColor: "var(--card)" }}
                >
                  {person.avatarUrl ? <img loading="lazy" decoding="async" src={person.avatarUrl} alt={person.name} className="h-9 w-9 rounded-full object-cover" /> : <span className="h-9 w-9 rounded-full bg-secondary" />}
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{person.name}</span>
                  {active && <Check size={16} color={GREEN} />}
                </button>
              );
            })}
          </div>
          <div className="flex-shrink-0 border-t border-border bg-white pt-3">
            <button onClick={() => setParticipantsOpen(false)} className="h-12 w-full rounded-xl text-[15px] font-semibold text-white" style={{ backgroundColor: GREEN }}>
              Пригласить участников
            </button>
          </div>
        </HomeSheet>
      )}
    </div>
  );
}
