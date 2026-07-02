import { useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { ArrowLeft, CalendarDays, Check, ChevronDown, Clock, Copy, Eye, Image as ImageIcon, Layers3, Lock, MapPin, Plus, Repeat2, Sparkles, Users, Video, X } from "lucide-react";
import type { HomeFeedPlan, PartOfDay, PlanRepeat, Schedule, Screen, TimeMode, Visibility } from "@/app/types";
import { ALL_DAYS, EVENT_PARTICIPANTS, GREEN, GREEN_LIGHT, PART_OF_DAY_RANGES, WEEKDAY_VALUES } from "@/app/data/constants";
import { DEFAULT_PLAN_AUTHOR, DEFAULT_PLAN_PARTICIPANTS, PLAN_TAG_GRADIENTS } from "@/app/data/plans";

type CreateStep = "welcome" | "countChoice" | "name" | "description" | "image" | "schedule" | "addAnother" | "finalOptions" | "success";
type PlanDraft = { title: string; description: string; coverImage: string | null; schedule: Schedule };

export type CreatedPlanResult = {
  countMode: "single" | "multiple";
  plans: PlanDraft[];
  visibility: Visibility;
  participants: string[];
  location: { address: string; lat: number; lng: number } | "online" | null;
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
        {subtitle && <p className="mt-0.5 text-[12px] leading-4 text-muted-foreground">{subtitle}</p>}
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

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export function CreateScreen({
  onNavigate,
  backTo = "plans",
  onCreatePlan,
}: {
  onNavigate: (s: Screen) => void;
  backTo?: Screen;
  onCreatePlan: (plans: HomeFeedPlan[], result: CreatedPlanResult) => void;
}) {
  const initialDateTime = useMemo(() => getLocalDateTime(), []);
  const [step, setStep] = useState<CreateStep>("welcome");
  const [history, setHistory] = useState<CreateStep[]>([]);
  const [countMode, setCountMode] = useState<"single" | "multiple" | null>(null);
  const [plans, setPlans] = useState<PlanDraft[]>([defaultPlan()]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [untilWeek, setUntilWeek] = useState(4);
  const [titleError, setTitleError] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [showParticipantsPicker, setShowParticipantsPicker] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [videoLink, setVideoLink] = useState("");
  const [videoCopied, setVideoCopied] = useState(false);
  const [locationMode, setLocationMode] = useState<"offline" | "online">("offline");
  const [locationAddress, setLocationAddress] = useState("");

  const currentPlan = plans[currentIndex] ?? defaultPlan();
  const currentSchedule = currentPlan.schedule;
  const timeMode: TimeMode = currentSchedule.timeMode ?? currentSchedule.mode ?? "partOfDay";
  const partOfDay = currentSchedule.partOfDay;
  const selectedDays = currentSchedule.weekdays;
  const exactStart = currentSchedule.start ?? initialDateTime;
  const exactEnd = typeof currentSchedule.end === "string" ? currentSchedule.end : exactStart;
  const repeat = currentSchedule.repeat ?? { type: "days", days: 21 };
  const startParts = splitDateTime(exactStart);
  const endParts = splitDateTime(exactEnd);
  const selectedParticipantItems = EVENT_PARTICIPANTS.filter((participant) => selectedParticipants.includes(participant.id));

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

  const updatePlan = (next: Partial<PlanDraft>) => {
    setPlans((items) => items.map((item, index) => index === currentIndex ? { ...item, ...next } : item));
  };

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

  const buildHomeFeedPlan = (draft: PlanDraft, index: number): HomeFeedPlan => {
    const id = Date.now() + index;
    return {
      id,
      tag: "other",
      format: locationMode === "online" || videoEnabled ? "online" : "offline",
      duration: "План",
      title: draft.title.trim(),
      description: draft.description.trim(),
      habit: { title: draft.title.trim(), durationMin: 15 },
      coverUrl: draft.coverImage ?? undefined,
      gradient: PLAN_TAG_GRADIENTS.other,
      schedule: draft.schedule,
      participants: DEFAULT_PLAN_PARTICIPANTS,
      participantsLabel: selectedParticipants.length > 0 ? `${selectedParticipants.length} чел.` : "Только я",
      timeDate: getTimeDate(draft.schedule),
      address: locationMode === "offline" && locationAddress.trim() ? locationAddress.trim() : undefined,
      author: DEFAULT_PLAN_AUTHOR,
      shareUrl: `https://wellwellwell.app/plans/${id}`,
    };
  };

  const handleCreate = () => {
    const invalidTitle = plans.findIndex((plan) => !plan.title.trim());
    if (invalidTitle >= 0) {
      setCurrentIndex(invalidTitle);
      setTitleError("Введите название");
      setStep("name");
      return;
    }

    const invalidSchedule = plans.findIndex((plan) => validateSchedule(plan.schedule));
    if (invalidSchedule >= 0) {
      setCurrentIndex(invalidSchedule);
      setScheduleError(validateSchedule(plans[invalidSchedule].schedule));
      setStep("schedule");
      return;
    }

    const result: CreatedPlanResult = {
      countMode: countMode ?? "single",
      plans: plans.map((plan) => ({ ...plan, title: plan.title.trim(), description: plan.description.trim() })),
      visibility,
      participants: selectedParticipants,
      location: locationMode === "online" ? "online" : locationAddress.trim() ? { address: locationAddress.trim(), lat: 55.7558, lng: 37.6176 } : null,
      videoMeeting: { enabled: videoEnabled, link: videoEnabled ? videoLink : "" },
    };
    const createdPlans = result.plans.map(buildHomeFeedPlan);
    onCreatePlan(createdPlans, result);
    setStep("success");
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.75 } });
    window.setTimeout(() => onNavigate(backTo), 750);
  };

  const continueFromName = () => {
    if (!currentPlan.title.trim()) {
      setTitleError("Введите название");
      return;
    }
    goTo("description");
  };

  const continueFromSchedule = () => {
    const error = validateSchedule(currentPlan.schedule);
    setScheduleError(error);
    if (error) return;
    goTo(countMode === "multiple" ? "addAnother" : "finalOptions");
  };

  const addAnotherPlan = () => {
    setPlans((items) => [...items, defaultPlan()]);
    setCurrentIndex((index) => index + 1);
    goTo("name");
  };

  const repeatLabel = repeat.type === "days" ? `${repeat.days} день` : repeat.type === "weekly" ? "Каждую неделю" : repeat.type === "untilWeek" ? `До недели ${repeat.week}` : "Бессрочно";
  const progressSteps = countMode === "multiple" ? 7 : 6;
  const progressIndex = ["welcome", "countChoice", "name", "description", "image", "schedule", "addAnother", "finalOptions", "success"].indexOf(step);

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
      <OptionRow icon={<Users size={17} color={GREEN} />} label="Участники" onClick={() => setShowParticipantsPicker((show) => !show)} control={selectedParticipantItems.length > 0 ? <div className="flex -space-x-2">{selectedParticipantItems.slice(0, 4).map((participant) => <img key={participant.id} src={participant.avatar} alt={participant.name} className="h-7 w-7 rounded-full border-2 border-card object-cover" />)}</div> : <Plus size={18} color={GREEN} />} />
      {showParticipantsPicker && <div className="space-y-1 rounded-xl bg-card p-2">{EVENT_PARTICIPANTS.map((participant) => { const active = selectedParticipants.includes(participant.id); return <button key={participant.id} onClick={() => setSelectedParticipants((items) => active ? items.filter((id) => id !== participant.id) : [...items, participant.id])} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left" style={active ? { backgroundColor: GREEN_LIGHT } : undefined}><img src={participant.avatar} alt={participant.name} className="h-8 w-8 rounded-full object-cover" /><span className="flex-1 text-[14px] font-medium">{participant.name}</span>{active && <Check size={16} color={GREEN} />}</button>; })}</div>}
      <OptionRow icon={<MapPin size={17} color={GREEN} />} label="Локация" subtitle={locationMode === "online" ? "Онлайн" : locationAddress || "Адрес не выбран"} onClick={() => setLocationMode((mode) => mode === "online" ? "offline" : "online")} control={<span className="text-[13px] font-semibold" style={{ color: GREEN }}>{locationMode === "online" ? "Офлайн" : "Онлайн"}</span>} />
      {locationMode === "offline" && <input value={locationAddress} onChange={(event) => setLocationAddress(event.target.value)} placeholder="Адрес места проведения" className="h-12 w-full rounded-xl bg-card px-4 text-[14px] outline-none placeholder:text-muted-foreground" />}
      <OptionRow icon={<Video size={17} color={GREEN} />} label="Видеовстреча" subtitle={videoEnabled ? "Ссылка прикреплена" : undefined} onClick={() => setVideoEnabled((enabled) => { const next = !enabled; if (next && !videoLink) setVideoLink("https://meet.wellwellwell.local/plan"); return next; })} control={<div className="h-6 w-11 rounded-full p-0.5" style={{ backgroundColor: videoEnabled ? "var(--component-switch-on)" : "var(--component-switch-off)" }}><div className="h-5 w-5 rounded-full bg-card transition-transform" style={{ transform: videoEnabled ? "translateX(20px)" : "translateX(0)" }} /></div>} />
      {videoEnabled && <div className="rounded-xl bg-card px-4 py-3"><div className="flex items-center gap-2"><span className="min-w-0 flex-1 truncate text-[14px]">{videoLink}</span><button onClick={async () => { await navigator.clipboard?.writeText(videoLink); setVideoCopied(true); window.setTimeout(() => setVideoCopied(false), 1200); }} className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold" style={{ color: GREEN }}><Copy size={13} />{videoCopied ? "Скопировано" : "Копировать"}</button></div></div>}
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case "welcome":
        return <div className="flex min-h-full flex-col justify-center"><div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl" style={{ backgroundColor: GREEN_LIGHT }}><Sparkles size={30} color={GREEN} /></div><h2 className="text-[32px] font-bold leading-[36px] text-foreground">Соберём твой план</h2><p className="mt-3 text-[16px] leading-6 text-muted-foreground">Пара шагов, немного расписания, и план уже в твоём списке.</p></div>;
      case "countChoice":
        return <div className="pt-6"><h2 className="text-[28px] font-bold leading-[34px]">Создать один план или несколько?</h2><div className="mt-6 grid grid-cols-2 gap-3">{[{ mode: "single" as const, title: "Один", text: "быстро добавить план", Icon: CalendarDays }, { mode: "multiple" as const, title: "Несколько", text: "серия отдельных планов", Icon: Layers3 }].map(({ mode, title, text, Icon }) => <button key={mode} onClick={() => { setCountMode(mode); setPlans([defaultPlan()]); setCurrentIndex(0); goTo("name"); }} className="min-h-[150px] rounded-2xl bg-card p-4 text-left transition-transform active:scale-[0.97]"><Icon size={28} color={GREEN} /><h3 className="mt-5 text-[21px] font-bold">{title}</h3><p className="mt-2 text-[13px] leading-4 text-muted-foreground">{text}</p></button>)}</div></div>;
      case "name":
        return <div className="pt-6 transition-all duration-200"><h2 className="mb-5 text-[28px] font-bold leading-[34px]">{countMode === "multiple" ? `План ${currentIndex + 1}: название` : "Название плана"}</h2><label><span className="mb-2 block text-[13px] text-muted-foreground">Название</span><input value={currentPlan.title} onChange={(e) => { updatePlan({ title: e.target.value }); setTitleError(""); }} placeholder="Например, вечерняя пробежка" className="h-14 w-full rounded-xl bg-card px-4 text-[16px] outline-none" autoFocus /></label>{titleError && <p className="mt-2 text-[12px] font-medium text-destructive">{titleError}</p>}</div>;
      case "description":
        return <div className="pt-6"><h2 className="mb-5 text-[28px] font-bold">Описание</h2><textarea value={currentPlan.description} onChange={(e) => updatePlan({ description: e.target.value })} placeholder="Что будет в плане и зачем он нужен" rows={5} className="min-h-[150px] w-full resize-none rounded-xl bg-card px-3.5 py-3.5 text-[14px] leading-5 outline-none" /></div>;
      case "image":
        return <div className="pt-6"><h2 className="mb-5 text-[28px] font-bold">Обложка</h2><label className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl bg-card px-6 text-center active:opacity-90">{currentPlan.coverImage ? <img src={currentPlan.coverImage} alt="" className="mb-4 h-28 w-28 rounded-xl object-cover" /> : <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary"><ImageIcon size={28} color={GREEN} /></div>}<p className="text-[16px] font-semibold">Добавь обложку</p><span className="mt-4 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white" style={{ backgroundColor: GREEN }}>Загрузить</span><input type="file" accept="image/*" className="hidden" onChange={async (event) => { const file = event.target.files?.[0]; if (file) updatePlan({ coverImage: await readFileAsDataUrl(file) }); event.target.value = ""; }} /></label></div>;
      case "schedule":
        return <div className="pt-6"><h2 className="mb-5 text-[28px] font-bold">Дата и время</h2>{renderSchedule()}</div>;
      case "addAnother":
        return <div className="flex min-h-full flex-col justify-center"><h2 className="text-[28px] font-bold leading-[34px]">Добавить ещё?</h2><p className="mt-3 text-[15px] text-muted-foreground">Уже готово: {plans.length}</p><div className="mt-6 grid grid-cols-2 gap-3"><button onClick={addAnotherPlan} className="h-12 rounded-xl text-[15px] font-semibold text-white" style={{ backgroundColor: GREEN }}>Добавить ещё</button><button onClick={() => goTo("finalOptions")} className="h-12 rounded-xl bg-card text-[15px] font-semibold">Готово</button></div></div>;
      case "finalOptions":
        return <div className="pt-6"><h2 className="mb-5 text-[28px] font-bold">Финальные штрихи</h2>{renderFinalOptions()}</div>;
      case "success":
        return <div className="flex min-h-full flex-col items-center justify-center text-center"><div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: GREEN_LIGHT }}><Check size={38} color={GREEN} /></div><h2 className="text-[28px] font-bold">План создан</h2></div>;
    }
  };

  const renderFooter = () => {
    if (step === "countChoice" || step === "addAnother" || step === "success") return null;
    if (step === "welcome") return <button onClick={() => goTo("countChoice")} className="h-12 w-full rounded-xl text-[15px] font-semibold text-white" style={{ backgroundColor: GREEN }}>Создать</button>;
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
    </div>
  );
}
