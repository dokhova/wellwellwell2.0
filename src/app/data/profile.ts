import cover1 from "@/imports/cover1-opt.jpg";
import cover2 from "@/imports/cover2-opt.jpg";
import cover3 from "@/imports/cover3-opt.jpg";
import cover4 from "@/imports/cover4-opt.jpg";
import expertAvatarMariaKuznetsova from "@/imports/avatar_01.jpg";
import expertAvatarDmitryOrlov from "@/imports/avatar_02.jpg";
import expertAvatarSvetlanaVoronova from "@/imports/avatar_03.jpg";
import expertAvatarAlexeyPetrov from "@/imports/avatar_04.jpg";
import expertAvatarYuliaBelova from "@/imports/avatar_05.jpg";
import expertPhoto from "@/imports/avatar 10.png";
import { P_AVATARS, UNSPLASH } from "@/app/data/constants";
import { homeFeedPlans, normalizePlanTag } from "@/app/data/plans";
import type { PlanTag } from "@/app/types";

export const habits = [
  { icon: "🌅", name: "Утренняя зарядка", done: 7, total: 7, streak: 14 },
  { icon: "📖", name: "Чтение 20 минут", done: 5, total: 7, streak: 5 },
  { icon: "🧘", name: "Медитация", done: 4, total: 7, streak: 4 },
  { icon: "📵", name: "Без гаджетов до 9 утра", done: 6, total: 7, streak: 9 },
];

export const myEvents = [
  { id: 107, title: "Бежим первые 5 км", date: "5 июля 2026", cover: homeFeedPlans.find((plan) => plan.id === 107)?.coverUrl ?? (cover3 as unknown as string) },
  { id: 105, title: "Готовимся к полумарафону", date: "15 сентября 2026", cover: homeFeedPlans.find((plan) => plan.id === 105)?.coverUrl ?? (cover1 as unknown as string) },
  { id: 115, title: "Челлендж: 10 км без потолка", date: "22 июня 2026", cover: homeFeedPlans.find((plan) => plan.id === 115)?.coverUrl ?? (cover2 as unknown as string) },
];

export const myArticles = [
  { id: 3, title: "Челлендж: Вечерний цифровой детокс", readTime: "8 мин чтения", cover: cover2 as unknown as string },
  { id: 1, title: "Well Well Well — качалка привычек", readTime: "2 мин чтения", cover: cover4 as unknown as string },
];

export const subscriptionAvatars = [
  UNSPLASH.avatarMaria,
  UNSPLASH.avatarGena,
  UNSPLASH.avatarDmitry,
  P_AVATARS.w2,
  P_AVATARS.m1,
];

export interface ExpertConnection {
  id: string;
  name: string;
  avatarUrl: string | null;
  isFollowedByMe: boolean;
}

export interface ExpertProfilePlan {
  id: number;
  title: string;
  axis: "Движение" | "Восстановление" | "Развитие";
  weeksCount: number | null;
  participantsCount: number;
  coverUrl?: string;
  gradient?: string;
}

export interface ExpertProfile {
  id: string;
  name: string;
  bio: string;
  photoUrl: string | null;
  followersCount: number;
  followingCount: number;
  plansCount: number;
  isFollowedByMe: boolean;
  isMe: boolean;
}

export const profileFollowers: ExpertConnection[] = [
  { id: "maria", name: "Мария Нестерова", avatarUrl: UNSPLASH.avatarMaria, isFollowedByMe: true },
  { id: "dmitry", name: "Дмитрий Савин", avatarUrl: UNSPLASH.avatarDmitry, isFollowedByMe: false },
  { id: "anna", name: "Анна Романова", avatarUrl: P_AVATARS.w2, isFollowedByMe: false },
  { id: "kirill", name: "Кирилл Волков", avatarUrl: P_AVATARS.m1, isFollowedByMe: true },
];

export const profileFollowing: ExpertConnection[] = [
  { id: "gena", name: "Гена Лохтин", avatarUrl: UNSPLASH.avatarGena, isFollowedByMe: true },
  { id: "olga", name: "Ольга Миронова", avatarUrl: P_AVATARS.w1, isFollowedByMe: true },
  { id: "ilya", name: "Илья Гордеев", avatarUrl: P_AVATARS.m3, isFollowedByMe: false },
];

const tagAxis: Record<PlanTag, ExpertProfilePlan["axis"]> = {
  running: "Движение",
  cycling: "Движение",
  yoga: "Развитие",
  recovery: "Восстановление",
  other: "Развитие",
};

