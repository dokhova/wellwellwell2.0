import { useState } from "react";
import challengeImg from "@/imports/challenge-opt.jpg";
import cover1 from "@/imports/cover1-opt.jpg";
import cover2 from "@/imports/cover2-opt.jpg";
import cover3 from "@/imports/cover3-opt.jpg";
import cover4 from "@/imports/cover4-opt.jpg";
import planSeed1 from "@/imports/plan-seed-1.png";
import planSeed2 from "@/imports/plan-seed-2.png";
import planSeed3 from "@/imports/plan-seed-3.png";
import planSeed4 from "@/imports/plan-seed-4.png";
import planSeed5 from "@/imports/plan-seed-5.png";
import planSeed6 from "@/imports/plan-seed-6.png";
import planSeed7 from "@/imports/plan-seed-7.png";
import planSeed8 from "@/imports/plan-seed-8.png";
import planSeed9 from "@/imports/plan-seed-9.png";
import planSeed10 from "@/imports/plan-seed-10.png";
import avatarManBlack from "@/imports/avatarManBlack-opt.jpg";
import avatarGirl from "@/imports/avatarGirl-opt.jpg";
import avatarDmitry from "@/imports/avatarDmitry-opt.jpg";
import avatarBrand from "@/imports/avatar-brand.png";
import {
  Home,
  Calendar,
  User,
  Plus,
  Search,
  X,
  ArrowLeft,
  ChevronDown,
  MoreVertical,
  Image as ImageIcon,
  Trash2,
  Copy,
  MapPin,
  Users,
  Video,
  Clock,
  Repeat2,
  Activity,
  MessageCircle,
  Check,
  ChevronRight,
  Eye,
  Filter,
  Lock,
  Share2,
  Construction,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = "home" | "plans" | "create" | "detail" | "article" | "search" | "planEvent" | "profile";

interface Article {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  authorVerified?: boolean;
  readTime: string;
  coverUrl: string | null;
  avatarUrl: string | null;
  avatarBrand?: boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const P_AVATARS = {
  w1: "https://images.unsplash.com/photo-1506863530036-1efeddceb993?crop=entropy&cs=tinysrgb&fit=crop&w=80&h=80&q=80",
  w2: "https://images.unsplash.com/photo-1557296387-5358ad7997bb?crop=entropy&cs=tinysrgb&fit=crop&w=80&h=80&q=80",
  m1: "https://images.unsplash.com/photo-1587397845856-e6cf49176c70?crop=entropy&cs=tinysrgb&fit=crop&w=80&h=80&q=80",
  m2: "https://images.unsplash.com/photo-1545996124-0501ebae84d0?crop=entropy&cs=tinysrgb&fit=crop&w=80&h=80&q=80",
  m3: "https://images.unsplash.com/photo-1617746652908-91e66c07499a?crop=entropy&cs=tinysrgb&fit=crop&w=80&h=80&q=80",
};

const UNSPLASH = {
  phone: "https://images.unsplash.com/photo-1592890288564-76628a30a657?crop=entropy&cs=tinysrgb&fit=crop&w=300&h=300&q=80",
  shoes: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?crop=entropy&cs=tinysrgb&fit=crop&w=300&h=300&q=80",
  marathon: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?crop=entropy&cs=tinysrgb&fit=crop&w=300&h=400&q=80&crop=top",
  avatarMaria: avatarGirl as unknown as string,
  avatarGena: avatarManBlack as unknown as string,
  avatarDmitry: avatarDmitry as unknown as string,
  userAvatar: avatarManBlack as unknown as string,
};

const articles: Article[] = [
  {
    id: 1,
    title: "Well Well Well — качалка привычек",
    excerpt: "Это не ещё один список дел. Тут привычки реально прокачиваются.",
    author: "Well Well Well",
    authorVerified: true,
    readTime: "2 мин чтения",
    coverUrl: cover4 as unknown as string,
    avatarUrl: avatarBrand as unknown as string,
    avatarBrand: false,
  },
  {
    id: 2,
    title: "Программа весенней подготовки",
    excerpt: "Иногда всё идёт не по плану. Старт отменён, сезон расслабился...",
    author: "Мария Кузнецова",
    readTime: "5 мин чтения",
    coverUrl: cover3 as unknown as string,
    avatarUrl: UNSPLASH.avatarMaria,
  },
  {
    id: 3,
    title: "Челлендж: Вечерний цифровой детокс",
    excerpt: "Свет экрана вечером подавляет мелатонин и сдвигает циркадные часы.",
    author: "Гена Лохтин",
    readTime: "8 мин чтения",
    coverUrl: cover2 as unknown as string,
    avatarUrl: UNSPLASH.avatarGena,
  },
  {
    id: 4,
    title: "Полумарафон — это не только про бег",
    excerpt: "Когда говорят о дистанции 21,1 км, обычно представляют бегунов...",
    author: "Дмитрий Орлов",
    readTime: "6 мин чтения",
    coverUrl: cover1 as unknown as string,
    avatarUrl: UNSPLASH.avatarDmitry,
  },
];

const articleBodies: Record<number, string[]> = {
  1: [
    "Мы не делаем очередной трекер задач. Well Well Well — это среда, в которой привычки растут сами, потому что система выстроена правильно.",
    "Каждый план в приложении — не просто напоминание. Это маленький ритуал с контекстом: зачем, когда, с кем. Мозг лучше запоминает действие, когда у него есть история.",
    "Мы собрали механики из поведенческой психологии: цепочки привычек, социальная ответственность, микро-прогресс. Всё это встроено в интерфейс незаметно.",
    "Попробуйте одну привычку в течение 14 дней. Просто одну. Посмотрите, что произойдёт.",
  ],
  2: [
    "Весна — идеальное время, чтобы начать двигаться. Но «начать» и «удержать темп» — совсем разные вещи.",
    "Программа весенней подготовки рассчитана на 8 недель. В ней три уровня: восстановление, база и прогрессия. Каждая неделя строится поверх предыдущей.",
    "Первые две недели — только лёгкий бег и мобилизация. Не торопитесь. Организм после зимы нуждается в мягком старте, иначе травмы неизбежны.",
    "Добавьте программу в свои Планы и получайте напоминания в нужное время. Мария Кузнецова — тренер по бегу, 12 лет практики, мастер спорта.",
  ],
  3: [
    "Свет экрана вечером подавляет выработку мелатонина и сдвигает внутренние часы на 1,5–2 часа вперёд. Вы ложитесь позже, встаёте тяжелее.",
    "Челлендж простой: за два часа до сна убираем все экраны. Телефон, ноутбук, телевизор. Взамен — книга, прогулка, разговор.",
    "128 человек уже присоединились к этому плану. Многие отмечают, что уже через 3 дня качество сна заметно улучшается.",
    "Присоединяйтесь каждый вечер в 21:00. Никаких созвонов, никаких обязательств — просто общее намерение и взаимная поддержка в комментариях.",
  ],
  4: [
    "21,1 км — это не просто дистанция. Это точка, в которой вы встречаетесь с собой по-настоящему.",
    "Полумарафон требует минимум 12 недель подготовки при базовом уровне. Но главный ресурс — не ноги, а голова. Умение терпеть, замедляться и доверять плану.",
    "Дмитрий Орлов пробежал 14 полумарафонов. По его словам, каждый из них был разным: одни — триумфом, другие — уроком. Оба варианта ценны.",
    "В этой статье — практические советы по темпу, питанию на дистанции и восстановлению после финиша. Читайте перед стартом.",
  ],
};

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const weekDates = [29, 30, 1, 2, 3, 4, 5];
const weekDateMonths = ["июня", "июня", "июля", "июля", "июля", "июля", "июля"];

// ─── Colour tokens ─────────────────────────────────────────────────────────────

const GREEN = "var(--accent)";
const GREEN_LIGHT = "var(--secondary)";

// ─── Sub-components ────────────────────────────────────────────────────────────


function Avatar({ colors, size = 28 }: { colors: string[]; size?: number }) {
  if (colors.length === 1) {
    return (
      <div
        className="rounded-full flex-shrink-0"
        style={{
          width: size,
          height: size,
          backgroundColor: colors[0],
        }}
      />
    );
  }
  return (
    <div className="flex -space-x-1.5 flex-shrink-0">
      {colors.map((c, i) => (
        <div
          key={i}
          className="rounded-full border border-white"
          style={{ width: size - 4, height: size - 4, backgroundColor: c }}
        />
      ))}
    </div>
  );
}

// ─── Screen: Home ─────────────────────────────────────────────────────────────

function AuthorAvatar({ article, size = 28 }: { article: Article; size?: number }) {
  if (article.avatarBrand) {
    return (
      <div
        className="rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white"
        style={{ width: size, height: size, backgroundColor: GREEN, fontSize: size * 0.45 }}
      >
        w
      </div>
    );
  }
  if (article.avatarUrl) {
    return (
      <img
        src={article.avatarUrl}
        alt={article.author}
        className="rounded-full flex-shrink-0 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: GREEN }}
    />
  );
}

function ArticleCard({
  article,
  onPress,
}: {
  article: Article;
  onPress?: () => void;
}) {
  const coverSrc = article.coverUrl;

  return (
    <div
      onClick={onPress}
      className="mx-4 rounded-[20px] p-4 active:opacity-90 cursor-pointer"
      style={{ backgroundColor: "#F8F9FA" }}
    >
      <div className="flex gap-3 items-start">
        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-gray-900 leading-snug mb-1.5 line-clamp-2">
            {article.title}
          </h3>
          <p className="text-[13px] text-gray-500 leading-snug line-clamp-2 mb-4">
            {article.excerpt}
          </p>

          {/* Author row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AuthorAvatar article={article} size={28} />
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-[12px] font-semibold text-gray-800">
                    {article.author}
                  </span>
                  {article.authorVerified && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="7" fill="#1D9BF0" />
                      <path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <p className="text-[11px] text-gray-400">{article.readTime}</p>
              </div>
            </div>
            <button
              onClick={(e) => e.stopPropagation()}
              className="w-7 h-7 flex items-center justify-center text-gray-400 rounded-full hover:bg-gray-200"
            >
              <MoreVertical size={16} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Cover image */}
        <div className="flex-shrink-0">
          {coverSrc ? (
            <img
              src={coverSrc as string}
              alt={article.title}
              className="rounded-xl object-cover"
              style={{ width: 100, height: 110 }}
            />
          ) : (
            <div
              className="rounded-xl bg-gray-200"
              style={{ width: 100, height: 110 }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const PLAN_TAGS = ["running", "cycling", "yoga", "recovery", "other"] as const;
type PlanTag = typeof PLAN_TAGS[number];
type TagFilter = PlanTag | "all";

interface HomeFeedPlan {
  id: number;
  tag?: PlanTag;
  isChallenge?: boolean;
  format?: "online" | "offline";
  duration?: string;
  title: string;
  description: string;
  habit?: {
    title: string;
    durationMin: number;
  };
  coverUrl?: string;
  gradient?: string;
  schedule: Schedule;
  participants: string[];
  participantsLabel: string;
  timeDate: string;
  address?: string;
  author: {
    name: string;
    avatarUrl: string;
  };
  shareUrl: string;
}

const PLAN_TAG_LABELS: Record<PlanTag, string> = {
  running: "Бег",
  cycling: "Велоспорт",
  yoga: "Йога",
  recovery: "Восстановление",
  other: "Другое",
};

const DEFAULT_PLAN_AUTHOR = {
  name: "Гена Лохтин",
  avatarUrl: UNSPLASH.avatarGena,
};

const DEFAULT_PLAN_PARTICIPANTS = [
  UNSPLASH.avatarMaria,
  P_AVATARS.m1,
  P_AVATARS.w1,
  P_AVATARS.m2,
  P_AVATARS.w2,
  P_AVATARS.m3,
];

const PLAN_TAG_GRADIENTS: Record<PlanTag, string> = {
  running: "linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)",
  cycling: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
  yoga: "linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%)",
  recovery: "linear-gradient(135deg, var(--muted-foreground) 0%, var(--primary) 100%)",
  other: "linear-gradient(135deg, var(--accent) 0%, var(--muted-foreground) 100%)",
};

const homeFeedPlans: HomeFeedPlan[] = [
  {
    id: 1,
    tag: "running",
    isChallenge: true,
    format: "offline",
    duration: "21 день",
    title: "21 день бега",
    description: "21 день подряд выходишь на пробежку, минимум 10 минут. Цель не результат, а закрепить привычку бегать. Пропустил день — счёт с начала.",
    habit: { title: "Ежедневная пробежка", durationMin: 15 },
    coverUrl: planSeed1 as unknown as string,
    gradient: PLAN_TAG_GRADIENTS.running,
    schedule: { mode: "partOfDay", timeMode: "partOfDay", time: null, partOfDay: "morning", weekdays: [1, 2, 3, 4, 5, 6, 7], repeat: { type: "days", days: 21 } },
    participants: DEFAULT_PLAN_PARTICIPANTS,
    participantsLabel: "100+ чел.",
    timeDate: "Утро · 21 день",
    author: DEFAULT_PLAN_AUTHOR,
    shareUrl: "https://wellwellwell.app/plans/1",
  },
  {
    id: 2,
    tag: "recovery",
    isChallenge: true,
    format: "online",
    duration: "14 дней",
    title: "14 дней без смартфона перед сном",
    description: "14 вечеров убираешь телефон за час до сна. Экран вечером бьёт по мелатонину и сдвигает засыпание. Отбой для гаджетов в 21:00.",
    habit: { title: "Отбой для гаджетов", durationMin: 60 },
    coverUrl: planSeed2 as unknown as string,
    gradient: PLAN_TAG_GRADIENTS.recovery,
    schedule: { mode: "partOfDay", timeMode: "partOfDay", time: null, partOfDay: "evening", weekdays: [1, 2, 3, 4, 5, 6, 7], repeat: { type: "days", days: 21 } },
    participants: DEFAULT_PLAN_PARTICIPANTS,
    participantsLabel: "100+ чел.",
    timeDate: "Вечер · 14 дней",
    author: DEFAULT_PLAN_AUTHOR,
    shareUrl: "https://wellwellwell.app/plans/2",
  },
  {
    id: 3,
    tag: "running",
    format: "offline",
    duration: "8 недель",
    title: "5 км с нуля",
    description: "8 недель, 3 пробежки в неделю. Старт с лёгкого бега 2,4 км в разговорном темпе, каждую неделю дистанция растёт. К 7 неделе бежишь 4,8 км, на 8 неделе контрольный забег 5 км. Между пробежками дни восстановления и ходьба.",
    habit: { title: "Беговая тренировка", durationMin: 30 },
    coverUrl: planSeed3 as unknown as string,
    gradient: PLAN_TAG_GRADIENTS.running,
    schedule: { mode: "partOfDay", timeMode: "partOfDay", time: null, partOfDay: "morning", weekdays: [1, 3, 5], repeat: { type: "weekly" } },
    participants: DEFAULT_PLAN_PARTICIPANTS,
    participantsLabel: "100+ чел.",
    timeDate: "Утро · 8 недель",
    author: DEFAULT_PLAN_AUTHOR,
    shareUrl: "https://wellwellwell.app/plans/3",
  },
  {
    id: 4,
    tag: "running",
    format: "offline",
    duration: "8 недель",
    title: "8 км",
    description: "8 недель, 3 беговых дня плюс короткая силовая. Лёгкий бег, силовая и длительный бег, который растёт с 3,2 км до 7,3 км. На 8 неделе забег 8 км.",
    habit: { title: "Беговая тренировка + силовая", durationMin: 40 },
    coverUrl: planSeed4 as unknown as string,
    gradient: PLAN_TAG_GRADIENTS.running,
    schedule: { mode: "partOfDay", timeMode: "partOfDay", time: null, partOfDay: "morning", weekdays: [1, 3, 5], repeat: { type: "weekly" } },
    participants: DEFAULT_PLAN_PARTICIPANTS,
    participantsLabel: "100+ чел.",
    timeDate: "Утро · 8 недель",
    author: DEFAULT_PLAN_AUTHOR,
    shareUrl: "https://wellwellwell.app/plans/4",
  },
  {
    id: 5,
    tag: "running",
    format: "offline",
    duration: "8 недель",
    title: "10 км",
    description: "8 недель, 3 пробежки в неделю: две лёгкие и одна длительная. Длительный бег растёт с 4,8 км до 8,9 км, на 8 неделе забег 10 км.",
    habit: { title: "Беговая тренировка", durationMin: 45 },
    coverUrl: planSeed5 as unknown as string,
    gradient: PLAN_TAG_GRADIENTS.running,
    schedule: { mode: "partOfDay", timeMode: "partOfDay", time: null, partOfDay: "morning", weekdays: [1, 3, 5], repeat: { type: "weekly" } },
    participants: DEFAULT_PLAN_PARTICIPANTS,
    participantsLabel: "100+ чел.",
    timeDate: "Утро · 8 недель",
    author: DEFAULT_PLAN_AUTHOR,
    shareUrl: "https://wellwellwell.app/plans/5",
  },
  {
    id: 6,
    tag: "running",
    format: "offline",
    duration: "12 недель",
    title: "Полумарафон",
    description: "12 недель, 3 пробежки в неделю: лёгкий, темповый и длинный бег. Длинная пробежка растёт с 6,4 км до 19,3 км, по дороге контрольные забеги 5 и 10 км. Финал на 12 неделе — полумарафон 21,1 км.",
    habit: { title: "Беговая тренировка", durationMin: 60 },
    coverUrl: planSeed6 as unknown as string,
    gradient: PLAN_TAG_GRADIENTS.running,
    schedule: { mode: "partOfDay", timeMode: "partOfDay", time: null, partOfDay: "morning", weekdays: [1, 3, 6], repeat: { type: "weekly" } },
    participants: DEFAULT_PLAN_PARTICIPANTS,
    participantsLabel: "100+ чел.",
    timeDate: "Утро · 12 недель",
    author: DEFAULT_PLAN_AUTHOR,
    shareUrl: "https://wellwellwell.app/plans/6",
  },
  {
    id: 7,
    tag: "running",
    format: "offline",
    duration: "10 недель",
    title: "Весенняя подготовка",
    description: "10 недель для тех, кто уже бегает. Чередуешь силовую, интервалы и длительный бег. Длительный растёт с 50 до 90 минут, темповые и интервалы добавляют скорость. Разгоняет форму к сезону стартов.",
    habit: { title: "Беговая тренировка", durationMin: 50 },
    coverUrl: planSeed7 as unknown as string,
    gradient: PLAN_TAG_GRADIENTS.running,
    schedule: { mode: "partOfDay", timeMode: "partOfDay", time: null, partOfDay: "morning", weekdays: [1, 3, 5], repeat: { type: "weekly" } },
    participants: DEFAULT_PLAN_PARTICIPANTS,
    participantsLabel: "100+ чел.",
    timeDate: "Утро · 10 недель",
    author: DEFAULT_PLAN_AUTHOR,
    shareUrl: "https://wellwellwell.app/plans/7",
  },
  {
    id: 8,
    tag: "cycling",
    format: "offline",
    duration: "Бессрочно",
    title: "Велосипед с нуля",
    description: "Спокойные выезды на низком пульсе набирают базу выносливости без перегруза суставов. 3 выезда в неделю по 45 минут в темпе, на котором можешь говорить.",
    habit: { title: "Лёгкий выезд", durationMin: 45 },
    coverUrl: planSeed8 as unknown as string,
    gradient: PLAN_TAG_GRADIENTS.cycling,
    schedule: { mode: "partOfDay", timeMode: "partOfDay", time: null, partOfDay: "day", weekdays: [1, 3, 5], repeat: { type: "weekly" } },
    participants: DEFAULT_PLAN_PARTICIPANTS,
    participantsLabel: "100+ чел.",
    timeDate: "День · Бессрочно",
    author: DEFAULT_PLAN_AUTHOR,
    shareUrl: "https://wellwellwell.app/plans/8",
  },
  {
    id: 9,
    tag: "cycling",
    format: "offline",
    duration: "Бессрочно",
    title: "Длинные дистанции на велосипеде",
    description: "Один длинный выезд в неделю растит выносливость для дальних маршрутов. Темп спокойный, главное — время в седле.",
    habit: { title: "Длинный выезд", durationMin: 90 },
    coverUrl: planSeed9 as unknown as string,
    gradient: PLAN_TAG_GRADIENTS.cycling,
    schedule: { mode: "partOfDay", timeMode: "partOfDay", time: null, partOfDay: "day", weekdays: [7], repeat: { type: "weekly" } },
    participants: DEFAULT_PLAN_PARTICIPANTS,
    participantsLabel: "100+ чел.",
    timeDate: "День · Бессрочно",
    author: DEFAULT_PLAN_AUTHOR,
    shareUrl: "https://wellwellwell.app/plans/9",
  },
  {
    id: 10,
    tag: "recovery",
    format: "online",
    duration: "Бессрочно",
    title: "Дыхание перед сном",
    description: "Медленное дыхание перед сном включает парасимпатику и ускоряет засыпание. 5 минут, вдохи длиннее выдохов.",
    habit: { title: "Медленное дыхание", durationMin: 5 },
    coverUrl: planSeed10 as unknown as string,
    gradient: PLAN_TAG_GRADIENTS.recovery,
    schedule: { mode: "partOfDay", timeMode: "partOfDay", time: null, partOfDay: "evening", weekdays: [1, 2, 3, 4, 5, 6, 7], repeat: { type: "days", days: 21 } },
    participants: DEFAULT_PLAN_PARTICIPANTS,
    participantsLabel: "100+ чел.",
    timeDate: "Вечер · Бессрочно",
    author: DEFAULT_PLAN_AUTHOR,
    shareUrl: "https://wellwellwell.app/plans/10",
  },
];

const CATEGORY_CHIPS: { label: string; value: TagFilter }[] = [
  { label: "Все", value: "all" },
  { label: "Бег", value: "running" },
  { label: "Велоспорт", value: "cycling" },
  { label: "Йога", value: "yoga" },
  { label: "Восстановление", value: "recovery" },
  { label: "Другое", value: "other" },
];

const normalizePlanTag = (tag?: string): PlanTag =>
  PLAN_TAGS.includes(tag as PlanTag) ? (tag as PlanTag) : "other";

function HomeSheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-end bg-black/30" onClick={onClose}>
      <div
        className="w-full rounded-t-3xl bg-white px-4 pt-4 pb-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[17px] font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={16} strokeWidth={2} color="#6B7280" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ParticipantAvatarLine({ avatars }: { avatars: string[] }) {
  const visible = avatars.slice(0, 5);

  return (
    <div className="flex -space-x-2">
      {visible.length > 0 ? (
        visible.map((url, index) => (
          <img
            key={`${url}-${index}`}
            src={url}
            alt=""
            className="h-7 w-7 rounded-full border-2 border-white object-cover shadow-[0_4px_10px_rgba(0,0,0,0.22)]"
          />
        ))
      ) : (
        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-white/25">
          <Users size={14} strokeWidth={1.8} color="#fff" />
        </div>
      )}
    </div>
  );
}

function FeedAvatarStack({ avatars, label }: { avatars: string[]; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <ParticipantAvatarLine avatars={avatars} />
      <span className="mt-1.5 text-[13px] font-medium leading-4 text-white/85">{label}</span>
    </div>
  );
}

function FeedEventCard({
  plan,
  onOpen,
  onAuthor,
  onShare,
  onAuthorMenu,
}: {
  plan: HomeFeedPlan;
  onOpen: () => void;
  onAuthor: () => void;
  onShare: () => void;
  onAuthorMenu: () => void;
}) {
  const tag = normalizePlanTag(plan.tag);

  return (
    <article>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className="relative w-full aspect-[4/5] overflow-hidden rounded-[28px] text-left active:opacity-95"
        style={{ background: plan.gradient ?? "#D1D5DB" }}
      >
        {plan.coverUrl && (
          <img src={plan.coverUrl} alt={plan.title} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.05) 42%, rgba(0,0,0,0.82) 100%)" }}
        />

        <div className="absolute left-5 right-5 top-5 flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-black/45 px-3 py-1.5 text-[13px] font-medium leading-4 text-white">
              {PLAN_TAG_LABELS[tag]}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-full bg-black/45"
          >
            <Share2 size={18} strokeWidth={2} color="#fff" />
          </button>
        </div>

        <div className="absolute bottom-8 left-5 right-5 flex flex-col items-center text-center">
          <FeedAvatarStack avatars={plan.participants} label={plan.participantsLabel} />
          <h2
            className="mt-3 max-w-[300px] text-[30px] font-bold leading-9 text-white"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {plan.isChallenge ? `Челлендж: ${plan.title}` : plan.title}
          </h2>
          <p className="mt-2 max-w-full truncate text-[16px] leading-6 text-white/75">{plan.timeDate}</p>
          {plan.address && (
            <p className="mt-0.5 max-w-full truncate text-[14px] text-white/65">{plan.address}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex h-12 items-center px-1">
        <button
          onClick={onAuthor}
          className="flex min-w-0 flex-1 items-center text-left"
        >
          <img src={plan.author.avatarUrl} alt={plan.author.name} className="h-9 w-9 flex-shrink-0 rounded-full object-cover" />
          <span className="ml-2.5 truncate text-[15px] font-medium text-gray-900">{plan.author.name}</span>
        </button>
        <button onClick={onAuthorMenu} className="w-8 h-8 flex items-center justify-end text-gray-400">
          <MoreVertical size={20} strokeWidth={1.9} />
        </button>
      </div>
    </article>
  );
}

function HomeScreen({
  onNavigate,
  onPlanOpen,
}: {
  onNavigate: (s: Screen, from?: Screen) => void;
  onPlanOpen: (id: number, from?: Screen) => void;
}) {
  const [tagFilter, setTagFilter] = useState<TagFilter>("all");
  const [sheet, setSheet] = useState<"filter" | "share" | "author" | null>(null);
  const [activePlan, setActivePlan] = useState<HomeFeedPlan | null>(null);
  const [copied, setCopied] = useState(false);

  const plansWithTag = homeFeedPlans.map((plan) => ({
    ...plan,
    tag: normalizePlanTag(plan.tag),
  }));

  const visiblePlans = plansWithTag.filter((plan) => {
    if (tagFilter === "all") return true;
    return plan.tag === tagFilter;
  });

  const openShare = (plan: HomeFeedPlan) => {
    setActivePlan(plan);
    setCopied(false);
    setSheet("share");
  };

  const copyActivePlan = async () => {
    if (!activePlan) return;
    await navigator.clipboard?.writeText(activePlan.shareUrl);
    setCopied(true);
  };

  const openAuthorMenu = (plan: HomeFeedPlan) => {
    setActivePlan(plan);
    setSheet("author");
  };

  return (
    <div className="relative flex flex-col h-full bg-surface">
      <div className="h-12 px-4 flex items-center justify-end">
        <div className="flex items-center gap-4 flex-shrink-0">
          <button onClick={() => setSheet("filter")} className="w-[22px] h-[22px] flex items-center justify-center text-muted-foreground">
            <Filter size={22} strokeWidth={1.8} />
          </button>
          <button onClick={() => onNavigate("search", "home")} className="w-[22px] h-[22px] flex items-center justify-center text-muted-foreground">
            <Search size={22} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-6 space-y-6">
        {visiblePlans.length > 0 ? (
          visiblePlans.map((plan) => (
            <FeedEventCard
              key={plan.id}
              plan={plan}
              onOpen={() => onPlanOpen(plan.id, "home")}
              onAuthor={() => onNavigate("profile")}
              onShare={() => openShare(plan)}
              onAuthorMenu={() => openAuthorMenu(plan)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[20px] bg-white px-6 py-14 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: GREEN_LIGHT }}>
              <Filter size={22} strokeWidth={1.8} color={GREEN} />
            </div>
            <h3 className="text-[17px] font-semibold text-gray-900">
              {tagFilter === "all"
                ? "Событий пока нет"
                : tagFilter === "running"
                  ? "Забегов пока нет"
                  : tagFilter === "cycling"
                    ? "Заездов пока нет"
                    : tagFilter === "yoga"
                      ? "Занятий пока нет"
                      : tagFilter === "recovery"
                        ? "Событий пока нет"
                        : "Тут пока пусто"}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-gray-400">
              {tagFilter === "all"
                ? "Скоро тут появятся события"
                : "Загляни позже или посмотри события в других категориях"}
            </p>
            {tagFilter !== "all" && (
              <button
                onClick={() => setTagFilter("all")}
                className="mt-5 h-11 rounded-full px-5 text-[14px] font-semibold text-white"
                style={{ backgroundColor: GREEN }}
              >
                Показать все
              </button>
            )}
          </div>
        )}
      </div>

      {sheet === "filter" && (
        <HomeSheet title="Фильтры" onClose={() => setSheet(null)}>
          <div className="space-y-2">
            {CATEGORY_CHIPS.map((chip) => {
              const active = tagFilter === chip.value;
              return (
              <button
                key={chip.value}
                onClick={() => {
                  setTagFilter(chip.value);
                  setSheet(null);
                }}
                className="w-full rounded-xl px-4 py-3 text-left text-[15px] font-medium flex items-center justify-between"
                style={active ? { backgroundColor: GREEN_LIGHT, color: GREEN } : { backgroundColor: "var(--muted)", color: "var(--foreground)" }}
              >
                <span>{chip.label}</span>
                {active && <Check size={18} strokeWidth={2.2} />}
              </button>
              );
            })}
          </div>
        </HomeSheet>
      )}

      {sheet === "share" && activePlan && (
        <HomeSheet title="Поделиться" onClose={() => setSheet(null)}>
          <p className="mb-3 truncate text-[14px] text-gray-500">{activePlan.title}</p>
          <button
            onClick={copyActivePlan}
            className="h-12 w-full rounded-2xl text-[15px] font-semibold text-white flex items-center justify-center gap-2"
            style={{ backgroundColor: GREEN }}
          >
            <Copy size={17} strokeWidth={2.2} />
            {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
          </button>
        </HomeSheet>
      )}

      {sheet === "author" && activePlan && (
        <HomeSheet title={activePlan.author.name} onClose={() => setSheet(null)}>
          <div className="space-y-2">
            <button onClick={() => { setSheet(null); onNavigate("profile"); }} className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-left text-[15px] font-medium text-gray-900">Открыть профиль</button>
            <button onClick={() => setSheet(null)} className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-left text-[15px] font-medium text-gray-900">Пожаловаться</button>
          </div>
        </HomeSheet>
      )}
    </div>
  );
}

// ─── Screen: Analytics ───────────────────────────────────────────────────────

const PERIODS = ["День", "Неделя", "Месяц"] as const;
type Period = typeof PERIODS[number];

const weekRanges = [
  "22–28 июня 2026",
  "15–21 июня 2026",
  "8–14 июня 2026",
];

const chartData = [
  { day: "Пнд", value: 80 },
  { day: "Втр", value: 60 },
  { day: "Срд", value: 100 },
  { day: "Чтв", value: 40 },
  { day: "Птн", value: 90 },
  { day: "Суб", value: 30 },
  { day: "Вск", value: 0 },
];

function WorkInProgress() {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-8 text-center"
      style={{ backgroundColor: "#F0F1F3" }}
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ backgroundColor: "#DBECE7" }}
      >
        <Construction size={36} strokeWidth={1.8} color={GREEN} />
      </div>
      <h2 className="text-[20px] font-bold mb-2" style={{ color: "#1a1a1a" }}>
        В работе
      </h2>
      <p className="text-[14px] leading-relaxed" style={{ color: "#6B7280" }}>
        Этот раздел ещё в разработке.
        <br />
        Скоро здесь появится контент.
      </p>
    </div>
  );
}

function AnalyticsScreen() {
  return <WorkInProgress />;
}

function AnalyticsScreenOld() {
  const [period, setPeriod] = useState<Period>("Неделя");
  const [rangeIdx, setRangeIdx] = useState(0);

  const completion = 78;
  const habitsDone = 26;
  const delta = "+11%";
  const streak = 9;
  const bestStreak = 14;

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "#F0F1F3" }}>
      <div className="px-4 pt-4 pb-6 space-y-3">

        {/* Period switcher */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="flex-1 py-1.5 rounded-lg text-[13px] transition-all"
                style={
                  period === p
                    ? { backgroundColor: "#fff", color: "#1a1a1a", fontWeight: 700, boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }
                    : { color: "#9CA3AF", fontWeight: 400 }
                }
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setRangeIdx(i => Math.min(weekRanges.length - 1, i + 1))}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-[14px] font-semibold text-gray-700">{weekRanges[rangeIdx]}</span>
            <button
              onClick={() => setRangeIdx(i => Math.max(0, i - 1))}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              style={{ opacity: rangeIdx === 0 ? 0.3 : 1 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        {/* Completion progress */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-[13px] font-semibold text-gray-800 mb-3">Выполнение привычек за период</p>
          <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
            <span>0%</span>
            <span>100%</span>
          </div>
          <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${completion}%`,
                background: `linear-gradient(90deg, ${GREEN}99, ${GREEN})`,
              }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-[12px] text-gray-400">Текущий результат</span>
            <span className="text-[15px] font-bold" style={{ color: GREEN }}>{completion}%</span>
          </div>
        </div>

        {/* Two stat cards */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-1">
            <p className="text-[11px] text-gray-400 leading-tight">Отмечены выполненными</p>
            <p className="text-[28px] font-bold text-gray-900 leading-none">{habitsDone}</p>
            <p className="text-[11px] text-gray-400">привычек за неделю</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-1">
            <p className="text-[11px] text-gray-400 leading-tight">Процент выполнения</p>
            <div className="flex items-end gap-1.5">
              <p className="text-[28px] font-bold text-gray-900 leading-none">{completion}%</p>
              <span className="text-[12px] font-semibold pb-0.5" style={{ color: "#22C55E" }}>↑{delta}</span>
            </div>
            <p className="text-[11px] text-gray-400">vs прошлая неделя</p>
          </div>
        </div>

        {/* Streak */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-[13px] font-semibold text-gray-800 mb-3">Серия выполнения</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: GREEN + "18" }}>
                🔥
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[32px] font-bold leading-none" style={{ color: GREEN }}>{streak}</span>
                  <span className="text-[14px] text-gray-500 font-medium">дней подряд</span>
                </div>
                <p className="text-[12px] text-gray-400 mt-0.5">Текущая серия</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[20px] font-bold text-gray-700">{bestStreak}</p>
              <p className="text-[11px] text-gray-400">Лучшая серия</p>
            </div>
          </div>
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-[13px] font-semibold text-gray-800 mb-4">Активность по дням</p>
          <div className="flex items-end justify-between gap-1.5" style={{ height: 80 }}>
            {chartData.map(({ day, value }) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full rounded-t-lg flex-1 flex items-end">
                  {value > 0 ? (
                    <div
                      className="w-full rounded-lg"
                      style={{
                        height: `${value}%`,
                        background: `linear-gradient(180deg, ${GREEN}CC, ${GREEN})`,
                        minHeight: 6,
                      }}
                    />
                  ) : (
                    <div className="w-full rounded-lg bg-gray-100" style={{ height: 6 }} />
                  )}
                </div>
                <span className="text-[10px] text-gray-400 font-medium">{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Events & plans stats */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-[13px] font-semibold text-gray-800 mb-3">События и планы</p>
          <div className="flex gap-3">
            <div className="flex-1 rounded-xl p-3" style={{ backgroundColor: GREEN + "12" }}>
              <p className="text-[24px] font-bold" style={{ color: GREEN }}>3</p>
              <p className="text-[11px] text-gray-500 leading-tight">события<br/>посещено</p>
            </div>
            <div className="flex-1 rounded-xl p-3" style={{ backgroundColor: "#F59E0B12" }}>
              <div className="flex items-baseline gap-1">
                <p className="text-[24px] font-bold" style={{ color: "#F59E0B" }}>12</p>
              </div>
              <p className="text-[11px] text-gray-500 leading-tight">планов<br/>выполнено</p>
            </div>
            <div className="flex-1 rounded-xl p-3" style={{ backgroundColor: "#6366F112" }}>
              <div className="flex items-baseline gap-1.5">
                <p className="text-[24px] font-bold" style={{ color: "#6366F1" }}>78%</p>
              </div>
              <p className="text-[11px] text-gray-500 leading-tight">выполнение<br/>планов</p>
            </div>
          </div>
        </div>

        {/* Habit set */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-[13px] font-semibold text-gray-800 mb-3">Текущий набор привычек</p>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[15px] font-bold text-gray-900">Утренний старт</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <img src={UNSPLASH.avatarGena} alt="" className="w-4 h-4 rounded-full object-cover" />
                <span className="text-[11px] text-gray-400">Гена Лохтин</span>
              </div>
            </div>
            <span className="text-[13px] font-semibold" style={{ color: GREEN }}>26 / 33</span>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[11px] text-gray-400">привычек выполнено</span>
              <span className="text-[11px] font-semibold" style={{ color: GREEN }}>79%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: "79%", backgroundColor: GREEN }} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Screen: Plans ────────────────────────────────────────────────────────────

const PLAN_CATEGORY_GRADIENTS: Record<string, string> = {
  "Бег": "linear-gradient(135deg, var(--brand-bright) 0%, var(--accent) 100%)",
  "Восстановление": "linear-gradient(135deg, var(--primary) 0%, var(--muted-foreground) 100%)",
  "Питание": "linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%)",
  "Другое": "linear-gradient(135deg, var(--muted-foreground) 0%, var(--border) 100%)",
};

function PlansScreen({ onNavigate, onPlanOpen }: { onNavigate: (s: Screen, from?: Screen) => void; onPlanOpen: (id: number) => void }) {
  void onNavigate;
  const [activeTab, setActiveTab] = useState<"plans" | "analytics">("plans");
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  const toggleCheck = (id: number) => {
    setCheckedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const todayIndex = 2;
  const monthShort = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
  const monthNumberByName: Record<string, number> = {
    января: 0,
    февраля: 1,
    марта: 2,
    апреля: 3,
    мая: 4,
    июня: 5,
    июля: 6,
    августа: 7,
    сентября: 8,
    октября: 9,
    ноября: 10,
    декабря: 11,
  };

  const partOfDayOrder: Record<string, number> = { morning: 0, day: 1, noon: 1, evening: 2 };
  const planItems = homeFeedPlans
    .flatMap((plan) => {
      const dayIndexes =
        plan.schedule.mode === "partOfDay" || plan.schedule.timeMode === "partOfDay"
          ? (plan.schedule.weekdays.length ? plan.schedule.weekdays.map((day) => day - 1) : [todayIndex])
          : [todayIndex];
      return dayIndexes.map((dayIndex) => ({
      plan,
      dayIndex,
      dayNumber: weekDates[dayIndex],
      monthName: weekDateMonths[dayIndex],
      sortKey: dayIndex,
      }));
    })
    .sort((a, b) => {
      const aTime = a.plan.schedule.partOfDay ? partOfDayOrder[a.plan.schedule.partOfDay] ?? 3 : 3;
      const bTime = b.plan.schedule.partOfDay ? partOfDayOrder[b.plan.schedule.partOfDay] ?? 3 : 3;
      return a.sortKey - b.sortKey || aTime - bTime || a.plan.title.localeCompare(b.plan.title);
    });
  const nextItem = planItems.find((item) => item.dayIndex >= todayIndex) ?? planItems[0];

  const getStatus = (planId: number, dayIndex: number) => {
    if (checkedItems.includes(planId)) return "Выполнено";
    if (dayIndex < todayIndex) return "Не выполнено";
    return "Запланировано";
  };

  const getTimeLabel = (plan: HomeFeedPlan) => {
    if (plan.schedule.mode === "exact" || plan.schedule.timeMode === "exact") {
      const start = plan.schedule.start ? new Date(plan.schedule.start) : null;
      if (start && !Number.isNaN(start.getTime())) {
        return start.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      }
    }
    if (plan.schedule.partOfDay) {
      return PART_OF_DAY_RANGES[plan.schedule.partOfDay].label;
    }
    return plan.timeDate.split("·")[0]?.trim() || "Время";
  };

  const getScheduleMeta = (plan: HomeFeedPlan, dayIndex: number, status: string) => {
    const timeLabel = getTimeLabel(plan);
    const prefix =
      dayIndex === todayIndex
        ? `${timeLabel.includes(":") ? "Сегодня в " : ""}${timeLabel}`
        : dayIndex === todayIndex + 1
          ? `${timeLabel.includes(":") ? "Завтра в " : "Завтра · "}${timeLabel}`
          : timeLabel;
    return `${prefix} · ${status}`;
  };

  const getGradient = (plan: HomeFeedPlan) => plan.gradient ?? PLAN_TAG_GRADIENTS[normalizePlanTag(plan.tag)];

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex flex-shrink-0 border-b border-border px-4">
        {[
          { id: "plans" as const, label: "Планы" },
          { id: "analytics" as const, label: "Аналитика" },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative h-12 flex-1 text-[17px] font-semibold"
              style={{ color: active ? "var(--foreground)" : "var(--muted-foreground)" }}
            >
              {tab.label}
              {active && <span className="absolute bottom-0 left-1/2 h-0.5 w-16 -translate-x-1/2 rounded-full" style={{ backgroundColor: GREEN }} />}
            </button>
          );
        })}
      </div>

      {activeTab === "analytics" ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-card">
            <Activity size={28} strokeWidth={1.8} color={GREEN} />
          </div>
          <p className="text-[16px] font-semibold text-foreground">В работе</p>
          <p className="mt-1 text-[14px] leading-5 text-muted-foreground">Аналитика появится здесь скоро</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {nextItem && (
            <button
              onClick={() => onPlanOpen(nextItem.plan.id)}
              className="mb-4 flex w-full items-center gap-3 rounded-[16px] p-3.5 text-left active:opacity-90"
              style={{ backgroundColor: "var(--brand-dark)" }}
            >
              <div className="h-[46px] w-[46px] flex-shrink-0 overflow-hidden rounded-lg" style={{ background: getGradient(nextItem.plan) }}>
                {nextItem.plan.coverUrl && <img src={nextItem.plan.coverUrl} alt={nextItem.plan.title} className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] leading-4 text-white/60">
                  {nextItem.dayIndex === todayIndex ? "Сегодня" : "Скоро"} · {nextItem.dayNumber} {nextItem.monthName}
                </p>
                <h3 className="mt-0.5 truncate text-[15px] font-semibold leading-5 text-white">{nextItem.plan.title}</h3>
              </div>
              <ChevronRight size={18} strokeWidth={2} color="rgba(255,255,255,0.7)" />
            </button>
          )}

          <div className="space-y-2.5">
            {planItems.map((item) => {
              const { plan, dayIndex, dayNumber, monthName } = item;
              const done = checkedItems.includes(plan.id);
              const status = getStatus(plan.id, dayIndex);
              const scheduleMeta = getScheduleMeta(plan, dayIndex, status);
              const monthIndex = monthNumberByName[monthName] ?? 0;
              const gradient = getGradient(plan);
              return (
                <button
                  key={`${plan.id}-${dayIndex}`}
                  onClick={() => onPlanOpen(plan.id)}
                  className="flex w-full items-center gap-3 rounded-[16px] bg-card px-3.5 py-3 text-left active:opacity-90"
                  style={{ opacity: done ? 0.65 : 1 }}
                >
                  <div className="flex w-[42px] flex-shrink-0 flex-col items-center justify-center">
                    <span className="text-[12px] leading-4 text-muted-foreground">{monthShort[monthIndex]}</span>
                    <span className="text-[20px] font-semibold leading-7 text-muted-foreground">{dayNumber}</span>
                  </div>
                  <div className="h-[38px] w-px flex-shrink-0 bg-border" />
                  <div className="h-[50px] w-[50px] flex-shrink-0 overflow-hidden rounded-xl" style={{ background: gradient }}>
                    {plan.coverUrl && <img src={plan.coverUrl} alt={plan.title} className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3
                      className="truncate text-[14px] leading-5 font-medium"
                      style={{
                        color: done ? "var(--muted-foreground)" : "var(--foreground)",
                        textDecoration: done ? "line-through" : "none",
                      }}
                    >
                      {plan.title}
                    </h3>
                    <p className="mt-0.5 truncate text-[13px] leading-4 text-muted-foreground">{scheduleMeta}</p>
                  </div>
                  <span
                    onClick={(e) => { e.stopPropagation(); toggleCheck(plan.id); }}
                    className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full border"
                    style={{
                      borderColor: done ? GREEN : "var(--border)",
                      backgroundColor: done ? GREEN : "transparent",
                    }}
                  >
                    {done && <Check size={14} strokeWidth={3} color="#fff" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Screen: Create Plan ──────────────────────────────────────────────────────

const ALL_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const WEEKDAY_VALUES = [1, 2, 3, 4, 5, 6, 7];
const PART_OF_DAY_RANGES = {
  morning: { label: "Утро", range: "06:00-10:00" },
  day: { label: "День", range: "12:00-15:00" },
  evening: { label: "Вечер", range: "18:00-22:00" },
} as const;

type TimeMode = "exact" | "partOfDay";
type PartOfDay = keyof typeof PART_OF_DAY_RANGES;
type Visibility = "all" | "onlyMe";
type PlanRepeat =
  | { type: "days"; days: number }
  | { type: "weekly" }
  | { type: "untilWeek"; week: number }
  | { type: "forever" };
type ScheduleEnd =
  | { type: "never" }
  | { type: "date"; date: string }
  | { type: "weeks"; weeks: number };

interface Schedule {
  timeMode?: TimeMode;
  mode?: TimeMode;
  time: string | null;
  partOfDay: PartOfDay | null;
  weekdays: number[];
  end?: ScheduleEnd | string;
  start?: string;
  repeat?: PlanRepeat;
  repeatUntilDate?: string;
}

const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "onlyMe", label: "Только я" },
];

const EVENT_PARTICIPANTS = [
  { id: "maria", name: "Мария", avatar: P_AVATARS.w1 },
  { id: "dmitry", name: "Дмитрий", avatar: P_AVATARS.m1 },
  { id: "anna", name: "Анна", avatar: P_AVATARS.w2 },
  { id: "gena", name: "Гена", avatar: P_AVATARS.m2 },
];

function CheckToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
      style={{ backgroundColor: on ? GREEN : "#E9EAEC" }}
    >
      {on && <Check size={15} strokeWidth={2.8} color="#fff" />}
    </button>
  );
}

function PlusButton() {
  return (
    <button className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-input">
      <Plus size={16} strokeWidth={2.2} color="var(--muted-foreground)" />
    </button>
  );
}

function OptionRow({
  icon, label, subtitle, control, onClick,
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
      className="w-full bg-card rounded-xl px-4 py-3.5 flex items-center gap-3 text-left active:opacity-70 transition-opacity"
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-secondary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-foreground">{label}</p>
        {subtitle && <p className="text-[12px] text-muted-foreground mt-0.5 leading-4">{subtitle}</p>}
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

function CreateScreen({ onNavigate, backTo = "plans" }: { onNavigate: (s: Screen) => void; backTo?: Screen }) {
  const getLocalDateTime = () => {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  };

  const splitDateTime = (value: string) => {
    const [date = "", time = ""] = value.split("T");
    return { date, time };
  };

  const initialDateTime = getLocalDateTime();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [timeMode, setTimeMode] = useState<TimeMode>("partOfDay");
  const [partOfDay, setPartOfDay] = useState<PartOfDay | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [exactStart, setExactStart] = useState(initialDateTime);
  const [exactEnd, setExactEnd] = useState(initialDateTime);
  const [repeat, setRepeat] = useState<PlanRepeat>({ type: "days", days: 21 });
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [untilWeek, setUntilWeek] = useState(4);
  const [scheduleError, setScheduleError] = useState("");
  const [titleError, setTitleError] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [showParticipantsPicker, setShowParticipantsPicker] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [videoLink, setVideoLink] = useState("");
  const [videoCopied, setVideoCopied] = useState(false);

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

  const isScheduleValid =
    timeMode === "partOfDay"
      ? Boolean(partOfDay) && selectedDays.length > 0
      : Boolean(exactStart);
  const isFormValid = title.trim().length > 0 && isScheduleValid;

  const switchTimeMode = (mode: TimeMode) => {
    setTimeMode(mode);
    setScheduleError("");
    if (mode === "exact" && !exactEnd) setExactEnd(exactStart);
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
    setScheduleError("");
  };

  const updateStartPart = (part: "date" | "time", value: string) => {
    const nextDate = part === "date" ? value : startParts.date;
    const nextTime = part === "time" ? value : startParts.time;
    const next = `${nextDate}T${nextTime || "00:00"}`;
    setExactStart(next);
    if (!exactEnd || endParts.date === startParts.date) {
      setExactEnd(`${nextDate}T${endParts.time || nextTime || "00:00"}`);
    }
    setScheduleError("");
  };

  const updateEndPart = (part: "date" | "time", value: string) => {
    const nextDate = part === "date" ? value : endParts.date || startParts.date;
    const nextTime = part === "time" ? value : endParts.time;
    setExactEnd(`${nextDate}T${nextTime || "00:00"}`);
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCoverImage(URL.createObjectURL(file));
    e.target.value = "";
  };

  const toggleParticipant = (id: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(id) ? prev.filter((participantId) => participantId !== id) : [...prev, id]
    );
  };

  const schedule: Schedule = timeMode === "partOfDay"
    ? {
        mode: "partOfDay",
        timeMode: "partOfDay",
        time: null,
        partOfDay,
        weekdays: selectedDays,
        repeat,
      }
    : {
        mode: "exact",
        timeMode: "exact",
        time: null,
        partOfDay: null,
        weekdays: [],
        start: exactStart ? new Date(exactStart).toISOString() : "",
        end: exactEnd ? new Date(exactEnd).toISOString() : "",
        repeat,
      };

  const videoMeeting = {
    enabled: videoEnabled,
    link: videoEnabled ? videoLink : "",
  };

  const validateSchedule = () => {
    if (timeMode === "partOfDay") {
      if (!partOfDay) return "Выберите время суток";
      if (selectedDays.length === 0) return "Выберите хотя бы один день недели";
    }
    if (timeMode === "exact" && !exactStart) {
      return "Выберите дату и время начала";
    }
    return "";
  };

  const handleCreate = () => {
    const nextTitleError = title.trim() ? "" : "Введите название";
    const nextScheduleError = validateSchedule();

    setTitleError(nextTitleError);
    setScheduleError(nextScheduleError);

    if (nextTitleError || nextScheduleError) return;

    const plan = {
      title: title.trim(),
      description: description.trim(),
      coverImage,
      visibility,
      participants: selectedParticipants,
      videoMeeting,
      schedule,
    };

    console.log(plan);
    onNavigate(backTo);
  };

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-14 flex-shrink-0 items-center justify-between px-4">
        <button onClick={() => onNavigate(backTo)} className="flex h-10 w-10 items-center justify-start">
          <X size={20} strokeWidth={2.2} color="var(--foreground)" />
        </button>
        <h1 className="text-[16px] font-semibold leading-6 text-foreground">Новый план</h1>
        <button
          onClick={handleCreate}
          disabled={!isFormValid}
          className="text-[15px] font-medium leading-5 disabled:opacity-100"
          style={{ color: isFormValid ? GREEN : "var(--muted-foreground)" }}
        >
          Создать
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="relative mb-4 aspect-[1.9/1] overflow-hidden rounded-xl" style={{ background: "linear-gradient(135deg, var(--brand-bright) 0%, var(--accent) 48%, var(--brand-dark) 100%)" }}>
          {coverImage && <img src={coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          {coverImage && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-alpha-overlay-55" />}
          <label className="absolute left-4 top-4 z-10 flex cursor-pointer items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-[12px] font-medium text-white">
            <ImageIcon size={14} strokeWidth={2} />
            {coverImage ? "Изменить" : "Обложка"}
            <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
          </label>
          <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center px-8 text-center">
            <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
            <input
              value={title}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleError("");
              }}
              placeholder="Название плана"
              className={`w-full bg-transparent text-center font-bold text-white placeholder:text-white/60 outline-none ${coverImage ? "text-[28px] leading-[34px]" : "text-[26px] leading-[34px]"}`}
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            />
            {!coverImage && (
              <>
                <div className="mt-3 h-px w-24 bg-white/50" />
                <p className="mt-3 text-[12px] leading-4 text-white/80">Тап, чтобы заполнить</p>
              </>
            )}
          </label>
        </div>

        {titleError && <p className="-mt-2 mb-3 text-[12px] font-medium text-destructive">{titleError}</p>}

        <div className="mb-5">
          <label className="mb-2 block text-[13px] leading-4 text-muted-foreground">Описание</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onInput={(e) => {
              e.currentTarget.style.height = "auto";
              e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
            }}
            placeholder="Опишите, зачем нужен план, что предстоит делать и какой результат получит участник"
            rows={3}
            className="min-h-[88px] w-full resize-none overflow-hidden rounded-lg bg-card px-3.5 py-3.5 text-[14px] leading-5 text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        <div className="space-y-4">
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
                            setPartOfDay(key as PartOfDay);
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
                      { label: "21 день", action: () => setRepeat({ type: "days", days: 21 }), active: repeat.type === "days" },
                      { label: "Каждую неделю", action: () => setRepeat({ type: "weekly" }), active: repeat.type === "weekly" },
                      { label: "До недели N", action: () => setRepeat({ type: "untilWeek", week: untilWeek }), active: repeat.type === "untilWeek" },
                      { label: "Бессрочно", action: () => setRepeat({ type: "forever" }), active: repeat.type === "forever" },
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
                            setRepeat({ type: "untilWeek", week });
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
              <div className="rounded-xl bg-card p-2 space-y-1">
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
        </div>

        <div className="h-3" />
      </div>

      <div className="flex-shrink-0 border-t border-border bg-card px-4 pb-4 pt-3">
        <button
          onClick={handleCreate}
          disabled={!isFormValid}
          className="h-12 w-full rounded-xl text-[15px] font-semibold text-white disabled:opacity-45"
          style={{ backgroundColor: GREEN }}
        >
          Создать план
        </button>
      </div>
    </div>
  );
}

// ─── Event data per article ───────────────────────────────────────────────────

const DETAIL_AVATARS = [P_AVATARS.w1, P_AVATARS.m1, P_AVATARS.w2, P_AVATARS.m2];

interface EventMeta {
  date: string;
  time: string;
  location: string;
  locationSub: string;
  participants: number;
  plusN: string;
  joinLabel: string;
}

const eventMeta: Record<number, EventMeta> = {
  0: { // DetailScreen (Челлендж из Планов)
    date: "Пн. 22 июня 2026", time: "21:00 — 23:00",
    location: "Онлайн", locationSub: "Из любой точки мира",
    participants: 128, plusN: "+123", joinLabel: "Присоединиться",
  },
  1: { // Well Well Well
    date: "Вс. 28 июня 2026", time: "10:00 — 11:30",
    location: "Онлайн", locationSub: "Прямой эфир в приложении",
    participants: 312, plusN: "+307", joinLabel: "Присоединиться",
  },
  2: { // Весенняя подготовка
    date: "Сб. 5 июля 2026", time: "08:00 — 09:30",
    location: "Парк Горького", locationSub: "Москва, главная аллея",
    participants: 47, plusN: "+42", joinLabel: "Записаться",
  },
  3: { // Детокс
    date: "Пн. 22 июня 2026", time: "21:00 — 23:00",
    location: "Онлайн", locationSub: "Из любой точки мира",
    participants: 128, plusN: "+123", joinLabel: "Присоединиться",
  },
  4: { // Полумарафон
    date: "Вс. 15 сентября 2026", time: "09:00 — 13:00",
    location: "Лужники", locationSub: "Москва, старт у главного входа",
    participants: 840, plusN: "+835", joinLabel: "Зарегистрироваться",
  },
};

// ─── Shared components ────────────────────────────────────────────────────────

function BlueBadge() {
  return (
    <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="7" fill="#1D9BF0" />
      <path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CommentsBlock({
  comment,
  setComment,
  comments,
  onSend,
}: {
  comment: string;
  setComment: (v: string) => void;
  comments: { id: number; author: string; avatarUrl: string; time: string; text: string }[];
  onSend: () => void;
}) {
  const canSend = comment.trim().length > 0;

  return (
    <div
      className="mx-4 mb-6 rounded-[28px] border px-4 pt-[18px] pb-6 text-white"
      style={{
        backgroundColor: "rgba(6,10,18,0.42)",
        borderColor: "rgba(255,255,255,0.2)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      <h3 className="mb-3.5 flex items-center gap-2 text-[15px] font-semibold text-white">
        Комментарии <span className="text-[15px] font-normal text-white/65">{comments.length}</span>
      </h3>
      <div className="mb-[18px] flex items-center gap-2.5">
        <img src={UNSPLASH.userAvatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
        <div className="flex-1 rounded-full px-3.5 py-[9px] flex items-center gap-2" style={{ backgroundColor: "rgba(255,255,255,0.18)" }}>
          <input
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Напишите комментарий..."
            className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/55 outline-none"
          />
          <button
            onClick={onSend}
            disabled={!canSend}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity"
            style={{
              backgroundColor: canSend ? GREEN : "var(--muted)",
              opacity: canSend ? 1 : 0.7,
            }}
          >
            <ChevronRight size={16} strokeWidth={2.3} color={canSend ? "#fff" : "var(--muted-foreground)"} />
          </button>
        </div>
      </div>
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((item) => (
            <div key={item.id} className="flex gap-2.5">
              <img src={item.avatarUrl} alt="" className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="truncate text-[14px] font-medium text-white">{item.author}</p>
                  <span className="text-[12px] text-white/55">{item.time}</span>
                </div>
                <p className="mt-0.5 text-[14px] leading-5 text-white/90">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex justify-center py-8">
          <p className="text-[13px] text-white/60">Пока нет комментариев</p>
        </div>
      )}
    </div>
  );
}

// ─── Collapsible description ──────────────────────────────────────────────────

function CollapsibleText({ paragraphs }: { paragraphs: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const fullText = paragraphs.join(" ");
  // ~4 lines ≈ 300 chars at this font size
  const threshold = 300;
  const needsClamp = fullText.length > threshold;

  return (
    <div>
      <p
        className="text-[14px] text-gray-600 leading-relaxed"
        style={!expanded && needsClamp ? {
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        } : {}}
      >
        {fullText}
      </p>
      {needsClamp && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[14px] font-semibold mt-1"
          style={{ color: GREEN }}
        >
          {expanded ? "Свернуть" : "Подробнее"}
        </button>
      )}
    </div>
  );
}

// ─── Unified EventDetailScreen ────────────────────────────────────────────────

interface EventDetailProps {
  title: string;
  coverSrc?: string;
  backgroundGradient?: string;
  tag?: PlanTag;
  schedule?: Schedule;
  shareUrl?: string;
  participantAvatars?: string[];
  participantsLabel?: string;
  authorName: string;
  authorAvatarUrl: string;
  authorVerified?: boolean;
  readTime?: string;
  badgeDate: string;
  paragraphs: string[];
  meta: EventMeta;
  format?: "online" | "offline";
  duration?: string;
  onBack: () => void;
  initiallyJoined?: boolean;
  onProfile?: () => void;
}

function EventDetailScreen({
  title, coverSrc, backgroundGradient, authorName, authorAvatarUrl, authorVerified,
  readTime, badgeDate, paragraphs, meta, format = "offline", duration, tag, schedule, shareUrl,
  participantAvatars: planParticipantAvatars, participantsLabel, onBack, initiallyJoined, onProfile,
}: EventDetailProps) {
  void authorVerified;
  void readTime;
  void badgeDate;
  const [joined, setJoined] = useState(Boolean(initiallyJoined));
  const [toast, setToast] = useState("");
  const [sheet, setSheet] = useState<"participants" | "profile" | "share" | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<{ id: number; author: string; avatarUrl: string; time: string; text: string }[]>([]);
  const [copied, setCopied] = useState(false);
  const description = paragraphs.join(" ");
  const participantAvatars = planParticipantAvatars?.length ? planParticipantAvatars : DETAIL_AVATARS;
  const organizerAction = onProfile ?? (() => setSheet("profile"));
  const needsDescriptionClamp = description.length > 260;
  const formatLabel = format === "online" ? "Онлайн" : "Офлайн";
  const tagLabel = tag ? PLAN_TAG_LABELS[normalizePlanTag(tag)] : "План";
  const participantCountLabel = participantsLabel ?? `${meta.participants} участников`;
  const overflowLabel = meta.plusN.startsWith("+") ? meta.plusN : "";

  const weekdayLabel = (days: number[]) =>
    days
      .map((day) => ALL_DAYS[WEEKDAY_VALUES.indexOf(day)])
      .filter(Boolean)
      .join(", ");

  const exactDateLabel = (value?: string) => {
    if (!value) return meta.date;
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? meta.date
      : date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  };

  const exactTimeLabel = (start?: string, end?: string) => {
    if (!start) return meta.time;
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;
    const startTime = Number.isNaN(startDate.getTime())
      ? ""
      : startDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const endTime = endDate && !Number.isNaN(endDate.getTime())
      ? endDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
      : "";
    return endTime ? `${startTime} — ${endTime}` : startTime || meta.time;
  };

  const schedulePrimary =
    schedule?.mode === "partOfDay" || schedule?.timeMode === "partOfDay"
      ? `${weekdayLabel(schedule.weekdays) || "Дни не выбраны"} · ${schedule.partOfDay ? PART_OF_DAY_RANGES[schedule.partOfDay].label : "Время суток"}`
      : schedule?.mode === "exact" || schedule?.timeMode === "exact"
        ? exactDateLabel(schedule.start)
        : meta.date;
  const scheduleSecondary =
    schedule?.mode === "exact" || schedule?.timeMode === "exact"
      ? exactTimeLabel(schedule.start, typeof schedule.end === "string" ? schedule.end : undefined)
      : "";

  const showJoinToast = () => {
    setToast("Добавлено в Мои планы");
    window.setTimeout(() => setToast(""), 2200);
  };

  const joinPlan = () => {
    setJoined(true);
    showJoinToast();
  };

  const cancelJoin = () => {
    setJoined(false);
  };

  const toggleJoin = () => {
    if (joined) {
      cancelJoin();
    } else {
      joinPlan();
    }
  };

  const sendComment = () => {
    const text = comment.trim();
    if (!text) return;
    setComments((items) => [
      ...items,
      {
        id: Date.now(),
        author: "Вы",
        avatarUrl: UNSPLASH.userAvatar,
        time: "сейчас",
        text,
      },
    ]);
    setComment("");
  };

  const copyShareLink = async () => {
    await navigator.clipboard?.writeText(shareUrl ?? `https://wellwellwell.app/plans/${encodeURIComponent(title)}`);
    setCopied(true);
  };

  return (
    <div className="relative h-full overflow-hidden bg-card">
      {toast && (
        <div
          className="absolute left-1/2 z-40 -translate-x-1/2 rounded-full px-4 py-2 text-[14px] font-medium text-white shadow-lg"
          style={{ top: "calc(env(safe-area-inset-top) + 14px)", backgroundColor: GREEN }}
        >
          {toast}
        </div>
      )}

      <div className="h-full overflow-y-auto px-6 py-4">
        <div className="relative min-h-[calc(100dvh-32px)] overflow-hidden rounded-[28px] bg-black">
          <div className="absolute inset-0">
            {coverSrc ? (
              <img src={coverSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full" style={{ background: backgroundGradient ?? PLAN_TAG_GRADIENTS.other }} />
            )}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.08) 24%, rgba(0,0,0,0.34) 58%, rgba(0,0,0,0.68) 100%)",
              }}
            />
          </div>

          <button
            onClick={onBack}
            className="absolute left-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 active:opacity-85"
          >
            <ArrowLeft size={20} strokeWidth={2.1} color="#fff" />
          </button>
          <button
            onClick={() => {
              setCopied(false);
              setSheet("share");
            }}
            className="absolute right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 active:opacity-85"
          >
            <Share2 size={18} strokeWidth={2} color="#fff" />
          </button>
          <div className="absolute left-3 top-[62px] z-30 rounded-full bg-black/50 px-3 py-1.5 text-[13px] font-medium text-white">
            {tagLabel}
          </div>

          <div className="relative z-10">
            <div className="flex min-h-[calc(100dvh-32px)] flex-col justify-end px-4 pb-5 pt-[138px]">
              <div className="flex flex-col items-center text-center">
                <FeedAvatarStack avatars={participantAvatars} label={participantCountLabel} />
                <h1
                  className="mt-3 max-w-full text-[30px] font-bold leading-9 text-white"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {title}
                </h1>
              </div>

              <button
                onClick={toggleJoin}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[16px] border border-white/75 bg-white text-[15px] active:opacity-90"
                style={{ color: GREEN, fontWeight: joined ? 500 : 600 }}
              >
                {joined ? <Check size={18} strokeWidth={2.4} color={GREEN} /> : <Plus size={18} strokeWidth={2.3} color={GREEN} />}
                {joined ? "Вы участвуете" : "Присоединиться"}
              </button>

              <div
                className="mt-4 rounded-[28px] border px-4 py-4 text-white"
                style={{
                  backgroundColor: "rgba(6,10,18,0.42)",
                  borderColor: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                }}
              >
            <div className="mb-4 flex items-center justify-between gap-3">
              <button onClick={organizerAction} className="flex min-w-0 items-center gap-2.5 text-left active:opacity-80">
                <img src={authorAvatarUrl} alt={authorName} className="h-9 w-9 flex-shrink-0 rounded-full object-cover" />
                <span className="truncate text-[15px] font-medium text-white">{authorName}</span>
              </button>
              <button
                onClick={() => setSubscribed((value) => !value)}
                className="flex-shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold text-white"
                style={{ borderColor: "rgba(255,255,255,0.52)" }}
              >
                {subscribed ? "Подписан" : "Подписаться"}
              </button>
            </div>

            <div className="mb-4 text-[14px] leading-[1.5] text-white/90">
              <p
                style={!descriptionExpanded && needsDescriptionClamp ? {
                  display: "-webkit-box",
                  WebkitLineClamp: 5,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                } : undefined}
              >
                {description}
              </p>
              {needsDescriptionClamp && (
                <button
                  onClick={() => setDescriptionExpanded((value) => !value)}
                  className="inline text-[14px] font-medium"
                  style={{ color: GREEN }}
                >
                  {descriptionExpanded ? "Свернуть" : "Подробнее"}
                </button>
              )}
            </div>

            <div className="mb-4 h-px bg-white/15" />

            <div className="space-y-3.5 pb-5">
              <div className="flex items-start gap-3">
                <Calendar size={20} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-white/70" />
                <div>
                  <p className="text-[14px] leading-5 text-white">{schedulePrimary}</p>
                  {scheduleSecondary && <p className="text-[13px] leading-4 text-white/65">{scheduleSecondary}</p>}
                </div>
              </div>

              {duration && (
                <div className="flex items-start gap-3">
                  <Clock size={20} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-white/70" />
                  <div>
                    <p className="text-[14px] leading-5 text-white">{duration}</p>
                    <p className="text-[13px] leading-4 text-white/65">Длительность</p>
                  </div>
                </div>
              )}

              {meta.location && (
                <div className="flex items-start gap-3">
                  <MapPin size={20} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-white/70" />
                  <div>
                    <p className="text-[14px] leading-5 text-white">{meta.location}</p>
                    {meta.locationSub && <p className="text-[13px] leading-4 text-white/65">{meta.locationSub}</p>}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Video size={20} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-white/70" />
                <div>
                  <p className="text-[14px] leading-5 text-white">{formatLabel}</p>
                </div>
              </div>

              <button
                onClick={() => setSheet("participants")}
                className="flex w-full items-center justify-between gap-3 text-left active:opacity-85"
              >
                <div className="flex items-center gap-3">
                  <Users size={20} strokeWidth={1.8} className="flex-shrink-0 text-white/70" />
                  <span className="text-[14px] text-white">{meta.participants} участников</span>
                </div>
                <div className="flex items-center">
                  <ParticipantAvatarLine avatars={participantAvatars} />
                  {overflowLabel && (
                    <div className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-white/20">
                      <span className="text-[10px] font-bold text-white">{overflowLabel}</span>
                    </div>
                  )}
                </div>
              </button>
            </div>
              </div>
            </div>
            <CommentsBlock comment={comment} setComment={setComment} comments={comments} onSend={sendComment} />
          </div>
        </div>
      </div>

      {sheet === "participants" && (
        <HomeSheet title="Участники" onClose={() => setSheet(null)}>
          <div className="space-y-2">
            {participantAvatars.map((url, i) => (
              <button key={i} className="w-full rounded-2xl bg-gray-100 px-4 py-3 flex items-center gap-3 text-left">
                <img src={url} alt="" className="w-9 h-9 rounded-full object-cover" />
                <span className="text-[15px] font-medium text-gray-900">Участник {i + 1}</span>
              </button>
            ))}
            <p className="pt-2 text-center text-[13px] text-gray-400">И ещё {meta.plusN} участников</p>
          </div>
        </HomeSheet>
      )}

      {sheet === "share" && (
        <HomeSheet title="Поделиться" onClose={() => setSheet(null)}>
          <button
            onClick={copyShareLink}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white"
            style={{ backgroundColor: GREEN }}
          >
            <Copy size={17} strokeWidth={2.2} />
            {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
          </button>
        </HomeSheet>
      )}

      {sheet === "profile" && (
        <HomeSheet title="Профиль" onClose={() => setSheet(null)}>
          <div className="flex flex-col items-center py-4 text-center">
            <img src={authorAvatarUrl} alt={authorName} className="w-16 h-16 rounded-full object-cover" />
            <p className="mt-3 text-[17px] font-semibold text-gray-900">{authorName}</p>
            <p className="mt-1 text-[14px] text-gray-400">Профиль организатора в работе.</p>
          </div>
        </HomeSheet>
      )}
    </div>
  );
}

// ─── Screen: Plan Detail ──────────────────────────────────────────────────────

function DetailScreen({ onNavigate, backTo }: { onNavigate: (s: Screen) => void; backTo: Screen }) {
  return (
    <EventDetailScreen
      title="Челлендж: Вечерний цифровой детокс"
      coverSrc={challengeImg}
      authorName="Гена Лохтин"
      authorAvatarUrl={UNSPLASH.avatarGena}
      authorVerified
      badgeDate="22 июня 2026"
      paragraphs={articleBodies[3]}
      meta={eventMeta[0]}
      onBack={() => onNavigate(backTo)}
      onProfile={() => onNavigate("profile")}
    />
  );
}

// ─── Screen: Article Detail ───────────────────────────────────────────────────

function ArticleScreen({ article, onBack, onProfile }: { article: Article; onBack: () => void; onProfile?: () => void }) {
  const coverSrc = (article.coverUrl as string) ?? (challengeImg as unknown as string);
  const avatarUrl = article.avatarUrl ?? (UNSPLASH.userAvatar as string);
  return (
    <EventDetailScreen
      title={article.title}
      coverSrc={coverSrc}
      authorName={article.author}
      authorAvatarUrl={avatarUrl}
      authorVerified={article.authorVerified}
      readTime={article.readTime}
      badgeDate="22 июня 2026"
      paragraphs={articleBodies[article.id] ?? [article.excerpt]}
      meta={eventMeta[article.id] ?? eventMeta[1]}
      onBack={onBack}
      onProfile={onProfile}
    />
  );
}

// ─── Screen: Search ────────────────────────────────────────────────────────────

function SearchScreen({ onBack, onArticle }: { onBack: () => void; onArticle: (a: Article) => void }) {
  const [query, setQuery] = useState("");
  const results = query.trim()
    ? articles.filter(a =>
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.author.toLowerCase().includes(query.toLowerCase())
      )
    : articles;

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#F0F1F3" }}>
      <div className="bg-white px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex-shrink-0">
            <ArrowLeft size={22} strokeWidth={2} color="#374151" />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2.5">
            <Search size={16} strokeWidth={1.8} color="#9CA3AF" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Поиск материалов..."
              className="flex-1 text-[15px] bg-transparent outline-none text-gray-800 placeholder-gray-400"
            />
            {query && (
              <button onClick={() => setQuery("")}>
                <X size={15} strokeWidth={2} color="#9CA3AF" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-3 space-y-3">
        {results.map(article => (
          <ArticleCard
            key={article.id}
            article={article}
            onPress={() => onArticle(article)}
          />
        ))}
        {results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Search size={32} strokeWidth={1.5} color="#D1D5DB" />
            <p className="text-[14px] text-gray-400">Ничего не найдено</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Screen: Profile ─────────────────────────────────────────────────────────

const habits = [
  { icon: "🌅", name: "Утренняя зарядка", done: 7, total: 7, streak: 14 },
  { icon: "📖", name: "Чтение 20 минут", done: 5, total: 7, streak: 5 },
  { icon: "🧘", name: "Медитация", done: 4, total: 7, streak: 4 },
  { icon: "📵", name: "Без гаджетов до 9 утра", done: 6, total: 7, streak: 9 },
];

const myEvents = [
  { id: 3, title: "Челлендж: Вечерний детокс", date: "22 июня 2026", cover: cover2 as unknown as string },
  { id: 2, title: "Программа весенней подготовки", date: "5 июля 2026", cover: cover3 as unknown as string },
  { id: 4, title: "Полумарафон", date: "15 сентября 2026", cover: cover1 as unknown as string },
];

const myArticles = [
  { id: 3, title: "Челлендж: Вечерний цифровой детокс", readTime: "8 мин чтения", cover: cover2 as unknown as string },
  { id: 1, title: "Well Well Well — качалка привычек", readTime: "2 мин чтения", cover: cover4 as unknown as string },
];

const subscriptionAvatars = [
  UNSPLASH.avatarMaria,
  UNSPLASH.avatarGena,
  UNSPLASH.avatarDmitry,
  P_AVATARS.w2,
  P_AVATARS.m1,
];

function ProfileCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-4 bg-white rounded-2xl shadow-sm overflow-hidden">
      {children}
    </div>
  );
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2">
      <p className="text-[15px] font-semibold text-gray-900">{title}</p>
      {action && (
        <button onClick={onAction} className="text-[13px] font-medium" style={{ color: GREEN }}>{action}</button>
      )}
    </div>
  );
}

function ProfileScreen(_props: {
  onNavigate: (s: Screen, from?: Screen) => void;
  onArticle: (a: Article) => void;
  onPlanOpen: (id: number) => void;
}) {
  return <WorkInProgress />;
}

function ProfileScreenOld({
  onNavigate,
  onArticle,
  onPlanOpen,
}: {
  onNavigate: (s: Screen, from?: Screen) => void;
  onArticle: (a: Article) => void;
  onPlanOpen: (id: number) => void;
}) {
  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#F0F1F3" }}>
      <div className="flex-1 overflow-y-auto py-4 space-y-3">

        {/* Header card */}
        <ProfileCard>
          <div className="px-4 pt-5 pb-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={UNSPLASH.userAvatar}
                  alt="Аватар"
                  className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                />
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[17px] font-bold text-gray-900">Алина Морозова</span>
                    <BlueBadge />
                  </div>
                  <p className="text-[13px] text-gray-500">Эксперт по сну и восстановлению</p>
                </div>
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>
            </div>
            <button
              className="w-full py-2.5 rounded-xl border-2 text-[14px] font-semibold"
              style={{ borderColor: GREEN, color: GREEN }}
            >
              Редактировать профиль
            </button>
          </div>

          {/* Stats row */}
          <div className="flex border-t border-gray-100">
            {[
              { value: "1 243", label: "подписчика" },
              { value: "47", label: "подписок" },
              { value: "8", label: "привычек" },
            ].map(({ value, label }, i) => (
              <div key={label} className={`flex-1 py-3 flex flex-col items-center ${i < 2 ? "border-r border-gray-100" : ""}`}>
                <span className="text-[18px] font-bold text-gray-900">{value}</span>
                <span className="text-[11px] text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </ProfileCard>

        {/* Habits */}
        <ProfileCard>
          <SectionHeader title="Мои привычки" action="Показать все" onAction={() => onNavigate("plans")} />
          <div className="px-4 pb-4 space-y-3">
            {habits.map((h) => (
              <div key={h.name} className="flex items-center gap-3">
                <span className="text-[20px] w-8 text-center flex-shrink-0">{h.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-medium text-gray-800">{h.name}</span>
                    <span className="text-[11px] font-semibold" style={{ color: GREEN }}>{h.done}/{h.total} дней</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(h.done / h.total) * 100}%`, backgroundColor: GREEN }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <span className="text-[11px]">🔥</span>
                  <span className="text-[11px] font-semibold text-gray-500">{h.streak}</span>
                </div>
              </div>
            ))}
          </div>
        </ProfileCard>

        {/* Activity */}
        <ProfileCard>
          <SectionHeader title="Активность" action="Полная аналитика" />
          <div className="px-4 pb-4 space-y-4">
            <div className="flex gap-3">
              {[
                { value: "12", label: "Планов\nвыполнено", color: GREEN },
                { value: "78%", label: "Выполнено\nза неделю", color: "#F59E0B" },
                { value: "4", label: "Дней\nподряд", color: "#6366F1" },
              ].map(({ value, label, color }) => (
                <div key={label} className="flex-1 rounded-xl py-3 px-2 flex flex-col items-center gap-1" style={{ backgroundColor: color + "12" }}>
                  <span className="text-[20px] font-bold" style={{ color }}>{value}</span>
                  <span className="text-[10px] text-gray-400 text-center leading-tight whitespace-pre-line">{label}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[12px] text-gray-400">Прогресс недели</span>
                <span className="text-[12px] font-semibold" style={{ color: GREEN }}>78%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: "78%", backgroundColor: GREEN }} />
              </div>
            </div>
          </div>
        </ProfileCard>

        {/* My events */}
        <ProfileCard>
          <SectionHeader title="Мои события" action="Все события" />
          <div className="px-4 pb-4 space-y-2">
            {myEvents.map((ev) => (
              <button
                key={ev.id}
                onClick={() => onPlanOpen(ev.id)}
                className="w-full flex items-center gap-3 p-2 rounded-xl active:bg-gray-50 text-left"
              >
                <img src={ev.cover} alt={ev.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-800 truncate">{ev.title}</p>
                  <p className="text-[11px] text-gray-400">{ev.date}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            ))}
          </div>
        </ProfileCard>

        {/* My articles (expert) */}
        <ProfileCard>
          <SectionHeader title="Мои статьи" action="Все материалы" />
          <div className="px-4 pb-4 space-y-2">
            {myArticles.map((art) => {
              const article = articles.find(a => a.id === art.id)!;
              return (
                <button
                  key={art.id}
                  onClick={() => onArticle(article)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl active:bg-gray-50 text-left"
                >
                  <img src={art.cover} alt={art.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-800 line-clamp-2 leading-snug">{art.title}</p>
                    <p className="text-[11px] text-gray-400">{art.readTime}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              );
            })}
          </div>
        </ProfileCard>

        {/* Subscriptions */}
        <ProfileCard>
          <SectionHeader title="Подписки" action="Все подписки" />
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex -space-x-3">
                {subscriptionAvatars.map((url, i) => (
                  <img key={i} src={url} alt="" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                ))}
                <div
                  className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-[11px] font-bold text-white"
                  style={{ backgroundColor: GREEN }}
                >+42</div>
              </div>
              <button className="text-[13px] font-medium" style={{ color: GREEN }}>Смотреть всех</button>
            </div>
          </div>
        </ProfileCard>

        <div className="h-2" />
      </div>
    </div>
  );
}


const NO_BOTTOM_NAV: Screen[] = ["article", "search", "planEvent", "detail"];

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [detailOrigin, setDetailOrigin] = useState<Screen>("plans");
  const [createOrigin, setCreateOrigin] = useState<Screen>("plans");
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [articleOrigin, setArticleOrigin] = useState<Screen>("home");
  const [activePlanId, setActivePlanId] = useState<number>(1);
  const [planEventOrigin, setPlanEventOrigin] = useState<Screen>("plans");
  const [previousScreen, setPreviousScreen] = useState<Screen>("plans");

  const navigate = (s: Screen, from?: Screen) => {
    if (s === "detail" && from) setDetailOrigin(from);
    if (s === "create" && from) setCreateOrigin(from);
    setPreviousScreen(screen);
    setScreen(s);
  };

  const openArticle = (a: Article, from: Screen) => {
    setActiveArticle(a);
    setArticleOrigin(from);
    setScreen("article");
  };

  const openPlanEvent = (id: number, from: Screen = "plans") => {
    setActivePlanId(id);
    setPlanEventOrigin(from);
    setPreviousScreen(screen);
    setScreen("planEvent");
  };

  const renderScreen = () => {
    switch (screen) {
      case "home":
        return <HomeScreen onNavigate={navigate} onPlanOpen={openPlanEvent} />;
      case "plans":
        return <PlansScreen onNavigate={navigate} onPlanOpen={openPlanEvent} />;
      case "create":
        return <CreateScreen onNavigate={navigate} backTo={createOrigin} />;
      case "detail":
        return <DetailScreen onNavigate={navigate} backTo={detailOrigin} />;
      case "article":
        return activeArticle
          ? <ArticleScreen article={activeArticle} onBack={() => setScreen(articleOrigin)} onProfile={() => setScreen("profile")} />
          : null;
      case "search":
        return <SearchScreen onBack={() => setScreen("home")} onArticle={a => openArticle(a, "search")} />;
      case "profile":
        return (
          <ProfileScreen
            onNavigate={navigate}
            onArticle={a => openArticle(a, "profile" as Screen)}
            onPlanOpen={id => { openPlanEvent(id); }}
          />
        );
      case "planEvent": {
        const feedPlan = homeFeedPlans.find(plan => plan.id === activePlanId);
        if (feedPlan) {
          const participantsCount = Number.parseInt(feedPlan.participantsLabel, 10) || feedPlan.participants.length;
          return (
            <EventDetailScreen
              title={feedPlan.isChallenge ? `Челлендж: ${feedPlan.title}` : feedPlan.title}
              coverSrc={feedPlan.coverUrl as string | undefined}
              backgroundGradient={feedPlan.gradient}
              tag={feedPlan.tag}
              schedule={feedPlan.schedule}
              shareUrl={feedPlan.shareUrl}
              participantAvatars={feedPlan.participants}
              participantsLabel={feedPlan.participantsLabel}
              authorName={feedPlan.author.name}
              authorAvatarUrl={feedPlan.author.avatarUrl}
              badgeDate={feedPlan.timeDate}
              paragraphs={[feedPlan.description]}
              meta={{
                date: feedPlan.timeDate,
                time: feedPlan.timeDate,
                location: feedPlan.address ?? "",
                locationSub: "",
                participants: participantsCount,
                plusN: participantsCount > feedPlan.participants.length ? `+${participantsCount - feedPlan.participants.length}` : "",
                joinLabel: "Присоединиться",
              }}
              format={feedPlan.format}
              duration={feedPlan.duration}
              onBack={() => setScreen(planEventOrigin)}
              initiallyJoined={false}
              onProfile={() => setScreen("profile")}
            />
          );
        }
        return <WorkInProgress />;
      }
    }
  };

  const showNav = !NO_BOTTOM_NAV.includes(screen);

  return (
    <div
      className="flex flex-col w-full h-screen overflow-hidden bg-white"
      style={{ fontFamily: "var(--font-sans)", height: "100dvh" }}
    >
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {renderScreen()}
      </div>
      {showNav && (
        <div className="flex-shrink-0 flex items-center justify-around border-t border-gray-200 bg-white px-2 pb-safe pt-2"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
        >
          {([
            { id: "home" as Screen, label: "Главная", Icon: Home },
            { id: "plans" as Screen, label: "Планы", Icon: Calendar },
            { id: "create" as Screen, label: "Создать", Icon: Plus },
            { id: "profile" as Screen, label: "Профиль", Icon: User },
          ] as { id: Screen; label: string; Icon: React.FC<{ size: number; strokeWidth: number; color: string }> }[]).map(({ id, label, Icon }) => {
            const isActive = screen === id || (id === "plans" && (screen === "detail" || screen === "planEvent")) || (id === "home" && screen === "search");
            return (
              <button key={id} onClick={() => navigate(id)} className="flex flex-col items-center gap-0.5 px-4 py-1">
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.7} color={isActive ? GREEN : "#9CA3AF"} />
                <span className="text-[11px] font-medium" style={{ color: isActive ? GREEN : "#9CA3AF" }}>{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
