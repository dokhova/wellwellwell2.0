import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { ArrowLeft, Check, ChevronDown, Clock, Eye, Image as ImageIcon, Lock, MapPin, Plus, Repeat2, Search, Sparkles, Users, X } from "lucide-react";
import type { HomeFeedPlan, PartOfDay, PlanRepeat, Schedule, Screen, TimeMode, Visibility } from "@/app/types";
import { ALL_DAYS, GREEN, GREEN_LIGHT, PART_OF_DAY_RANGES, WEEKDAY_VALUES } from "@/app/data/constants";
import { DEFAULT_PLAN_AUTHOR, PLAN_TAG_GRADIENTS } from "@/app/data/plans";
import { HomeSheet } from "@/app/components/HomeSheet";
import { sanitizeImageUrl, uploadPhoto } from "@/app/lib/api/storage";
import { fetchRecentProfiles, searchProfiles } from "@/app/lib/api/profiles";

type CreateStep = "welcome" | "name" | "description" | "image" | "schedule" | "finalOptions" | "success";
type PlanDraft = { title: string; description: string; coverImage: string | null; schedule: Schedule };
type Person = { id: string; name: string; avatarUrl: string | null };

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
  currentAuthor = DEFAULT_PLAN_AUTHOR,
}: {
  onNavigate: (s: Screen) => void;
  backTo?: Screen;
  onCreatePlan: (plans: HomeFeedPlan[], result: CreatedPlanResult) => void;
  currentAuthor?: HomeFeedPlan["author"];
}) {
  const initialDateTime = useMemo(() => getLocalDateTime(), []);
  const [people, setPeople] = useState<Person[]>([]);

  const [step, setStep] = useState<CreateStep>("welcome");
  const [history, setHistory] = useState<CreateStep[]>([]);
  const [draft, setDraft] = useState<PlanDraft>(defaultPlan());
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [untilWeek, setUntilWeek] = useState(4);
  const [titleError, setTitleError] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<Person[]>([]);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [participantQuery, setParticipantQuery] = useState("");
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [locationMode, setLocationMode] = useState<"online" | "offline">("online");
  const [locationAddress, setLocationAddress] = useState("");

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
    setHistory((items) => [...items, step]);
    setStep(next);
    setTitleError("");
    setScheduleError("");
  };

  const goBack = () => {
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
      return Number.isNaN(date.getTime()) ? "Точное время" : date.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
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

    const id = Date.now();
    const participantAvatars = [currentAuthor.avatarUrl].filter((url): url is string => Boolean(url));
    const participantCount = 1;
    const newPlan: HomeFeedPlan = {
      id,
      kind: "plan",
      visibility,
      tag: "other",
      format: locationMode,
      duration: "План",
      title: draft.title.trim(),
      description: draft.description.trim(),
      habit: { title: draft.title.trim(), durationMin: 15 },
      coverUrl: draft.coverImage ?? undefined,
      gradient: PLAN_TAG_GRADIENTS.other,
      schedule: draft.schedule,
      participants: Array.from(new Set(participantAvatars)),
      participantsLabel: participantCount === 1 ? "Только я" : `${participantCount} чел.`,
      timeDate: getTimeDate(draft.schedule),
      address: locationMode === "offline" && locationAddress.trim() ? locationAddress.trim() : undefined,
      author: currentAuthor,
      shareUrl: `https://wellwellwell.app/plans/${id}`,
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

  const repeatLabel = repeat.type === "days" ? `${repeat.days} день` : repeat.type === "weekly" ? "Каждую неделю" : repeat.type === "untilWeek" ? `До недели ${repeat.week}` : "Бессрочно";
  const progressSteps = 6;
  const progressIndex = ["welcome", "name", "description", "image", "schedule", "finalOptions", "success"].indexOf(step);

  const renderProgress = () => (
    <div className="flex justify-center gap-1.5 px-4 pb-3">
      {Array.from({ length: progressSteps }).map((_, index) => (
        <span key={index} className="h-2 rounded-full transition-all duration-200" style={{ width: index <= progressIndex ? 22 : 8, backgroundColor: index <= progressIndex ? GREEN : "var(--border)" }} />
      ))}
    </div>
  );

  const renderSchedule = () => (
    <div className="rounded-2xl bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">Время</p>
        <button onClick={() => {
          if (timeMode === "partOfDay") {
            updateSchedule({ mode: "exact", timeMode: "exact", time: null, partOfDay: null, weekdays: [], start: exactStart, end: exactEnd || exactStart });
          } else {
            updateSchedule({ mode: "partOfDay", timeMode: "partOfDay", time: null, start: undefined, end: undefined });
          }
          setScheduleError("");
        }} className="flex items-center gap-1.5 text-[14px] font-medium" style={{ color: GREEN }}>
          <Clock size={15} strokeWidth={2} />
          {timeMode === "partOfDay" ? "Точное время" : "Время суток"}
        </button>
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
          <div className="mt-5 grid grid-cols-7 gap-[5px]">
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
        </>
      ) : (
        <div className="space-y-3">
          {[
            { label: "Начало", date: startParts.date, time: startParts.time, onDate: (value: string) => updateSchedule({ start: `${value}T${startParts.time || "00:00"}`, end: `${value}T${endParts.time || startParts.time || "00:00"}` }), onTime: (value: string) => updateSchedule({ start: `${startParts.date}T${value || "00:00"}` }) },
            { label: "Окончание", date: endParts.date || startParts.date, time: endParts.time, onDate: (value: string) => updateSchedule({ end: `${value}T${endParts.time || "00:00"}` }), onTime: (value: string) => updateSchedule({ end: `${endParts.date || startParts.date}T${value || "00:00"}` }) },
          ].map((row) => (
            <div key={row.label} className="rounded-lg border border-border px-3.5 py-3">
              <p className="mb-2 text-[13px] font-medium text-foreground">{row.label}</p>
              <div className="grid grid-cols-2 gap-3">
                <label><span className="mb-1 block text-[12px] text-muted-foreground">Дата</span><input type="date" value={row.date} onChange={(e) => row.onDate(e.target.value)} className="w-full bg-transparent text-[14px] outline-none" /></label>
                <label><span className="mb-1 block text-[12px] text-muted-foreground">Время</span><input type="time" value={row.time} onChange={(e) => row.onTime(e.target.value)} className="w-full bg-transparent text-[14px] outline-none" /></label>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setShowRepeatPicker((show) => !show)} className="mt-5 flex w-full items-center justify-between rounded-lg bg-muted px-3.5 py-3 text-left">
        <span className="flex items-center gap-2 text-[14px]"><Repeat2 size={18} />Повторение</span>
        <span className="flex items-center gap-1.5 text-[14px] text-muted-foreground">{repeatLabel}<ChevronDown size={16} /></span>
      </button>
      {showRepeatPicker && (
        <div className="mt-2 rounded-lg bg-muted p-2">
          {[
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
      <button onClick={() => setVisibility((value) => value === "all" ? "onlyMe" : "all")} className="flex w-full items-center gap-3 rounded-xl bg-card px-4 py-3.5 text-left">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">{visibility === "all" ? <Eye size={17} color={GREEN} /> : <Lock size={17} color={GREEN} />}</div>
        <span className="flex-1 text-[15px] font-medium">Видимость</span>
        <span className="text-[14px] text-muted-foreground">{visibility === "all" ? "Все" : "Только я"}</span>
      </button>
      <OptionRow
        icon={<Users size={17} color={GREEN} />}
        label="Участники"
        subtitle={selectedParticipantItems.length ? `${selectedParticipantItems.length} выбрано` : "Выбрать участников"}
        onClick={() => setParticipantsOpen(true)}
        control={selectedParticipantItems.length > 0 ? <div className="flex -space-x-2">{selectedParticipantItems.slice(0, 4).map((person) => person.avatarUrl ? <img loading="lazy" decoding="async" key={person.id} src={person.avatarUrl} alt={person.name} className="h-7 w-7 rounded-full border-2 border-card object-cover" /> : <span key={person.id} className="h-7 w-7 rounded-full border-2 border-card bg-secondary" />)}</div> : <Plus size={18} color={GREEN} />}
      />
      <OptionRow
        icon={<MapPin size={17} color={GREEN} />}
        label="Локация"
        subtitle={locationMode === "online" ? "Онлайн" : locationAddress || "Адрес не указан"}
        onClick={() => setLocationMode((mode) => mode === "online" ? "offline" : "online")}
        control={<span className="text-[13px] font-semibold" style={{ color: GREEN }}>{locationMode === "online" ? "Офлайн" : "Онлайн"}</span>}
      />
      {locationMode === "offline" && <input value={locationAddress} onChange={(event) => setLocationAddress(event.target.value)} placeholder="Адрес места проведения" className="h-12 w-full rounded-xl bg-card px-4 text-[14px] outline-none placeholder:text-muted-foreground" />}
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case "welcome":
        return <div className="flex min-h-full flex-col justify-center"><div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl" style={{ backgroundColor: GREEN_LIGHT }}><Sparkles size={30} color={GREEN} /></div><h2 className="text-[32px] font-bold leading-[36px] text-foreground">Соберём твой план</h2><p className="mt-3 text-[16px] leading-6 text-muted-foreground">Пара шагов, немного расписания, и план уже в твоём списке.</p></div>;
      case "name":
        return <div className="pt-6 transition-all duration-200"><h2 className="mb-5 text-[28px] font-bold leading-[34px]">Название плана</h2><label><span className="mb-2 block text-[13px] text-muted-foreground">Название</span><input value={draft.title} onChange={(e) => { updatePlan({ title: e.target.value }); setTitleError(""); }} placeholder="Например, вечерняя пробежка" className="h-14 w-full rounded-xl bg-card px-4 text-[16px] outline-none" autoFocus /></label>{titleError && <p className="mt-2 text-[12px] font-medium text-destructive">{titleError}</p>}</div>;
      case "description":
        return <div className="pt-6"><h2 className="mb-5 text-[28px] font-bold">Описание</h2><textarea value={draft.description} onChange={(e) => updatePlan({ description: e.target.value })} placeholder="Что будет в плане и зачем он нужен" rows={5} className="min-h-[150px] w-full resize-none rounded-xl bg-card px-3.5 py-3.5 text-[14px] leading-5 outline-none" /></div>;
      case "image":
        return <div className="pt-6"><h2 className="mb-5 text-[28px] font-bold">Обложка</h2><label className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl bg-card px-6 text-center active:opacity-90">{draft.coverImage ? <img loading="lazy" decoding="async" src={draft.coverImage} alt="" className="mb-4 h-28 w-28 rounded-xl object-cover" /> : <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary"><ImageIcon size={28} color={GREEN} /></div>}<p className="text-[16px] font-semibold">Добавь обложку</p><span className="mt-4 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white" style={{ backgroundColor: GREEN }}>Загрузить</span><input type="file" accept="image/*" className="hidden" onChange={async (event) => { const file = event.target.files?.[0]; if (file) { const publicUrl = await uploadPhoto(file); if (publicUrl) updatePlan({ coverImage: publicUrl }); } event.target.value = ""; }} /></label></div>;
      case "schedule":
        return <div className="pt-6"><h2 className="mb-5 text-[28px] font-bold">Дата и время</h2>{renderSchedule()}</div>;
      case "finalOptions":
        return <div className="pt-6"><h2 className="mb-5 text-[28px] font-bold">Финальные настройки</h2>{renderFinalOptions()}</div>;
      case "success":
        return <div className="flex min-h-full flex-col items-center justify-center text-center"><div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: GREEN_LIGHT }}><Check size={38} color={GREEN} /></div><h2 className="text-[28px] font-bold">План создан</h2></div>;
    }
  };

  const renderFooter = () => {
    if (step === "success") return null;
    if (step === "welcome") return <button onClick={() => goTo("name")} className="h-12 w-full rounded-xl text-[15px] font-semibold text-white" style={{ backgroundColor: GREEN }}>Создать</button>;
    if (step === "description" || step === "image") return <div className="flex gap-3"><button onClick={() => goTo(step === "description" ? "image" : "schedule")} className="h-12 flex-1 rounded-xl bg-card text-[15px] font-semibold">Пропустить</button><button onClick={() => goTo(step === "description" ? "image" : "schedule")} className="h-12 flex-1 rounded-xl text-[15px] font-semibold text-white" style={{ backgroundColor: GREEN }}>Далее</button></div>;
    const action = step === "name" ? continueFromName : step === "schedule" ? continueFromSchedule : handleCreate;
    return <button onClick={action} className="h-12 w-full rounded-xl text-[15px] font-semibold text-white" style={{ backgroundColor: GREEN }}>{step === "finalOptions" ? "Создать" : "Далее"}</button>;
  };

  const footer = renderFooter();

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-14 flex-shrink-0 items-center justify-between px-4">
        <button onClick={goBack} className="flex h-10 w-10 items-center justify-start">{history.length > 0 ? <ArrowLeft size={20} color="var(--foreground)" /> : <X size={20} color="var(--foreground)" />}</button>
        <h1 className="text-[16px] font-semibold">Создание</h1>
        <div className="h-10 w-10" />
      </div>
      {renderProgress()}
      <div className="flex-1 overflow-y-auto px-4 pb-4 transition-all duration-200">{renderStep()}</div>
      {footer && <div className="flex-shrink-0 border-t border-border bg-card px-4 pb-4 pt-3">{footer}</div>}
      {participantsOpen && (
        <HomeSheet title="Участники" onClose={() => setParticipantsOpen(false)}>
          <div className="mb-3 flex h-11 items-center gap-2 rounded-xl bg-gray-100 px-3">
            <Search size={17} strokeWidth={1.9} className="text-gray-500" />
            <input
              value={participantQuery}
              onChange={(event) => setParticipantQuery(event.target.value)}
              placeholder="Поиск по имени"
              className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="space-y-1">
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
        </HomeSheet>
      )}
    </div>
  );
}
