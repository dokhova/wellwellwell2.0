import { useEffect, useMemo, useState, type TouchEvent } from "react";
import confetti from "canvas-confetti";
import { ArrowLeft, Check, ChevronDown, Eye, Image as ImageIcon, Lock, MapPin, Plus, Repeat2, Search, Sparkles, Users, X } from "lucide-react";
import type { HomeFeedPlan, PartOfDay, PlanRepeat, Schedule, Screen, TimeMode, Visibility } from "@/app/types";
import { ALL_DAYS, GREEN, GREEN_LIGHT, PART_OF_DAY_RANGES, WEEKDAY_VALUES } from "@/app/data/constants";
import { DEFAULT_PLAN_AUTHOR, PLAN_TAG_GRADIENTS } from "@/app/data/plans";
import { HomeSheet } from "@/app/components/HomeSheet";
import { sanitizeImageUrl, uploadPhoto } from "@/app/lib/api/storage";
import { fetchRecentProfiles, searchProfiles } from "@/app/lib/api/profiles";

type CreateStep = "welcome" | "name" | "description" | "image" | "schedule" | "finalOptions" | "success";
type PlanDraft = { title: string; description: string; coverImage: string | null; schedule: Schedule };
type Person = { id: string; name: string; avatarUrl: string | null };
const TITLE_LIMIT = 80;
const DESCRIPTION_LIMIT = 3000;

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

const scrollFocusedFieldIntoView = (element: HTMLElement) => {
  window.setTimeout(() => {
    element.scrollIntoView({ block: "center", behavior: "smooth" });
  }, 300);
};

const isEditableElement = (element: Element | null): element is HTMLInputElement | HTMLTextAreaElement =>
  element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;

const defaultSchedule = (): Schedule => ({
  mode: "partOfDay",
  timeMode: "partOfDay",
  time: null,
  partOfDay: null,
  weekdays: [],
  repeat: { type: "days", days: 21 },
});

