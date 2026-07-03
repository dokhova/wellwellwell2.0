import avatar10 from "@/imports/avatar_10.png";
import avatar11 from "@/imports/avatar_11.png";
import avatar12 from "@/imports/avatar_12.png";
import avatar13 from "@/imports/avatar_13.png";
import avatar14 from "@/imports/avatar_14.png";
import avatar15 from "@/imports/avatar_15.png";
import avatar16 from "@/imports/avatar_16.png";
import avatar17 from "@/imports/avatar_17.png";
import avatar18 from "@/imports/avatar_18.png";
import avatar19 from "@/imports/avatar_19.png";
import avatar20 from "@/imports/avatar_20.png";
import avatar21 from "@/imports/avatar_21.png";
import cover10 from "@/imports/cover_10.png";
import cover11 from "@/imports/cover_11.png";
import cover12 from "@/imports/cover_12.png";
import cover13 from "@/imports/cover_13.png";
import cover14 from "@/imports/cover_14.png";
import cover15 from "@/imports/cover_15.png";
import cover16 from "@/imports/cover_16.png";
import cover17 from "@/imports/cover_17.png";
import cover18 from "@/imports/cover_18.png";
import cover19 from "@/imports/cover_19.png";
import cover20 from "@/imports/cover_20.png";
import cover21 from "@/imports/cover_21.png";
import type { HomeFeedPlan } from "@/app/types";
import type { ChatPeer } from "@/app/types";