const getWeeksCount = (duration?: string) => {
  if (!duration) return null;
  const weeksMatch = duration.match(/(\d+)\s*нед/);
  if (weeksMatch) return Number.parseInt(weeksMatch[1], 10);
  const daysMatch = duration.match(/(\d+)\s*(дн|день|дня|дней)/);
  if (daysMatch) return Math.max(1, Math.ceil(Number.parseInt(daysMatch[1], 10) / 7));
  return null;
};

const getParticipantsCount = (label: string, fallback: number) => {
  const parsed = Number.parseInt(label, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const expertPlans: ExpertProfilePlan[] = homeFeedPlans
  .filter((plan) => plan.author.name === "Гена Лохтин")
  .slice(0, 4)
  .map((plan) => ({
    id: plan.id,
    title: plan.isChallenge ? `Челлендж: ${plan.title}` : plan.title,
    axis: tagAxis[normalizePlanTag(plan.tag)],
    weeksCount: getWeeksCount(plan.duration),
    participantsCount: getParticipantsCount(plan.participantsLabel, plan.participants.length),
    coverUrl: plan.coverUrl,
    gradient: plan.gradient,
  }));

export const expertProfile: ExpertProfile = {
  id: "gena",
  name: "Евгения Лаптева",
  bio: "Тренирую женщин семь лет, от первого подхода до свободы в собственном теле. Работаю онлайн и офлайн, люблю тех, кто возвращается после перерыва, после родов или после долгого «потом начну».",
  photoUrl: expertPhoto as unknown as string,
  followersCount: profileFollowers.length,
  followingCount: profileFollowing.length,
  plansCount: expertPlans.length,
  isFollowedByMe: false,
  isMe: false,
};

export const experts: ExpertProfile[] = [
  expertProfile,
  {
    id: "maria-kuznetsova",
    name: "Мария Кузнецова",
    bio: "Тренирую бегунов пять лет, от первой пробежки до финишной черты. Работаю онлайн и офлайн, люблю тех, кто начинает с нуля и не знает, получится ли.",
    photoUrl: expertAvatarMariaKuznetsova as unknown as string,
    followersCount: 1240,
    followingCount: 86,
    plansCount: 3,
    isFollowedByMe: false,
    isMe: false,
  },
  {
    id: "dmitry-orlov",
    name: "Дмитрий Орлов",
    bio: "Меня интересует не финиш сам по себе, а то, что происходит с телом и головой на пути к нему. Готовлю бегунов к полумарафонам и марафонам. В работе опираюсь на физиологию и данные, а не на ощущения.",
    photoUrl: expertAvatarDmitryOrlov as unknown as string,
    followersCount: 2180,
    followingCount: 64,
    plansCount: 3,
    isFollowedByMe: false,
    isMe: false,
  },
  {
    id: "svetlana-voronova",
    name: "Светлана Воронова",
    bio: "Специализируюсь на дистанции 5 км — первой серьёзной дистанции для большинства бегунов. Помогаю начать бегать, выстроить регулярность и выйти на первый старт.",
    photoUrl: expertAvatarSvetlanaVoronova as unknown as string,
    followersCount: 980,
    followingCount: 73,
    plansCount: 3,
    isFollowedByMe: false,
    isMe: false,
  },
  {
    id: "alexey-petrov",
    name: "Алексей Петров",
    bio: "Большинство проблем в беге — это не нагрузка и не слабая физподготовка, а неправильная механика движения. Помогаю найти и исправить то, что мешает бежать эффективно и без боли.",
    photoUrl: expertAvatarAlexeyPetrov as unknown as string,
    followersCount: 1560,
    followingCount: 51,
    plansCount: 3,
    isFollowedByMe: false,
    isMe: false,
  },
  {
    id: "yulia-belova",
    name: "Юлия Белова",
    bio: "Тренирую выносливость, физическую и ментальную. Работаю с бегунами, которым мало просто финишировать — они хотят прогрессировать. Специализация — дистанции 10 км и выше.",
    photoUrl: expertAvatarYuliaBelova as unknown as string,
    followersCount: 2410,
    followingCount: 92,
    plansCount: 3,
    isFollowedByMe: false,
    isMe: false,
  },
];

export const getExpertPlans = (expertId: string): ExpertProfilePlan[] =>
  homeFeedPlans
    .filter((plan) => (plan.author.id ?? "gena") === expertId)
    .map((plan) => ({
      id: plan.id,
      title: plan.isChallenge ? `Челлендж: ${plan.title}` : plan.title,
      axis: tagAxis[normalizePlanTag(plan.tag)],
      weeksCount: getWeeksCount(plan.duration),
      participantsCount: getParticipantsCount(plan.participantsLabel, plan.participants.length),
      coverUrl: plan.coverUrl,
      gradient: plan.gradient,
    }));
