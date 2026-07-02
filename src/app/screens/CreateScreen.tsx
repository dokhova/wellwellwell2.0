import { useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Clock, Copy, Eye, Image as ImageIcon, Lock, Plus, Repeat2, Users, Video, X } from "lucide-react";
import type { HomeFeedPlan, PartOfDay, PlanRepeat, Schedule, Screen, TimeMode, Visibility } from "@/app/types";
import { ALL_DAYS, EVENT_PARTICIPANTS, GREEN, GREEN_LIGHT, PART_OF_DAY_RANGES, WEEKDAY_VALUES } from "@/app/data/constants";
import { DEFAULT_PLAN_AUTHOR, DEFAULT_PLAN_PARTICIPANTS, PLAN_TAG_GRADIENTS } from "@/app/data/plans";

type CreateStep =
  | "welcome"
  | "typeChoice"
  | "planName"
  | "habitName"
  | "habitDescription"
  | "habitImage"
  | "habitSchedule"
  | "addAnotherHabit"
  | "finalOptions";

type HabitDraft = {
  title: string;
  description: string;
  coverImage: string | null;
  schedule: Schedule;
};

export type CreatedPlanResult = {
  type: "habit" | "plan";
  planName?: string;
  habits: HabitDraft[];
  visibility: Visibility;
  participants: string[];
  videoMeeting: {
    enabled: boolean;
    link: string;
  };
};

function PlusButton() {
  return (
    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-input">
      <Plus size={16} strokeWidth={2.2} color="var(--muted-foreground)" />
    </span>
  );
}