export const demoCommunity = {
  people: [
    { id: "demo-01", name: "Андрей Соколов", avatar: "avatar_10.png", isDemo: true, tags: ["Бег"], bio: "Разработчик из Москвы. Бегает по утрам перед работой и готовится к первым 10 км.", plan: { id: "demo-plan-01", series: "Long Run", title: "Субботний Long Run", description: "Каждую субботу выходим на длинную спокойную пробежку. После финиша делимся фотографиями, маршрутом и скриншотами из Strava.", cover: "cover_10.png", schedule: "Суббота, 09:00", location: "Онлайн", participantsCount: 5, participantIds: ["demo-02", "demo-03", "demo-06", "demo-11", "demo-12"] } },
    { id: "demo-02", name: "Ирина Морозова", avatar: "avatar_11.png", isDemo: true, tags: ["Бег"], bio: "Маркетолог из Санкт-Петербурга. Начала бегать этой весной и любит утренние пробежки.", plan: { id: "demo-plan-02", series: "Доброе беговое утро", title: "Доброе беговое утро", description: "Если успел выйти на пробежку до начала рабочего дня — присоединяйся. Показываем рассветы и делимся настроением.", cover: "cover_11.png", schedule: "Понедельник, 07:30", location: "Онлайн", participantsCount: 4, participantIds: ["demo-03", "demo-04", "demo-05", "demo-10"] } },
    { id: "demo-03", name: "Егор Лебедев", avatar: "avatar_12.png", isDemo: true, tags: ["Бег"], bio: "Фотограф из Краснодара. Любит красивые маршруты и трейлы.", plan: { id: "demo-plan-03", series: "Фото недели", title: "Фото недели", description: "Делимся самым красивым кадром с пробежки этой недели. Не важно, парк это, набережная или лес.", cover: "cover_12.png", schedule: "Четверг, 20:00", location: "Онлайн", participantsCount: 5, participantIds: ["demo-01", "demo-08", "demo-09", "demo-10", "demo-11"] } },
    { id: "demo-04", name: "Анна Волкова", avatar: "avatar_13.png", isDemo: true, tags: ["Бег"], bio: "Дизайнер из Нижнего Новгорода. Бегает вечером после работы.", plan: { id: "demo-plan-04", series: "Вечерняя пробежка", title: "Вечерний лёгкий бег", description: "Спокойная восстановительная пробежка после рабочего дня. После делимся впечатлениями и маршрутами.", cover: "cover_13.png", schedule: "Среда, 19:30", location: "Онлайн", participantsCount: 3, participantIds: ["demo-05", "demo-10", "demo-12"] } },
    { id: "demo-05", name: "Максим Романов", avatar: "avatar_14.png", isDemo: true, tags: ["Бег"], bio: "Инженер из Самары. Начал бегать после 35 лет.", plan: { id: "demo-plan-05", series: "Цель недели", title: "Цель на неделю", description: "Каждое воскресенье ставим небольшую цель на следующую неделю и поддерживаем друг друга.", cover: "cover_14.png", schedule: "Воскресенье, 20:00", location: "Онлайн", participantsCount: 5, participantIds: ["demo-01", "demo-04", "demo-07", "demo-10", "demo-11"] } },
    { id: "demo-06", name: "Дарья Николаева", avatar: "avatar_15.png", isDemo: true, tags: ["Бег"], bio: "Студентка из Казани. Готовится к первым официальным 10 км.", plan: { id: "demo-plan-06", series: "Первый старт", title: "Первый старт", description: "Если готовишься к своему первому забегу — присоединяйся. Делимся подготовкой и переживаниями.", cover: "cover_15.png", schedule: "Пятница, 18:30", location: "Онлайн", participantsCount: 4, participantIds: ["demo-04", "demo-08", "demo-10", "demo-12"] } },
    { id: "demo-07", name: "Павел Смирнов", avatar: "avatar_16.png", isDemo: true, tags: ["Бег"], bio: "Предприниматель из Москвы. Бегает между встречами и командировками.", plan: { id: "demo-plan-07", series: "Обеденный бег", title: "Бег в обеденный перерыв", description: "Иногда достаточно 30 минут, чтобы полностью переключиться. Кто сегодня выбежал днём?", cover: "cover_16.png", schedule: "Вторник, 13:00", location: "Онлайн", participantsCount: 3, participantIds: ["demo-05", "demo-09", "demo-11"] } },
    { id: "demo-08", name: "Ольга Фролова", avatar: "avatar_17.png", isDemo: true, tags: ["Бег"], bio: "Молодая мама из Ярославля. Возвращается к бегу после рождения ребёнка.", plan: { id: "demo-plan-08", series: "Маленькие победы", title: "Маленькая победа недели", description: "Делимся любым прогрессом: первая пробежка, новый маршрут или просто удалось выйти из дома.", cover: "cover_17.png", schedule: "Воскресенье, 19:00", location: "Онлайн", participantsCount: 5, participantIds: ["demo-01", "demo-03", "demo-06", "demo-07", "demo-11"] } },
    { id: "demo-09", name: "Никита Крылов", avatar: "avatar_18.png", isDemo: true, tags: ["Бег"], bio: "Аналитик из Новосибирска. Бегает ради здоровья и дисциплины.", plan: { id: "demo-plan-09", series: "Интервалы", title: "Интервальный вторник", description: "Выполняем интервальную тренировку в своём темпе, а после делимся результатами и ощущениями.", cover: "cover_18.png", schedule: "Вторник, 19:00", location: "Онлайн", participantsCount: 4, participantIds: ["demo-02", "demo-03", "demo-04", "demo-06"] } },
    { id: "demo-10", name: "София Орлова", avatar: "avatar_19.png", isDemo: true, tags: ["Бег"], bio: "Копирайтер из Калининграда. Любит бегать вдоль моря.", plan: { id: "demo-plan-10", series: "Музыка для бега", title: "Что сегодня в наушниках?", description: "Делимся любимыми плейлистами, подкастами и треками для пробежек.", cover: "cover_19.png", schedule: "Пятница, 18:00", location: "Онлайн", participantsCount: 5, participantIds: ["demo-02", "demo-06", "demo-07", "demo-11", "demo-12"] } },
    { id: "demo-11", name: "Кирилл Власов", avatar: "avatar_20.png", isDemo: true, tags: ["Бег"], bio: "UX-дизайнер из Санкт-Петербурга. Исследует город через бег.", plan: { id: "demo-plan-11", series: "Новый маршрут", title: "Маршрут недели", description: "Показываем интересные маршруты, которые открыли для себя на этой неделе.", cover: "cover_20.png", schedule: "Четверг, 19:00", location: "Онлайн", participantsCount: 4, participantIds: ["demo-01", "demo-05", "demo-06", "demo-10"] } },
    { id: "demo-12", name: "Алина Сергеева", avatar: "avatar_21.png", isDemo: true, tags: ["Бег"], bio: "Иллюстратор из Казани. Бегает ради удовольствия без гонки за временем.", plan: { id: "demo-plan-12", series: "Восстановление", title: "Восстановительная среда", description: "После тренировки уделяем время растяжке, прогулке или роллу и рассказываем, что помогает восстановиться.", cover: "cover_21.png", schedule: "Среда, 20:30", location: "Онлайн", participantsCount: 3, participantIds: ["demo-02", "demo-08", "demo-09"] } },
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

const weekdayByName: Record<string, number> = {
  Понедельник: 1,
  Вторник: 2,
  Среда: 3,
  Четверг: 4,
  Пятница: 5,
  Суббота: 6,
  Воскресенье: 7,
};

const parseDemoSchedule = (value: string) => {
  const [weekdayName = "Понедельник", time = "09:00"] = value.split(",").map((part) => part.trim());
  const weekday = weekdayByName[weekdayName] ?? 1;
  const [hours = "9", minutes = "0"] = time.split(":");
  const nextDate = new Date();
  const todayWeekday = nextDate.getDay() === 0 ? 7 : nextDate.getDay();
  const targetHours = Number.parseInt(hours, 10);
  const targetMinutes = Number.parseInt(minutes, 10);
  const candidate = new Date(nextDate);
  candidate.setHours(targetHours, targetMinutes, 0, 0);
  const daysUntil = (weekday - todayWeekday + 7) % 7;
  candidate.setDate(candidate.getDate() + daysUntil);
  if (daysUntil === 0 && candidate.getTime() < nextDate.getTime()) {
    candidate.setDate(candidate.getDate() + 7);
  }

  return {
    weekday,
    weekdayName,
    time,
    start: candidate.toISOString(),
    timeDate: `${weekdayName} · ${time}`,
  };
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
    duration: "Каждую неделю",
    title: person.plan.title,
    description: person.plan.description,
    habit: { title: person.plan.series, durationMin: 45 },
    coverUrl: demoCommunityAssets.covers[person.plan.cover],
    gradient: "linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)",
    schedule: {
      mode: "exact",
      timeMode: "exact",
      time: schedule.time,
      partOfDay: null,
      weekdays: [schedule.weekday],
      start: schedule.start,
      repeat: { type: "weekly" },
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
    shareUrl: `https://wellwellwell.app/plans/${person.plan.id}`,
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
