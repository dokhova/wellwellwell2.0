import expertAvatarMariaKuznetsova from "@/imports/avatar_01.jpg";
import expertAvatarDmitryOrlov from "@/imports/avatar_02.jpg";
import expertAvatarSvetlanaVoronova from "@/imports/avatar_03.jpg";
import expertAvatarAlexeyPetrov from "@/imports/avatar_04.jpg";
import expertAvatarYuliaBelova from "@/imports/avatar_05.jpg";
import type { Screen, Visibility } from "@/app/types";

export const P_AVATARS = {
  w1: "https://images.unsplash.com/photo-1506863530036-1efeddceb993?crop=entropy&cs=tinysrgb&fit=crop&w=80&h=80&q=80",
  w2: "https://images.unsplash.com/photo-1557296387-5358ad7997bb?crop=entropy&cs=tinysrgb&fit=crop&w=80&h=80&q=80",
  m1: "https://images.unsplash.com/photo-1587397845856-e6cf49176c70?crop=entropy&cs=tinysrgb&fit=crop&w=80&h=80&q=80",
  m2: "https://images.unsplash.com/photo-1545996124-0501ebae84d0?crop=entropy&cs=tinysrgb&fit=crop&w=80&h=80&q=80",
  m3: "https://images.unsplash.com/photo-1617746652908-91e66c07499a?crop=entropy&cs=tinysrgb&fit=crop&w=80&h=80&q=80",
};

export const UNSPLASH = {
  phone: "https://images.unsplash.com/photo-1592890288564-76628a30a657?crop=entropy&cs=tinysrgb&fit=crop&w=300&h=300&q=80",
  shoes: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?crop=entropy&cs=tinysrgb&fit=crop&w=300&h=300&q=80",
  marathon: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?crop=entropy&cs=tinysrgb&fit=crop&w=300&h=400&q=80&crop=top",
  avatarMaria: expertAvatarMariaKuznetsova as unknown as string,
  avatarDmitry: expertAvatarDmitryOrlov as unknown as string,
  userAvatar: expertAvatarMariaKuznetsova as unknown as string,
};

export const GREEN = "var(--accent)";
export const GREEN_LIGHT = "var(--secondary)";
export const ALL_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
export const WEEKDAY_VALUES = [1, 2, 3, 4, 5, 6, 7];
export const PART_OF_DAY_RANGES = {
  morning: { label: "Утро", range: "06:00-10:00" },
  day: { label: "День", range: "12:00-15:00" },
  evening: { label: "Вечер", range: "18:00-22:00" },
} as const;
export const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "onlyMe", label: "Только я" },
];

export const EVENT_PARTICIPANTS = [
  { id: "maria-kuznetsova", name: "Мария Кузнецова", avatar: expertAvatarMariaKuznetsova as unknown as string, cannedReplies: ["Привет! Первые недели держим разговорный темп.", "Если тяжело, снизь скорость, но сохрани регулярность."] },
  { id: "dmitry-orlov", name: "Дмитрий Орлов", avatar: expertAvatarDmitryOrlov as unknown as string, cannedReplies: ["План проходит нормально, если пульс не улетает в первые минуты.", "Смотри не на разовый результат, а на динамику за неделю."] },
  { id: "svetlana-voronova", name: "Светлана Воронова", avatar: expertAvatarSvetlanaVoronova as unknown as string, cannedReplies: ["Начинаем мягко. Первые тренировки должны казаться слишком лёгкими.", "На 5 км важнее ровность, чем быстрый первый километр."] },
  { id: "alexey-petrov", name: "Алексей Петров", avatar: expertAvatarAlexeyPetrov as unknown as string, cannedReplies: ["Проверь технику на разминке: корпус ровный, шаг короткий.", "Боль игнорировать не надо."] },
  { id: "yulia-belova", name: "Юлия Белова", avatar: expertAvatarYuliaBelova as unknown as string, cannedReplies: ["В этом плане важна терпеливая работа, без резких скачков.", "Если тренировка прошла тяжело, следующий день делаем легче."] },
];

export const NO_BOTTOM_NAV: Screen[] = ["article", "search", "planEvent", "detail", "profileConnections", "editProfile", "addPlan", "create", "chat"];
