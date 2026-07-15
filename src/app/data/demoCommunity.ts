import avatar10 from "@/imports/avatar_10-opt.webp";
import avatar11 from "@/imports/avatar_11-opt.webp";
import avatar12 from "@/imports/avatar_12-opt.webp";
import avatar13 from "@/imports/avatar_13-opt.webp";
import avatar14 from "@/imports/avatar_14-opt.webp";
import avatar15 from "@/imports/avatar_15-opt.webp";
import avatar16 from "@/imports/avatar_16-opt.webp";
import avatar17 from "@/imports/avatar_17-opt.webp";
import avatar18 from "@/imports/avatar_18-opt.webp";
import avatar19 from "@/imports/avatar_19-opt.webp";
import avatar20 from "@/imports/avatar_20-opt.webp";
import avatar21 from "@/imports/avatar_21-opt.webp";
import cover10 from "@/imports/cover_10-opt.webp";
import cover11 from "@/imports/cover_11-opt.webp";
import cover12 from "@/imports/cover_12-opt.webp";
import cover13 from "@/imports/cover_13-opt.webp";
import cover14 from "@/imports/cover_14-opt.webp";
import cover15 from "@/imports/cover_15-opt.webp";
import cover16 from "@/imports/cover_16-opt.webp";
import cover17 from "@/imports/cover_17-opt.webp";
import cover18 from "@/imports/cover_18-opt.webp";
import cover19 from "@/imports/cover_19-opt.webp";
import cover20 from "@/imports/cover_20-opt.webp";
import cover21 from "@/imports/cover_21-opt.webp";
import type { HomeFeedPlan } from "@/app/types";
import type { ChatPeer } from "@/app/types";

