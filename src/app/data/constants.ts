import avatarManBlack from "@/imports/avatarManBlack-opt.jpg";
import avatarGirl from "@/imports/avatarGirl-opt.jpg";
import avatarDmitry from "@/imports/avatarDmitry-opt.jpg";
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
  avatarMaria: avatarGirl as unknown as string,
  avatarGena: avatarManBlack as unknown as string,
  avatarDmitry: avatarDmitry as unknown as string,
  userAvatar: avatarManBlack as unknown as string,
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
  { id: "maria", name: "Мария", avatar: P_AVATARS.w1 },
  { id: "dmitry", name: "Дмитрий", avatar: P_AVATARS.m1 },
  { id: "anna", name: "Анна", avatar: P_AVATARS.w2 },
  { id: "gena", name: "Гена", avatar: P_AVATARS.m2 },
];

export const NO_BOTTOM_NAV: Screen[] = ["article", "search", "planEvent", "detail", "profileConnections", "editProfile", "addPlan"];