const defaultPlan = (): PlanDraft => ({ title: "", description: "", coverImage: null, schedule: defaultSchedule() });

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

  const [step, setStep] = useState<CreateStep>("name");
  const [history, setHistory] = useState<CreateStep[]>([]);
  const [draft, setDraft] = useState<PlanDraft>(() => editingPlan ? {
    title: editingPlan.title.slice(0, TITLE_LIMIT),
    description: editingPlan.description.slice(0, DESCRIPTION_LIMIT),
    coverImage: editingPlan.coverUrl ?? null,
    schedule: editingPlan.schedule,
  } : defaultPlan());
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [untilWeek, setUntilWeek] = useState(4);
  const [titleError, setTitleError] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [visibility, setVisibility] = useState<Visibility>(editingPlan?.visibility ?? "all");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<Person[]>([]);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [participantQuery, setParticipantQuery] = useState("");
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [fieldFocused, setFieldFocused] = useState(false);
  const [locationMode, setLocationMode] = useState<"online" | "offline">(editingPlan?.format ?? "online");
  const [locationAddress, setLocationAddress] = useState(editingPlan?.address ?? "");
  const [selectedLevel, setSelectedLevel] = useState<HomeFeedPlan["level"]>(editingPlan?.level);
  const [metricMode, setMetricMode] = useState<"none" | "distance" | "time">(editingPlan?.distanceLabel ? "distance" : editingPlan?.duration ? "time" : "none");
  const [distanceValue, setDistanceValue] = useState(() => editingPlan?.distanceLabel?.match(/[\d.,]+/)?.[0]?.replace(",", ".") ?? "");
  const [distanceUnit, setDistanceUnit] = useState<"км" | "м">(editingPlan?.distanceLabel?.trim().endsWith(" км") ? "км" : "м");
  const [durationMinutes, setDurationMinutes] = useState(() => editingPlan?.duration?.match(/[\d.,]+/)?.[0]?.replace(",", ".") ?? "");

  const currentSchedule = draft.schedule;
  const timeMode: TimeMode = currentSchedule.timeMode ?? currentSchedule.mode ?? "partOfDay";
  const partOfDay = currentSchedule.partOfDay;
  const selectedDays = currentSchedule.weekdays;
  const exactStart = currentSchedule.start ?? initialDateTime;
  const exactEnd = typeof currentSchedule.end === "string" ? currentSchedule.end : exactStart;
  const repeat = currentSchedule.repeat ?? { type: "days", days: 21 };
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

  const goTo = (next: CreateStep) => {
    if (uploadProgress !== null) return;
    setHistory((items) => [...items, step]);
    setStep(next);
    setTitleError("");
    setScheduleError("");
  };

  const goBack = () => {
    if (uploadProgress !== null) return;
    if (history.length === 0) {
      onNavigate(backTo);
      return;
    }
    const previous = history[history.length - 1];
    setHistory((items) => items.slice(0, -1));
    setStep(previous);
    setTitleError("");
    setScheduleError("");
  };

  const updatePlan = (next: Partial<PlanDraft>) => setDraft((item) => ({ ...item, ...next }));
  const updateSchedule = (next: Partial<Schedule>) => updatePlan({ schedule: { ...currentSchedule, ...next } });
  const updateTitle = (value: string) => {
    updatePlan({ title: value.slice(0, TITLE_LIMIT) });
    setTitleError("");
  };
  const updateDescription = (value: string) => updatePlan({ description: value.slice(0, DESCRIPTION_LIMIT) });

  const getRepeatEnd = (schedule: Schedule) => {
    if (schedule.repeat?.type === "none") return schedule.start;
    if (schedule.repeat?.type !== "days" || !schedule.start) return typeof schedule.end === "string" ? schedule.end : undefined;
    const startDate = new Date(schedule.start);
    if (Number.isNaN(startDate.getTime())) return typeof schedule.end === "string" ? schedule.end : undefined;
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + Math.max(1, schedule.repeat.days) - 1);
    return endDate.toISOString();
  };

  const validateSchedule = (schedule: Schedule) => {
    const mode = schedule.timeMode ?? schedule.mode ?? "partOfDay";
    if (mode === "partOfDay") {
      if (!schedule.partOfDay) return "Выберите время суток";
      if (schedule.weekdays.length === 0) return "Выберите хотя бы один день недели";
    }
    if (mode === "exact" && !schedule.start) return "Выберите дату и время начала";
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
      return schedule.repeat?.type === "days" && endLabel ? `${startLabel} — до ${endLabel}` : startLabel;
    }
    return schedule.partOfDay ? PART_OF_DAY_RANGES[schedule.partOfDay].label : "Расписание";
  };

  const handleCreate = () => {
    if (!draft.title.trim()) {
      setTitleError("Введите название");
      setStep("name");
      return;
    }

    const invalidSchedule = validateSchedule(draft.schedule);
    if (invalidSchedule) {
      setScheduleError(invalidSchedule);
      setStep("schedule");
      return;
    }

    const distanceLabel = metricMode === "distance" && Number(distanceValue) > 0 ? `${Number(distanceValue)} ${distanceUnit}` : undefined;
    const duration = metricMode === "time" && Number(durationMinutes) > 0 ? `${Number(durationMinutes)} мин` : undefined;

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
        schedule: draft.schedule,
        timeDate: getTimeDate(draft.schedule),
        address: locationMode === "offline" && locationAddress.trim() ? locationAddress.trim() : undefined,
      };
      const result: CreatedPlanResult = {
        plan: { ...draft, title: draft.title.trim(), description: draft.description.trim() },
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
      gradient: PLAN_TAG_GRADIENTS.other,
      schedule: draft.schedule,
      participants: authorParticipants,
      participantsLabel: "1 чел.",
      timeDate: getTimeDate(draft.schedule),
      address: locationMode === "offline" && locationAddress.trim() ? locationAddress.trim() : undefined,
      author: currentAuthor,
    };
    const result: CreatedPlanResult = {
      plan: { ...draft, title: draft.title.trim(), description: draft.description.trim() },
      visibility,
      participants: selectedParticipants,
      location: locationMode === "online" ? "online" : locationAddress.trim() ? { address: locationAddress.trim() } : null,
      videoMeeting: { enabled: false, link: "" },
    };

    onCreatePlan([newPlan], result);
    setStep("success");
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.75 } });
    window.setTimeout(() => onNavigate("plans"), 750);
  };

  const continueFromName = () => {
    if (!draft.title.trim()) {
      setTitleError("Введите название");
      return;
    }
    goTo("description");
  };

  const continueFromSchedule = () => {
    const error = validateSchedule(currentSchedule);
    setScheduleError(error);
    if (error) return;
    goTo("finalOptions");
  };

  const handleScrollTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const activeElement = document.activeElement;
    if (isEditableElement(activeElement) && event.target !== activeElement) {
      activeElement.blur();
    }
  };

  const repeatLabel = repeat.type === "none" ? "Не повторять" : repeat.type === "days" ? `${repeat.days} день` : repeat.type === "weekly" ? "Каждую неделю" : repeat.type === "untilWeek" ? `До недели ${repeat.week}` : "Бессрочно";
  const titleLeft = TITLE_LIMIT - draft.title.length;
  const descriptionLeft = DESCRIPTION_LIMIT - draft.description.length;
  const progressSteps = 6;
  const progressIndex = ["welcome", "name", "description", "image", "schedule", "finalOptions", "success"].indexOf(step);

  const renderProgress = () => (
    <div className="flex justify-center gap-1.5 px-4 pb-3">
      {Array.from({ length: progressSteps }).map((_, index) => (
        <span key={index} className="h-2 rounded-full transition-all duration-200" style={{ width: index <= progressIndex ? 22 : 8, backgroundColor: index <= progressIndex ? GREEN : "var(--border)" }} />
      ))}
    </div>
  );

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

      <button onClick={() => setShowRepeatPicker((show) => !show)} className="mt-5 flex w-full items-center justify-between rounded-lg bg-muted px-3.5 py-3 text-left">
        <span className="flex items-center gap-2 text-[14px]"><Repeat2 size={18} />Повторять</span>
        <span className="flex items-center gap-1.5 text-[14px] text-muted-foreground">{repeatLabel}<ChevronDown size={16} /></span>
      </button>
      {showRepeatPicker && (
        <div className="mt-2 rounded-lg bg-muted p-2">
          {[
            { label: "Не повторять", action: () => updateSchedule({ repeat: { type: "none" }, start: currentSchedule.start ?? exactStart }), active: repeat.type === "none" },
            { label: "21 день", action: () => updateSchedule({ repeat: { type: "days", days: 21 } }), active: repeat.type === "days" },
            { label: "Каждую неделю", action: () => updateSchedule({ repeat: { type: "weekly" } }), active: repeat.type === "weekly" },
            { label: "До недели N", action: () => updateSchedule({ repeat: { type: "untilWeek", week: untilWeek } }), active: repeat.type === "untilWeek" },
            { label: "Бессрочно", action: () => updateSchedule({ repeat: { type: "forever" } }), active: repeat.type === "forever" },
          ].map((option) => (
            <button key={option.label} onClick={option.action} className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-[14px] font-medium" style={option.active ? { backgroundColor: GREEN_LIGHT, color: GREEN } : undefined}>
              {option.label}
              {option.active && <Check size={16} strokeWidth={2.4} />}
            </button>
          ))}
          {repeat.type === "untilWeek" && <input type="number" min={1} value={repeat.week} onChange={(e) => { const week = Math.max(1, Number(e.target.value) || 1); setUntilWeek(week); updateSchedule({ repeat: { type: "untilWeek", week } }); }} className="mt-2 h-10 w-full rounded-md bg-card px-3 text-[14px] outline-none" />}
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
            ["well", "Well", "без подготовки"],
            ["veryWell", "Very well", "базовая подготовка"],
            ["tooWell", "Too well", "уверенная подготовка"],
          ] as const).map(([value, label, subtitle]) => {
            const active = selectedLevel === value;
            return <button key={label} type="button" onClick={() => setSelectedLevel(active ? undefined : value)} className="min-w-0 rounded-xl border px-1.5 py-2 text-center" style={active ? { borderColor: GREEN, backgroundColor: GREEN_LIGHT, color: GREEN } : { borderColor: "var(--border)" }}><span className="block truncate text-[14px] font-semibold">{label}</span><span className="mt-0.5 block whitespace-nowrap text-[10px] text-muted-foreground">{subtitle}</span></button>;
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
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
            <MapPin size={17} color={GREEN} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium text-foreground">Локация</p>
            <p className="mt-0.5 truncate text-[12px] leading-4 text-muted-foreground">
              {locationMode === "online" ? "Онлайн" : locationAddress || "Адрес не указан"}
            </p>
          </div>
        </div>
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

  const renderStep = () => {
    switch (step) {
      case "welcome":
        return <div className="flex min-h-full flex-col justify-center"><div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl" style={{ backgroundColor: GREEN_LIGHT }}><Sparkles size={30} color={GREEN} /></div><h2 className="text-[32px] font-bold leading-[36px] text-foreground">Собери свой план</h2><p className="mt-3 text-[16px] leading-6 text-muted-foreground">Пара шагов, немного расписания, и план уже в твоём списке.</p></div>;
      case "name":
        return <div className="pt-6 transition-all duration-200"><p className="mb-2 text-[13px] text-muted-foreground">Шаг 1: собери свой план</p><h2 className="mb-5 text-[28px] font-bold leading-[34px]">Название плана</h2><label><span className="mb-2 block text-[13px] text-muted-foreground">Короткое и ёмкое</span><input value={draft.title} maxLength={TITLE_LIMIT} onChange={(e) => updateTitle(e.target.value)} onFocus={(event) => { setFieldFocused(true); scrollFocusedFieldIntoView(event.currentTarget); }} onBlur={() => setFieldFocused(false)} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} enterKeyHint="done" placeholder="Например, вечерняя пробежка" className="h-14 w-full rounded-xl bg-card px-4 text-[16px] outline-none" /></label>{titleLeft < TITLE_LIMIT * 0.2 && <p className="mt-2 text-right text-[12px] text-muted-foreground">{titleLeft}</p>}{titleError && <p className="mt-2 text-[12px] font-medium text-destructive">{titleError}</p>}</div>;
      case "description":
        return <div className="pt-6"><h2 className="mb-5 text-[28px] font-bold">Описание</h2><textarea value={draft.description} maxLength={DESCRIPTION_LIMIT} onChange={(e) => updateDescription(e.target.value)} onFocus={(event) => { setFieldFocused(true); scrollFocusedFieldIntoView(event.currentTarget); }} onBlur={() => setFieldFocused(false)} placeholder="Что будешь делать, и с какой целью" rows={5} className="min-h-[150px] w-full resize-none rounded-xl bg-card px-3.5 py-3.5 text-[14px] leading-5 outline-none" />{descriptionLeft < DESCRIPTION_LIMIT * 0.2 && <p className="mt-2 text-right text-[12px] text-muted-foreground">{descriptionLeft}</p>}</div>;
      case "image":
        return <div className="pt-6"><h2 className="mb-5 text-[28px] font-bold">Обложка</h2><label className={`relative flex min-h-[220px] flex-col items-center justify-center overflow-hidden rounded-2xl bg-card px-6 text-center ${uploadProgress === null ? "active:opacity-90" : "cursor-not-allowed"}`}>{draft.coverImage ? <img loading="lazy" decoding="async" src={draft.coverImage} alt="" className="mb-4 h-28 w-28 rounded-xl object-cover" /> : <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary"><ImageIcon size={28} color={GREEN} /></div>}<p className="text-[16px] font-semibold">Добавь обложку</p><span className="mt-4 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white" style={{ backgroundColor: GREEN }}>Загрузить</span><input type="file" accept="image/*" disabled={uploadProgress !== null} className="hidden" onChange={async (event) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; setUploadProgress(0); try { const publicUrl = await uploadPhoto(file, { onProgress: setUploadProgress }); if (publicUrl) updatePlan({ coverImage: publicUrl }); } finally { setUploadProgress(null); } }} />{uploadProgress !== null && <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60"><span className="text-[22px] font-semibold text-white">{uploadProgress}%</span></div>}</label></div>;
      case "schedule":
        return <div className="pt-6"><h2 className="mb-5 text-[28px] font-bold">Регулярность</h2>{renderSchedule()}</div>;
      case "finalOptions":
        return <div className="pt-6"><h2 className="mb-5 text-[28px] font-bold">Настройки</h2>{renderFinalOptions()}</div>;
      case "success":
        return <div className="flex min-h-full flex-col items-center justify-center text-center"><div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: GREEN_LIGHT }}><Check size={38} color={GREEN} /></div><h2 className="text-[28px] font-bold">План создан</h2></div>;
    }
  };

  const renderFooter = () => {
    if (step === "success") return null;
    if (step === "welcome") return <button onClick={() => goTo("name")} className="h-12 w-full rounded-xl text-[15px] font-semibold text-white" style={{ backgroundColor: GREEN }}>Создать</button>;
    if (step === "description" || step === "image") return <div className="flex gap-3"><button disabled={uploadProgress !== null} onClick={() => goTo(step === "description" ? "image" : "schedule")} className="h-12 flex-1 rounded-xl bg-card text-[15px] font-semibold disabled:opacity-50">Пропустить</button><button disabled={uploadProgress !== null} onClick={() => goTo(step === "description" ? "image" : "schedule")} className="h-12 flex-1 rounded-xl text-[15px] font-semibold text-white disabled:opacity-50" style={{ backgroundColor: GREEN }}>Далее</button></div>;
    const action = step === "name" ? continueFromName : step === "schedule" ? continueFromSchedule : handleCreate;
    return <button onClick={action} className="h-12 w-full rounded-xl text-[15px] font-semibold text-white" style={{ backgroundColor: GREEN }}>{step === "finalOptions" ? (isEditing ? "Сохранить" : "Создать") : "Далее"}</button>;
  };

  const footer = renderFooter();

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-14 flex-shrink-0 items-center justify-between px-4">
        <button onClick={goBack} className="flex h-10 w-10 items-center justify-start">{history.length > 0 ? <ArrowLeft size={20} color="var(--foreground)" /> : <X size={20} color="var(--foreground)" />}</button>
        <h1 className="text-[16px] font-semibold">{isEditing ? "Редактирование" : "Новый план"}</h1>
        <div className="h-10 w-10" />
      </div>
      {renderProgress()}
      <div
        className={`flex-1 overflow-y-auto px-4 transition-all duration-200 ${fieldFocused ? "pb-[40vh]" : "pb-4"}`}
        onTouchStart={handleScrollTouchStart}
      >
        {renderStep()}
      </div>
      {footer && <div className="flex-shrink-0 border-t border-border bg-card px-4 pb-4 pt-3">{footer}</div>}
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