export const demoCommunity = {
  people: [
    { id: "demo-01", name: "Андрей Соколов", avatar: "avatar_10.png", isDemo: true, tags: ["Бег"], bio: "Пишу код и бегаю по утрам — до первого созвона успеваю 5 км. Цель на осень — первая официальная десятка.", plan: { id: "demo-plan-01", series: "Long Run", title: "Субботний Long Run", description: "Каждую субботу выходим на длинную спокойную пробежку. После финиша делимся фотографиями, маршрутом и скриншотами из Strava.", cover: "cover_10.png", schedule: "2026-07-18T09:00:00+03:00", location: "Онлайн", participantsCount: 5, participantIds: ["demo-02", "demo-03", "demo-06", "demo-11", "demo-12"] } },
    { id: "demo-02", name: "Ирина Морозова", avatar: "avatar_11.png", isDemo: true, tags: ["Бег"], bio: "Начала бегать этой весной и неожиданно втянулась. Лучшая часть дня — пробежка, пока город ещё спит.", plan: { id: "demo-plan-02", series: "Доброе беговое утро", title: "Доброе беговое утро", description: "Если успел выйти на пробежку до начала рабочего дня — присоединяйся. Показываем рассветы и делимся настроением.", cover: "cover_11.png", schedule: "2026-07-13T07:30:00+03:00", location: "Онлайн", participantsCount: 4, participantIds: ["demo-03", "demo-04", "demo-05", "demo-10"] } },
    { id: "demo-03", name: "Егор Лебедев", avatar: "avatar_12.png", isDemo: true, tags: ["Бег"], bio: "Фотограф. Бег для меня — способ искать кадры: трейлы, парки, рассветы. Делюсь красивыми маршрутами.", plan: { id: "demo-plan-03", series: "Фото недели", title: "Фото недели", description: "Делимся самым красивым кадром с пробежки этой недели. Не важно, парк это, набережная или лес.", cover: "cover_12.png", schedule: "2026-07-16T20:00:00+03:00", location: "Онлайн", participantsCount: 5, participantIds: ["demo-01", "demo-08", "demo-09", "demo-10", "demo-11"] } },
    { id: "demo-04", name: "Анна Волкова", avatar: "avatar_13.png", isDemo: true, tags: ["Бег"], bio: "Днём рисую интерфейсы, вечером выключаю голову на пробежке. Медленно, спокойно, в удовольствие.", plan: { id: "demo-plan-04", series: "Вечерняя пробежка", title: "Вечерний лёгкий бег", description: "Спокойная восстановительная пробежка после рабочего дня. После делимся впечатлениями и маршрутами.", cover: "cover_13.png", schedule: "2026-07-15T19:30:00+03:00", location: "Онлайн", participantsCount: 3, participantIds: ["demo-05", "demo-10", "demo-12"] } },
    { id: "demo-05", name: "Максим Романов", avatar: "avatar_14.png", isDemo: true, tags: ["Бег"], bio: "Начал бегать в 35 и жалею только об одном — что не начал раньше. Инженер, люблю цифры и видимый прогресс.", plan: { id: "demo-plan-05", series: "Цель недели", title: "Цель на неделю", description: "Каждое воскресенье ставим небольшую цель на следующую неделю и поддерживаем друг друга.", cover: "cover_14.png", schedule: "2026-07-19T20:00:00+03:00", location: "Онлайн", participantsCount: 5, participantIds: ["demo-01", "demo-04", "demo-07", "demo-10", "demo-11"] } },
    { id: "demo-06", name: "Дарья Николаева", avatar: "avatar_15.png", isDemo: true, tags: ["Бег"], bio: "Готовлюсь к своим первым 10 км. Волнуюсь, но именно поэтому здесь — вместе не так страшно.", plan: { id: "demo-plan-06", series: "Первый старт", title: "Первый старт", description: "Если готовишься к своему первому забегу — присоединяйся. Делимся подготовкой и переживаниями.", cover: "cover_15.png", schedule: "2026-07-17T18:30:00+03:00", location: "Онлайн", participantsCount: 4, participantIds: ["demo-04", "demo-08", "demo-10", "demo-12"] } },
    { id: "demo-07", name: "Павел Смирнов", avatar: "avatar_16.png", isDemo: true, tags: ["Бег"], bio: "Между встречами и перелётами всегда нахожу полчаса на бег. Кроссовки — первое, что кладу в чемодан.", plan: { id: "demo-plan-07", series: "Обеденный бег", title: "Бег в обеденный перерыв", description: "Иногда достаточно 30 минут, чтобы полностью переключиться. Кто сегодня выбежал днём?", cover: "cover_16.png", schedule: "2026-07-14T13:00:00+03:00", location: "Онлайн", participantsCount: 3, participantIds: ["demo-05", "demo-09", "demo-11"] } },
    { id: "demo-08", name: "Ольга Фролова", avatar: "avatar_17.png", isDemo: true, tags: ["Бег"], bio: "Возвращаюсь к бегу после рождения сына. Пока три километра, но каждая пробежка — маленькая победа.", plan: { id: "demo-plan-08", series: "Маленькие победы", title: "Маленькая победа недели", description: "Делимся любым прогрессом: первая пробежка, новый маршрут или просто удалось выйти из дома.", cover: "cover_17.png", schedule: "2026-07-19T19:00:00+03:00", location: "Онлайн", participantsCount: 5, participantIds: ["demo-01", "demo-03", "demo-06", "demo-07", "demo-11"] } },
    { id: "demo-09", name: "Никита Крылов", avatar: "avatar_18.png", isDemo: true, tags: ["Бег"], bio: "Аналитик. Бег — моя ежедневная дисциплина: план тренировок, пульсовые зоны и никаких оправданий.", plan: { id: "demo-plan-09", series: "Интервалы", title: "Интервальный вторник", description: "Выполняем интервальную тренировку в своём темпе, а после делимся результатами и ощущениями.", cover: "cover_18.png", schedule: "2026-07-14T19:00:00+03:00", location: "Онлайн", participantsCount: 4, participantIds: ["demo-02", "demo-03", "demo-04", "demo-06"] } },
    { id: "demo-10", name: "София Орлова", avatar: "avatar_19.png", isDemo: true, tags: ["Бег"], bio: "Копирайтер. Лучшие заголовки приходят на бегу, особенно вдоль набережной на закате.", plan: { id: "demo-plan-10", series: "Музыка для бега", title: "Что сегодня в наушниках?", description: "Делимся любимыми плейлистами, подкастами и треками для пробежек.", cover: "cover_19.png", schedule: "2026-07-17T18:00:00+03:00", location: "Онлайн", participantsCount: 5, participantIds: ["demo-02", "demo-06", "demo-07", "demo-11", "demo-12"] } },
    { id: "demo-11", name: "Кирилл Власов", avatar: "avatar_20.png", isDemo: true, tags: ["Бег"], bio: "Изучаю Москву ногами: каждую неделю новый район и новый маршрут. Днём проектирую интерфейсы.", plan: { id: "demo-plan-11", series: "Новый маршрут", title: "Маршрут недели", description: "Показываем интересные маршруты, которые открыли для себя на этой неделе.", cover: "cover_20.png", schedule: "2026-07-16T19:00:00+03:00", location: "Онлайн", participantsCount: 4, participantIds: ["demo-01", "demo-05", "demo-06", "demo-10"] } },
    { id: "demo-12", name: "Алина Сергеева", avatar: "avatar_21.png", isDemo: true, tags: ["Бег"], bio: "Рисую иллюстрации и бегаю без секундомера. Мне важнее настроение после, чем темп на километр.", plan: { id: "demo-plan-12", series: "Восстановление", title: "Восстановительная среда", description: "После тренировки уделяем время растяжке, прогулке или роллу и рассказываем, что помогает восстановиться.", cover: "cover_21.png", schedule: "2026-07-15T20:30:00+03:00", location: "Онлайн", participantsCount: 3, participantIds: ["demo-02", "demo-08", "demo-09"] } },
  ],
} as const;

