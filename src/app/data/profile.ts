import profileCover1 from "@/imports/profile-cover-1.webp";
import profileCover2 from "@/imports/profile-cover-2.webp";
import cover1 from "@/imports/cover1-opt.webp";
import cover2 from "@/imports/cover2-opt.webp";
import cover3 from "@/imports/cover3-opt.webp";
import cover4 from "@/imports/cover4-opt.webp";
import expertAvatarMariaKuznetsova from "@/imports/avatar_01.webp";
import expertAvatarDmitryOrlov from "@/imports/avatar_02.webp";
import expertAvatarSvetlanaVoronova from "@/imports/avatar_03.webp";
import expertAvatarAlexeyPetrov from "@/imports/avatar_04.webp";
import expertAvatarYuliaBelova from "@/imports/avatar_05.webp";
import { P_AVATARS, UNSPLASH } from "@/app/data/constants";
import { demoCommunity, demoCommunityAssets } from "@/app/data/demoCommunity";
import { homeFeedPlans, normalizePlanTag } from "@/app/data/plans";
import type { PlanId, PlanTag } from "@/app/types";

export const DEFAULT_COVER_URLS = ["default:run1", "default:run2"] as const;

const defaultCoverAssetByToken: Record<string, string> = {
  "default:run1": profileCover1 as unknown as string,
  "default:run2": profileCover2 as unknown as string,
};

export const resolveCoverUrl = (coverUrl: string) => defaultCoverAssetByToken[coverUrl] ?? coverUrl;

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
  id: PlanId;
  title: string;
  axis: "Движение" | "Восстановление" | "Развитие";
  weeksCount: number | null;
  participantsCount: number;
  coverUrl?: string;
  gradient?: string;
}

export interface ExpertProfile {
  id: string;
  telegramId: number;
  username?: string;
  name: string;
  bio: string;
  photoUrl: string | null;
  photoUrls: string[];
  coverUrls: string[] | null;
  followersCount: number;
  followingCount: number;
  plansCount: number;
  isFollowedByMe: boolean;
  isMe: boolean;
  isDemo?: boolean;
  tags?: string[];
  cannedReplies?: string[];
}

export const profileFollowers: ExpertConnection[] = [
  { id: "dmitry-orlov", name: "Дмитрий Орлов", avatarUrl: expertAvatarDmitryOrlov as unknown as string, isFollowedByMe: false },
  { id: "svetlana-voronova", name: "Светлана Воронова", avatarUrl: expertAvatarSvetlanaVoronova as unknown as string, isFollowedByMe: false },
  { id: "alexey-petrov", name: "Алексей Петров", avatarUrl: expertAvatarAlexeyPetrov as unknown as string, isFollowedByMe: true },
  { id: "yulia-belova", name: "Юлия Белова", avatarUrl: expertAvatarYuliaBelova as unknown as string, isFollowedByMe: true },
];

export const profileFollowing: ExpertConnection[] = [
  { id: "maria-kuznetsova", name: "Мария Кузнецова", avatarUrl: expertAvatarMariaKuznetsova as unknown as string, isFollowedByMe: true },
  { id: "dmitry-orlov", name: "Дмитрий Орлов", avatarUrl: expertAvatarDmitryOrlov as unknown as string, isFollowedByMe: true },
  { id: "svetlana-voronova", name: "Светлана Воронова", avatarUrl: expertAvatarSvetlanaVoronova as unknown as string, isFollowedByMe: false },
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
  .filter((plan) => plan.author.name === "Мария Кузнецова")
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
  id: "maria-kuznetsova",
  telegramId: 0,
  name: "Мария Кузнецова",
  bio: "Тренирую бегунов пять лет, от первой пробежки до финишной черты. Работаю онлайн и офлайн, люблю тех, кто начинает с нуля и не знает, получится ли.",
  photoUrl: expertAvatarMariaKuznetsova as unknown as string,
  photoUrls: [expertAvatarMariaKuznetsova as unknown as string],
  coverUrls: [cover1 as unknown as string],
  followersCount: profileFollowers.length,
  followingCount: profileFollowing.length,
  plansCount: expertPlans.length,
  isFollowedByMe: false,
  isMe: false,
  isDemo: true,
  cannedReplies: [
    "Привет. Начни спокойно, без гонки за темпом.",
    "Главное — регулярность. Если пропустишь день, просто возвращайся к плану.",
    "После тренировки запиши ощущения, по ним проще корректировать нагрузку.",
  ],
};