function OptionRow({
  icon,
  label,
  subtitle,
  control,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  control: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl bg-card px-4 py-3.5 text-left transition-opacity active:opacity-70"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-foreground">{label}</p>
        {subtitle && <p className="mt-0.5 text-[12px] leading-4 text-muted-foreground">{subtitle}</p>}
      </div>
      {control}
    </button>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-card px-4 py-4">
      {children}
    </div>
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

const defaultHabit = (): HabitDraft => ({
  title: "",
  description: "",
  coverImage: null,
  schedule: defaultSchedule(),
});

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
  onCreatePlan: (plan: HomeFeedPlan, result: CreatedPlanResult) => void;
}) {
  const initialDateTime = useMemo(() => getLocalDateTime(), []);
  const [step, setStep] = useState<CreateStep>("welcome");
  const [stepHistory, setStepHistory] = useState<CreateStep[]>([]);
  const [creationType, setCreationType] = useState<"habit" | "plan" | null>(null);
  const [planName, setPlanName] = useState("");
  const [habits, setHabits] = useState<HabitDraft[]>([defaultHabit()]);
  const [currentHabitIndex, setCurrentHabitIndex] = useState(0);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [untilWeek, setUntilWeek] = useState(4);
  const [scheduleError, setScheduleError] = useState("");
  const [titleError, setTitleError] = useState("");
  const [planNameError, setPlanNameError] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [showParticipantsPicker, setShowParticipantsPicker] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [videoLink, setVideoLink] = useState("");
  const [videoCopied, setVideoCopied] = useState(false);

  const currentHabit = habits[currentHabitIndex] ?? defaultHabit();
  const currentSchedule = currentHabit.schedule;
  const timeMode: TimeMode = currentSchedule.timeMode ?? currentSchedule.mode ?? "partOfDay";
  const partOfDay = currentSchedule.partOfDay;
  const selectedDays = currentSchedule.weekdays;
  const exactStart = currentSchedule.start ?? initialDateTime;
  const exactEnd = typeof currentSchedule.end === "string" ? currentSchedule.end : exactStart;
  const repeat = currentSchedule.repeat ?? { type: "days", days: 21 };
  const startParts = splitDateTime(exactStart);
  const endParts = splitDateTime(exactEnd);
  const selectedParticipantItems = EVENT_PARTICIPANTS.filter((participant) =>
    selectedParticipants.includes(participant.id)
  );

  const repeatLabel =
    repeat.type === "days"
      ? `${repeat.days} день`
      : repeat.type === "weekly"
        ? "Каждую неделю"
        : repeat.type === "untilWeek"
          ? `До недели ${repeat.week}`
          : "Бессрочно";

  const totalSteps = creationType === "plan" ? 8 : 6;
  const currentStepNumber =
    step === "welcome" ? 1 :
      step === "typeChoice" ? 2 :
        step === "planName" ? 3 :
          step === "habitName" ? (creationType === "plan" ? 4 : 3) :
            step === "habitDescription" ? (creationType === "plan" ? 5 : 4) :
              step === "habitImage" ? (creationType === "plan" ? 6 : 5) :
                step === "habitSchedule" ? (creationType === "plan" ? 7 : 6) :
                  step === "addAnotherHabit" ? 8 : totalSteps;

  const updateCurrentHabit = (next: Partial<HabitDraft>) => {
    setHabits((items) =>
      items.map((item, index) => index === currentHabitIndex ? { ...item, ...next } : item)
    );
  };

  const updateCurrentSchedule = (next: Partial<Schedule>) => {
    updateCurrentHabit({ schedule: { ...currentSchedule, ...next } });
  };

  const goToStep = (nextStep: CreateStep) => {
    setStepHistory((history) => [...history, step]);
    setStep(nextStep);
    setTitleError("");
    setPlanNameError("");
    setScheduleError("");
  };

  const goBack = () => {
    if (stepHistory.length === 0) {
      onNavigate(backTo);
      return;
    }

    const previous = stepHistory[stepHistory.length - 1];
    setStepHistory((history) => history.slice(0, -1));
    setStep(previous);
    setTitleError("");
    setPlanNameError("");
    setScheduleError("");
  };

  const chooseType = (type: "habit" | "plan") => {
    setCreationType(type);
    setHabits([defaultHabit()]);
    setCurrentHabitIndex(0);
    setPlanName("");
    goToStep(type === "habit" ? "habitName" : "planName");
  };

  const switchTimeMode = (mode: TimeMode) => {
    setScheduleError("");
    if (mode === "exact") {
      updateCurrentSchedule({
        mode: "exact",
        timeMode: "exact",
        time: null,
        partOfDay: null,
        weekdays: [],
        start: exactStart,
        end: exactEnd || exactStart,
      });
      return;
    }

    updateCurrentSchedule({
      mode: "partOfDay",
      timeMode: "partOfDay",
      time: null,
      start: undefined,
      end: undefined,
    });
  };

  const toggleDay = (day: number) => {
    const nextDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day].sort((a, b) => a - b);

    updateCurrentSchedule({ weekdays: nextDays });
    setScheduleError("");
  };

  const updateStartPart = (part: "date" | "time", value: string) => {
    const nextDate = part === "date" ? value : startParts.date;
    const nextTime = part === "time" ? value : startParts.time;
    const next = `${nextDate}T${nextTime || "00:00"}`;
    const nextEnd = !exactEnd || endParts.date === startParts.date
      ? `${nextDate}T${endParts.time || nextTime || "00:00"}`
      : exactEnd;

    updateCurrentSchedule({
      start: next,
      end: nextEnd,
    });
    setScheduleError("");
  };

  const updateEndPart = (part: "date" | "time", value: string) => {
    const nextDate = part === "date" ? value : endParts.date || startParts.date;
    const nextTime = part === "time" ? value : endParts.time;
    updateCurrentSchedule({ end: `${nextDate}T${nextTime || "00:00"}` });
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateCurrentHabit({ coverImage: await readFileAsDataUrl(file) });
    e.target.value = "";
  };

  const toggleParticipant = (id: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(id) ? prev.filter((participantId) => participantId !== id) : [...prev, id]
    );
  };

  const validateSchedule = (schedule: Schedule) => {
    const mode = schedule.timeMode ?? schedule.mode ?? "partOfDay";
    if (mode === "partOfDay") {
      if (!schedule.partOfDay) return "Выберите время суток";
      if (schedule.weekdays.length === 0) return "Выберите хотя бы один день недели";
    }
    if (mode === "exact" && !schedule.start) {
      return "Выберите дату и время начала";
    }
    return "";
  };

  const validateAllHabits = () => {
    const invalidTitleIndex = habits.findIndex((habit) => !habit.title.trim());
    if (invalidTitleIndex >= 0) {
      setCurrentHabitIndex(invalidTitleIndex);
      setTitleError("Введите название");
      setStep("habitName");
      return false;
    }

    const invalidScheduleIndex = habits.findIndex((habit) => validateSchedule(habit.schedule));
    if (invalidScheduleIndex >= 0) {
      setCurrentHabitIndex(invalidScheduleIndex);
      setScheduleError(validateSchedule(habits[invalidScheduleIndex].schedule));
      setStep("habitSchedule");
      return false;
    }

    return true;
  };

  const getTimeDate = (schedule: Schedule) => {
    const mode = schedule.timeMode ?? schedule.mode ?? "partOfDay";
    if (mode === "exact" && schedule.start) {
      const date = new Date(schedule.start);
      return Number.isNaN(date.getTime())
        ? "Точное время"
        : date.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    }
    if (schedule.partOfDay) return PART_OF_DAY_RANGES[schedule.partOfDay].label;
    return "Расписание";
  };

  const buildCreatedPlan = (result: CreatedPlanResult): HomeFeedPlan => {
    const firstHabit = result.habits[0];
    const id = Date.now();
    const title = result.type === "plan" ? result.planName ?? firstHabit.title : firstHabit.title;

    return {
      id,
      tag: "other",
      format: result.videoMeeting.enabled ? "online" : "offline",
      duration: result.type === "plan" ? `${result.habits.length} привычек` : "Привычка",
      title,
      description: firstHabit.description || result.habits.map((habit) => habit.title).join("\n"),
      habit: {
        title: firstHabit.title,
        durationMin: 15,
      },
      coverUrl: firstHabit.coverImage ?? undefined,
      gradient: PLAN_TAG_GRADIENTS.other,
      schedule: firstHabit.schedule,
      participants: DEFAULT_PLAN_PARTICIPANTS,
      participantsLabel: result.participants.length > 0 ? `${result.participants.length} чел.` : "Только я",
      timeDate: getTimeDate(firstHabit.schedule),
      author: DEFAULT_PLAN_AUTHOR,
      shareUrl: `https://wellwellwell.app/plans/${id}`,
    };
  };

  const handleCreate = () => {
    if (creationType === "plan" && !planName.trim()) {
      setPlanNameError("Введите название плана");
      setStep("planName");
      return;
    }

    if (!validateAllHabits()) return;

    const videoMeeting = {
      enabled: videoEnabled,
      link: videoEnabled ? videoLink : "",
    };
    const result: CreatedPlanResult = {
      type: creationType ?? "habit",
      planName: creationType === "plan" ? planName.trim() : undefined,
      habits: habits.map((habit) => ({
        ...habit,
        title: habit.title.trim(),
        description: habit.description.trim(),
      })),
      visibility,
      participants: selectedParticipants,
      videoMeeting,
    };

    onCreatePlan(buildCreatedPlan(result), result);
    onNavigate(backTo);
  };

  const continueFromHabitName = () => {
    if (!currentHabit.title.trim()) {
      setTitleError("Введите название");
      return;
    }
    goToStep("habitDescription");
  };

  const continueFromSchedule = () => {
    const nextScheduleError = validateSchedule(currentHabit.schedule);
    setScheduleError(nextScheduleError);
    if (nextScheduleError) return;
    goToStep(creationType === "plan" ? "addAnotherHabit" : "finalOptions");
  };

  const addAnotherHabit = () => {
    setHabits((items) => [...items, defaultHabit()]);
    setCurrentHabitIndex((index) => index + 1);
    goToStep("habitName");
  };

  const renderProgress = () => (
    <div className="px-4 pb-3">
      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <span
            key={index}
            className="h-1.5 flex-1 rounded-full"
            style={{ backgroundColor: index < currentStepNumber ? GREEN : "var(--border)" }}
          />
        ))}
      </div>
    </div>
  );

  const renderHeroInput = () => (
    <>
      <div className="relative mb-4 aspect-[1.9/1] overflow-hidden rounded-xl" style={{ background: "linear-gradient(135deg, var(--brand-bright) 0%, var(--accent) 48%, var(--brand-dark) 100%)" }}>
        <label className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <input
            value={currentHabit.title}
            onChange={(e) => {
              updateCurrentHabit({ title: e.target.value });
              setTitleError("");
            }}
            placeholder={creationType === "plan" ? `Привычка ${currentHabitIndex + 1}` : "Название привычки"}
            className="w-full bg-transparent text-center text-[26px] font-bold leading-[34px] text-white placeholder:text-white/60 outline-none"
            autoFocus
          />
          <div className="mt-3 h-px w-24 bg-white/50" />
          <p className="mt-3 text-[12px] leading-4 text-white/80">Тап, чтобы заполнить</p>
        </label>
      </div>
      {titleError && <p className="-mt-2 mb-3 text-[12px] font-medium text-destructive">{titleError}</p>}
    </>
  );

  const renderScheduleStep = () => (
    <SectionCard>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] leading-4 text-muted-foreground">Время</p>
          <button
            onClick={() => switchTimeMode(timeMode === "partOfDay" ? "exact" : "partOfDay")}
            className="flex items-center gap-1.5 text-[14px] font-medium"
            style={{ color: GREEN }}
          >
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
                  <button
                    key={key}
                    onClick={() => {
                      updateCurrentSchedule({ partOfDay: key as PartOfDay });
                      setScheduleError("");
                    }}
                    className="rounded-full border px-3 py-2.5 text-[14px] font-medium"
                    style={active ? { backgroundColor: GREEN, borderColor: GREEN, color: "#fff" } : { borderColor: "var(--border)", color: "var(--foreground)" }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-[18px]">
              <p className="mb-3 text-[13px] leading-4 text-muted-foreground">Дни недели</p>
              <div className="grid grid-cols-7 gap-[5px]">
                {ALL_DAYS.map((day, i) => {
                  const value = WEEKDAY_VALUES[i];
                  const active = selectedDays.includes(value);
                  return (
                    <button
                      key={day}
                      onClick={() => toggleDay(value)}
                      className="aspect-square rounded-full border text-[12px] font-semibold"
                      style={active ? { backgroundColor: GREEN, borderColor: GREEN, color: "#fff" } : { borderColor: "var(--border)", color: "var(--foreground)" }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {[
              { label: "Начало", date: startParts.date, time: startParts.time, onDate: (value: string) => updateStartPart("date", value), onTime: (value: string) => updateStartPart("time", value) },
              { label: "Окончание", date: endParts.date || startParts.date, time: endParts.time, onDate: (value: string) => updateEndPart("date", value), onTime: (value: string) => updateEndPart("time", value) },
            ].map((row) => (
              <div key={row.label} className="rounded-lg border border-border px-3.5 py-3">
                <p className="mb-2 text-[13px] font-medium text-foreground">{row.label}</p>
                <div className="grid grid-cols-2 gap-3">
                  <label>
                    <span className="mb-1 block text-[12px] leading-4 text-muted-foreground">Дата</span>
                    <input type="date" value={row.date} onChange={(e) => row.onDate(e.target.value)} className="w-full bg-transparent text-[14px] leading-5 text-foreground outline-none" />
                  </label>
                  <label>
                    <span className="mb-1 block text-[12px] leading-4 text-muted-foreground">Время</span>
                    <input type="time" value={row.time} onChange={(e) => row.onTime(e.target.value)} className="w-full bg-transparent text-[14px] leading-5 text-foreground outline-none" />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-[18px]">
          <button
            onClick={() => setShowRepeatPicker((show) => !show)}
            className="flex w-full items-center justify-between rounded-lg bg-card px-3.5 py-3 text-left"
          >
            <span className="flex items-center gap-2 text-[14px] leading-5 text-foreground">
              <Repeat2 size={18} strokeWidth={1.9} color="var(--muted-foreground)" />
              Повторение
            </span>
            <span className="flex items-center gap-1.5 text-[14px] text-muted-foreground">
              {repeatLabel}
              <ChevronDown size={16} strokeWidth={2} />
            </span>
          </button>

          {showRepeatPicker && (
            <div className="mt-2 rounded-lg bg-card p-2">
              {[
                { label: "21 день", action: () => updateCurrentSchedule({ repeat: { type: "days", days: 21 } }), active: repeat.type === "days" },
                { label: "Каждую неделю", action: () => updateCurrentSchedule({ repeat: { type: "weekly" } }), active: repeat.type === "weekly" },
                { label: "До недели N", action: () => updateCurrentSchedule({ repeat: { type: "untilWeek", week: untilWeek } }), active: repeat.type === "untilWeek" },
                { label: "Бессрочно", action: () => updateCurrentSchedule({ repeat: { type: "forever" } }), active: repeat.type === "forever" },
              ].map((option) => (
                <button
                  key={option.label}
                  onClick={option.action}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-[14px] font-medium"
                  style={option.active ? { backgroundColor: GREEN_LIGHT, color: GREEN } : { color: "var(--foreground)" }}
                >
                  {option.label}
                  {option.active && <Check size={16} strokeWidth={2.4} />}
                </button>
              ))}
              {repeat.type === "untilWeek" && (
                <label className="mt-2 block rounded-md bg-input px-3 py-2.5">
                  <span className="mb-1 block text-[12px] text-muted-foreground">Номер недели</span>
                  <input
                    type="number"
                    min={1}
                    value={repeat.week}
                    onChange={(e) => {
                      const week = Math.max(1, Number(e.target.value) || 1);
                      setUntilWeek(week);
                      updateCurrentSchedule({ repeat: { type: "untilWeek", week } });
                    }}
                    className="w-full bg-transparent text-[14px] text-foreground outline-none"
                  />
                </label>
              )}
            </div>
          )}
        </div>

        {scheduleError && <p className="mt-3 text-[12px] font-medium text-destructive">{scheduleError}</p>}
      </div>
    </SectionCard>
  );

  const renderFinalOptions = () => (
    <div className="space-y-2">
      <button
        onClick={() => setVisibility((value) => value === "all" ? "onlyMe" : "all")}
        className="flex w-full items-center gap-3 rounded-xl bg-card px-4 py-3.5 text-left"
      >
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
          {visibility === "all" ? <Eye size={17} strokeWidth={1.8} color={GREEN} /> : <Lock size={17} strokeWidth={1.8} color={GREEN} />}
        </div>
        <span className="flex-1 text-[15px] font-medium text-foreground">Видимость</span>
        <span className="text-[14px] text-muted-foreground">{visibility === "all" ? "Все" : "Только я"}</span>
      </button>

      <OptionRow
        icon={<Users size={17} strokeWidth={1.8} color={GREEN} />}
        label="Участники"
        onClick={() => setShowParticipantsPicker((show) => !show)}
        control={
          selectedParticipantItems.length > 0 ? (
            <div className="flex -space-x-2">
              {selectedParticipantItems.slice(0, 4).map((participant) => (
                <img key={participant.id} src={participant.avatar} alt={participant.name} className="h-7 w-7 rounded-full border-2 border-card object-cover" />
              ))}
            </div>
          ) : (
            <PlusButton />
          )
        }
      />

      {showParticipantsPicker && (
        <div className="space-y-1 rounded-xl bg-card p-2">
          {EVENT_PARTICIPANTS.map((participant) => {
            const active = selectedParticipants.includes(participant.id);
            return (
              <button
                key={participant.id}
                onClick={() => toggleParticipant(participant.id)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left"
                style={active ? { backgroundColor: GREEN_LIGHT } : undefined}
              >
                <img src={participant.avatar} alt={participant.name} className="h-8 w-8 rounded-full object-cover" />
                <span className="flex-1 text-[14px] font-medium text-foreground">{participant.name}</span>
                {active && <Check size={16} strokeWidth={2.5} color={GREEN} />}
              </button>
            );
          })}
        </div>
      )}

      <OptionRow
        icon={<Video size={17} strokeWidth={1.8} color={GREEN} />}
        label="Видеовстреча"
        subtitle={videoEnabled ? "Ссылка прикреплена" : undefined}
        onClick={() => {
          setVideoEnabled((enabled) => {
            const nextEnabled = !enabled;
            if (nextEnabled && !videoLink) setVideoLink("https://meet.wellwellwell.local/plan");
            return nextEnabled;
          });
        }}
        control={
          <div className="h-6 w-11 rounded-full p-0.5 transition-colors" style={{ backgroundColor: videoEnabled ? "var(--component-switch-on)" : "var(--component-switch-off)" }}>
            <div className="h-5 w-5 rounded-full bg-card transition-transform" style={{ transform: videoEnabled ? "translateX(20px)" : "translateX(0)" }} />
          </div>
        }
      />

      {videoEnabled && (
        <div className="rounded-xl bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-[14px] text-foreground">{videoLink}</span>
            <button
              onClick={async () => {
                await navigator.clipboard?.writeText(videoLink);
                setVideoCopied(true);
                window.setTimeout(() => setVideoCopied(false), 1200);
              }}
              className="flex h-9 flex-shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold"
              style={{ color: GREEN }}
            >
              <Copy size={13} strokeWidth={2.2} />
              {videoCopied ? "Скопировано" : "Копировать"}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case "welcome":
        return (
          <div className="flex min-h-full flex-col justify-center">
            <h2 className="text-[32px] font-bold leading-[36px] text-foreground">Создайте привычку или план</h2>
            <p className="mt-3 text-[16px] leading-6 text-muted-foreground">Здесь можно создать привычку или план тренировок за пару шагов.</p>
          </div>
        );
      case "typeChoice":
        return (
          <div className="pt-6">
            <h2 className="text-[28px] font-bold leading-[34px] text-foreground">Что создаём?</h2>
            <div className="mt-6 space-y-3">
              {[
                { type: "habit" as const, title: "Привычка", text: "Одна регулярная практика с расписанием." },
                { type: "plan" as const, title: "План", text: "Набор привычек в одном тренировочном плане." },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => chooseType(item.type)}
                  className="w-full rounded-2xl bg-card p-5 text-left active:opacity-90"
                >
                  <h3 className="text-[20px] font-bold leading-6 text-foreground">{item.title}</h3>
                  <p className="mt-2 text-[14px] leading-5 text-muted-foreground">{item.text}</p>
                </button>
              ))}
            </div>
          </div>
        );
      case "planName":
        return (
          <div className="pt-6">
            <h2 className="text-[28px] font-bold leading-[34px] text-foreground">Название плана</h2>
            <input
              value={planName}
              onChange={(event) => {
                setPlanName(event.target.value);
                setPlanNameError("");
              }}
              placeholder="Например, Подготовка к 5 км"
              className="mt-6 h-14 w-full rounded-xl bg-card px-4 text-[16px] text-foreground outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            {planNameError && <p className="mt-2 text-[12px] font-medium text-destructive">{planNameError}</p>}
          </div>
        );
      case "habitName":
        return (
          <div className="pt-6">
            <h2 className="mb-5 text-[28px] font-bold leading-[34px] text-foreground">
              {creationType === "plan" ? `Привычка ${currentHabitIndex + 1}: название` : "Название привычки"}
            </h2>
            {renderHeroInput()}
          </div>
        );
      case "habitDescription":
        return (
          <div className="pt-6">
            <h2 className="mb-5 text-[28px] font-bold leading-[34px] text-foreground">Описание</h2>
            <textarea
              value={currentHabit.description}
              onChange={(e) => updateCurrentHabit({ description: e.target.value })}
              onInput={(e) => {
                e.currentTarget.style.height = "auto";
                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
              }}
              placeholder="Опишите, зачем нужна привычка, что предстоит делать и какой результат получит участник"
              rows={5}
              className="min-h-[150px] w-full resize-none overflow-hidden rounded-xl bg-card px-3.5 py-3.5 text-[14px] leading-5 text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        );
      case "habitImage":
        return (
          <div className="pt-6">
            <h2 className="mb-5 text-[28px] font-bold leading-[34px] text-foreground">Обложка</h2>
            <label className="relative block aspect-[1.9/1] overflow-hidden rounded-xl" style={{ background: "linear-gradient(135deg, var(--brand-bright) 0%, var(--accent) 48%, var(--brand-dark) 100%)" }}>
              {currentHabit.coverImage && <img src={currentHabit.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />}
              {currentHabit.coverImage && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-alpha-overlay-55" />}
              <span className="absolute left-4 top-4 z-10 flex cursor-pointer items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-[12px] font-medium text-white">
                <ImageIcon size={14} strokeWidth={2} />
                {currentHabit.coverImage ? "Изменить" : "Обложка"}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
            </label>
          </div>
        );
      case "habitSchedule":
        return (
          <div className="pt-6">
            <h2 className="mb-5 text-[28px] font-bold leading-[34px] text-foreground">Расписание</h2>
            {renderScheduleStep()}
          </div>
        );
      case "addAnotherHabit":
        return (
          <div className="flex min-h-full flex-col justify-center">
            <h2 className="text-[28px] font-bold leading-[34px] text-foreground">Добавить ещё одну привычку?</h2>
            <p className="mt-3 text-[15px] leading-5 text-muted-foreground">В плане уже {habits.length} {habits.length === 1 ? "привычка" : "привычки"}.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={addAnotherHabit} className="h-12 rounded-xl text-[15px] font-semibold text-white" style={{ backgroundColor: GREEN }}>
                Да
              </button>
              <button onClick={() => goToStep("finalOptions")} className="h-12 rounded-xl bg-card text-[15px] font-semibold text-foreground">
                Готово
              </button>
            </div>
          </div>
        );
      case "finalOptions":
        return (
          <div className="pt-6">
            <h2 className="mb-5 text-[28px] font-bold leading-[34px] text-foreground">Последние настройки</h2>
            {renderFinalOptions()}
          </div>
        );
    }
  };

  const renderFooter = () => {
    if (step === "typeChoice" || step === "addAnotherHabit") return null;

    if (step === "welcome") {
      return (
        <button onClick={() => goToStep("typeChoice")} className="h-12 w-full rounded-xl text-[15px] font-semibold text-white" style={{ backgroundColor: GREEN }}>
          Создать
        </button>
      );
    }

    if (step === "habitDescription" || step === "habitImage") {
      return (
        <div className="flex gap-3">
          <button
            onClick={() => goToStep(step === "habitDescription" ? "habitImage" : "habitSchedule")}
            className="h-12 flex-1 rounded-xl bg-card text-[15px] font-semibold text-foreground"
          >
            Пропустить
          </button>
          <button
            onClick={() => goToStep(step === "habitDescription" ? "habitImage" : "habitSchedule")}
            className="h-12 flex-1 rounded-xl text-[15px] font-semibold text-white"
            style={{ backgroundColor: GREEN }}
          >
            Далее
          </button>
        </div>
      );
    }

    const footerAction =
      step === "planName"
        ? () => {
            if (!planName.trim()) {
              setPlanNameError("Введите название плана");
              return;
            }
            goToStep("habitName");
          }
        : step === "habitName"
          ? continueFromHabitName
          : step === "habitSchedule"
            ? continueFromSchedule
            : handleCreate;

    return (
      <button onClick={footerAction} className="h-12 w-full rounded-xl text-[15px] font-semibold text-white" style={{ backgroundColor: GREEN }}>
        {step === "finalOptions" ? "Создать" : "Далее"}
      </button>
    );
  };

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-14 flex-shrink-0 items-center justify-between px-4">
        <button onClick={goBack} className="flex h-10 w-10 items-center justify-start">
          {stepHistory.length > 0 ? <ArrowLeft size={20} strokeWidth={2.2} color="var(--foreground)" /> : <X size={20} strokeWidth={2.2} color="var(--foreground)" />}
        </button>
        <h1 className="text-[16px] font-semibold leading-6 text-foreground">Создание</h1>
        <div className="h-10 w-10" />
      </div>

      {renderProgress()}

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {renderStep()}
      </div>

      {renderFooter() && (
        <div className="flex-shrink-0 border-t border-border bg-card px-4 pb-4 pt-3">
          {renderFooter()}
        </div>
      )}
    </div>
  );
}