export const demoCommunityAssets = {
  avatars: {
    "avatar_10.png": avatar10 as unknown as string,
    "avatar_11.png": avatar11 as unknown as string,
    "avatar_12.png": avatar12 as unknown as string,
    "avatar_13.png": avatar13 as unknown as string,
    "avatar_14.png": avatar14 as unknown as string,
    "avatar_15.png": avatar15 as unknown as string,
    "avatar_16.png": avatar16 as unknown as string,
    "avatar_17.png": avatar17 as unknown as string,
    "avatar_18.png": avatar18 as unknown as string,
    "avatar_19.png": avatar19 as unknown as string,
    "avatar_20.png": avatar20 as unknown as string,
    "avatar_21.png": avatar21 as unknown as string,
  },
  covers: {
    "cover_10.png": cover10 as unknown as string,
    "cover_11.png": cover11 as unknown as string,
    "cover_12.png": cover12 as unknown as string,
    "cover_13.png": cover13 as unknown as string,
    "cover_14.png": cover14 as unknown as string,
    "cover_15.png": cover15 as unknown as string,
    "cover_16.png": cover16 as unknown as string,
    "cover_17.png": cover17 as unknown as string,
    "cover_18.png": cover18 as unknown as string,
    "cover_19.png": cover19 as unknown as string,
    "cover_20.png": cover20 as unknown as string,
    "cover_21.png": cover21 as unknown as string,
  },
};

const parseDemoSchedule = (value: string) => {
  const candidate = new Date(value);
  const weekday = candidate.getDay() === 0 ? 7 : candidate.getDay();
  const weekdayName = candidate.toLocaleDateString("ru-RU", { weekday: "long" });
  const time = candidate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const targetHours = candidate.getHours();

  return {
    weekday,
    weekdayName,
    time,
    partOfDay: targetHours < 12 ? "morning" : targetHours < 17 ? "day" : "evening",
    start: candidate.toISOString(),
    timeDate: `${weekdayName} · ${targetHours < 12 ? "Утро" : targetHours < 17 ? "День" : "Вечер"}`,
  };
};

const demoPlanTrainingMeta: Record<string, Pick<HomeFeedPlan, "level" | "distanceLabel" | "duration">> = {
  "demo-plan-01": { level: "tooWell", distanceLabel: "10 км" },
  "demo-plan-02": { level: "well", distanceLabel: "5 км" },
  "demo-plan-03": { level: "well", duration: "45 мин" },
  "demo-plan-04": { level: "well", distanceLabel: "5 км" },
  "demo-plan-05": { level: "well", duration: "30 мин" },
  "demo-plan-06": { level: "veryWell", distanceLabel: "10 км" },
  "demo-plan-07": { level: "well", duration: "30 мин" },
  "demo-plan-08": { level: "well", duration: "30 мин" },
  "demo-plan-09": { level: "tooWell", duration: "45 мин" },
  "demo-plan-10": { level: "well", duration: "30 мин" },
  "demo-plan-11": { level: "veryWell", distanceLabel: "5 км" },
  "demo-plan-12": { level: "well", duration: "30 мин" },
};

export const demoCommunityPlans: HomeFeedPlan[] = demoCommunity.people.map((person) => {
  const schedule = parseDemoSchedule(person.plan.schedule);
  const avatarUrl = demoCommunityAssets.avatars[person.avatar];
  const participantAvatars = person.plan.participantIds
    .map((id) => demoCommunity.people.find((item) => item.id === id))
    .filter((item): item is typeof demoCommunity.people[number] => Boolean(item))
    .map((item) => demoCommunityAssets.avatars[item.avatar]);

  return {
    id: person.plan.id,
    tag: "running",
    format: person.plan.location === "Онлайн" ? "online" : "offline",
    ...demoPlanTrainingMeta[person.plan.id],
    title: person.plan.title,
    description: person.plan.description,
    habit: { title: person.plan.series, durationMin: 45 },
    coverUrl: demoCommunityAssets.covers[person.plan.cover],
    gradient: "linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)",
    schedule: {
      mode: "partOfDay",
      timeMode: "partOfDay",
      time: null,
      partOfDay: schedule.partOfDay,
      weekdays: [schedule.weekday],
      repeat: { type: "weekly" },
      start: schedule.start,
    },
    participants: participantAvatars,
    participantsLabel: `${person.plan.participantIds.length} чел.`,
    timeDate: schedule.timeDate,
    address: person.plan.location,
    author: {
      id: person.id,
      name: person.name,
      avatarUrl,
    },
  };
});

export const demoCommunityPlanIds = new Set(demoCommunityPlans.map((plan) => String(plan.id)));

export const getDemoCommunityParticipantPeers = (planId: string): ChatPeer[] => {
  const owner = demoCommunity.people.find((person) => person.plan.id === planId);
  if (!owner) return [];
  return owner.plan.participantIds
    .map((id) => demoCommunity.people.find((person) => person.id === id))
    .filter((person): person is typeof demoCommunity.people[number] => Boolean(person))
    .map((person) => ({
      id: person.id,
      name: person.name,
      avatarUrl: demoCommunityAssets.avatars[person.avatar],
      isDemo: true,
    }));
};