export const experts: ExpertProfile[] = [
  expertProfile,
  {
    id: "dmitry-orlov",
    telegramId: 0,
    name: "Дмитрий Орлов",
    bio: "Меня интересует не финиш сам по себе, а то, что происходит с телом и головой на пути к нему. Готовлю бегунов к полумарафонам и марафонам. В работе опираюсь на физиологию и данные, а не на ощущения.",
    photoUrl: expertAvatarDmitryOrlov as unknown as string,
    photoUrls: [expertAvatarDmitryOrlov as unknown as string],
    coverUrls: [cover2 as unknown as string],
    followersCount: 2180,
    followingCount: 64,
    plansCount: 3,
    isFollowedByMe: false,
    isMe: false,
    isDemo: true,
    cannedReplies: [
      "План проходит нормально, если пульс не улетает в первые минуты.",
      "Смотри не на разовый результат, а на динамику за неделю.",
      "Вопрос по плану лучше решать через нагрузку и восстановление, не через мотивацию.",
    ],
  },
  {
    id: "svetlana-voronova",
    telegramId: 0,
    name: "Светлана Воронова",
    bio: "Специализируюсь на дистанции 5 км — первой серьёзной дистанции для большинства бегунов. Помогаю начать бегать, выстроить регулярность и выйти на первый старт.",
    photoUrl: expertAvatarSvetlanaVoronova as unknown as string,
    photoUrls: [expertAvatarSvetlanaVoronova as unknown as string],
    coverUrls: [cover3 as unknown as string],
    followersCount: 980,
    followingCount: 73,
    plansCount: 3,
    isFollowedByMe: false,
    isMe: false,
    isDemo: true,
    cannedReplies: [
      "Начинаем мягко. Первые тренировки должны казаться слишком лёгкими.",
      "Если сбилось дыхание, переходи на шаг и возвращайся к бегу позже.",
      "На 5 км важнее ровность, чем быстрый первый километр.",
    ],
  },
  {
    id: "alexey-petrov",
    telegramId: 0,
    name: "Алексей Петров",
    bio: "Большинство проблем в беге — это не нагрузка и не слабая физподготовка, а неправильная механика движения. Помогаю найти и исправить то, что мешает бежать эффективно и без боли.",
    photoUrl: expertAvatarAlexeyPetrov as unknown as string,
    photoUrls: [expertAvatarAlexeyPetrov as unknown as string],
    coverUrls: [cover4 as unknown as string],
    followersCount: 1560,
    followingCount: 51,
    plansCount: 3,
    isFollowedByMe: false,
    isMe: false,
    isDemo: true,
    cannedReplies: [
      "Проверь технику на разминке: корпус ровный, шаг короткий.",
      "Боль игнорировать не надо. Лучше снизить объём и сохранить движение.",
      "Если есть вопрос по механике, опиши, где именно тянет или зажимает.",
    ],
  },
  {
    id: "yulia-belova",
    telegramId: 0,
    name: "Юлия Белова",
    bio: "Тренирую выносливость, физическую и ментальную. Работаю с бегунами, которым мало просто финишировать — они хотят прогрессировать. Специализация — дистанции 10 км и выше.",
    photoUrl: expertAvatarYuliaBelova as unknown as string,
    photoUrls: [expertAvatarYuliaBelova as unknown as string],
    coverUrls: [cover1 as unknown as string],
    followersCount: 2410,
    followingCount: 92,
    plansCount: 3,
    isFollowedByMe: false,
    isMe: false,
    isDemo: true,
    cannedReplies: [
      "Привет. В этом плане важна терпеливая работа, без резких скачков.",
      "Если тренировка прошла тяжело, следующий день делаем легче.",
      "Увидимся на тренировке. Разберём темп по факту самочувствия.",
    ],
  },
  ...demoCommunity.people.map((person) => {
    const avatarUrl = demoCommunityAssets.avatars[person.avatar];
    const coverUrl = demoCommunityAssets.covers[person.plan.cover];
    return {
      id: person.id,
      telegramId: 0,
      name: person.name,
      bio: person.bio,
      photoUrl: avatarUrl,
      photoUrls: [avatarUrl],
      coverUrls: [coverUrl],
      followersCount: person.plan.participantIds.length,
      followingCount: 0,
      plansCount: 1,
      isFollowedByMe: false,
      isMe: false,
      isDemo: true,
      tags: [...person.tags],
    };
  }),
];

export const getExpertPlans = (expertId: string): ExpertProfilePlan[] =>
  homeFeedPlans
    .filter((plan) => plan.author.id === expertId)
    .map((plan) => ({
      id: plan.id,
      title: plan.isChallenge ? `Челлендж: ${plan.title}` : plan.title,
      axis: tagAxis[normalizePlanTag(plan.tag)],
      weeksCount: getWeeksCount(plan.duration),
      participantsCount: getParticipantsCount(plan.participantsLabel, plan.participants.length),
      coverUrl: plan.coverUrl,
      gradient: plan.gradient,
    }));
