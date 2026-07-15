import clubDynamoAvatar from "@/imports/club-dynamo-running-avatar.jpg";
import clubLightAvatar from "@/imports/club-light-running-avatar.jpg";
import clubPeakAvatar from "@/imports/club-peak-running-avatar.jpg";
import clubRun01 from "@/imports/club-run-01.jpeg";
import clubRun02 from "@/imports/club-run-02.jpeg";
import clubRun03 from "@/imports/club-run-03.jpeg";
import clubRun04 from "@/imports/club-run-04.jpeg";
import clubRun05 from "@/imports/club-run-05.jpeg";
import clubRun06 from "@/imports/club-run-06.jpeg";
import clubRun07 from "@/imports/club-run-07.jpeg";
import clubRun08 from "@/imports/club-run-08.jpeg";
import clubRun09 from "@/imports/club-run-09.jpeg";
import clubRun10 from "@/imports/club-run-10.jpeg";
import clubRun11 from "@/imports/club-run-11.jpeg";
import clubRun12 from "@/imports/club-run-12.jpeg";
import clubRun13 from "@/imports/club-run-13.jpeg";
import clubRun14 from "@/imports/club-run-14.jpeg";
import clubRun15 from "@/imports/club-run-15.jpeg";
import clubShuAvatar from "@/imports/club-shu-avatar.jpg";
import clubVitalikAvatar from "@/imports/club-vitalik-running-avatar.jpg";
import { demoCommunity, demoCommunityAssets } from "@/app/data/demoCommunity";
import type { ChatPeer, HomeFeedPlan, PlanTag, Schedule } from "@/app/types";

const MOSCOW_OFFSET = "+03:00";
const SHU_JOIN_URL = "https://t.me/shu_run_tracking_bot";
const PEAK_JOIN_URL = "https://t.me/peakmoscow";

type DemoClubPlan = {
  id: string;
  title: string;
  description: string;
  cover: keyof typeof demoClubAssets.covers;
  location: string;
  schedule: Schedule;
  timeDate: string;
  externalJoinUrl?: string;
  level?: "well" | "veryWell" | "tooWell";
  distanceLabel?: string;
  photos?: (keyof typeof demoClubAssets.covers)[];
};

type DemoClub = {
  id: string;
  name: string;
  avatar: keyof typeof demoClubAssets.avatars;
  bio: string;
  isDemo: true;
  disabled?: true;
  tags: string[];
  followerIds: string[];
  plans: DemoClubPlan[];
};

export const demoClubAssets = {
  avatars: {
    "club-shu-avatar.jpg": clubShuAvatar as unknown as string,
    "club-light-running-avatar.jpg": clubLightAvatar as unknown as string,
    "club-peak-running-avatar.jpg": clubPeakAvatar as unknown as string,
    "club-vitalik-running-avatar.jpg": clubVitalikAvatar as unknown as string,
    "club-dynamo-running-avatar.jpg": clubDynamoAvatar as unknown as string,
  },
  covers: {
    "club-run-01.jpeg": clubRun01 as unknown as string,
    "club-run-02.jpeg": clubRun02 as unknown as string,
    "club-run-03.jpeg": clubRun03 as unknown as string,
    "club-run-04.jpeg": clubRun04 as unknown as string,
    "club-run-05.jpeg": clubRun05 as unknown as string,
    "club-run-06.jpeg": clubRun06 as unknown as string,
    "club-run-07.jpeg": clubRun07 as unknown as string,
    "club-run-08.jpeg": clubRun08 as unknown as string,
    "club-run-09.jpeg": clubRun09 as unknown as string,
    "club-run-10.jpeg": clubRun10 as unknown as string,
    "club-run-11.jpeg": clubRun11 as unknown as string,
    "club-run-12.jpeg": clubRun12 as unknown as string,
    "club-run-13.jpeg": clubRun13 as unknown as string,
    "club-run-14.jpeg": clubRun14 as unknown as string,
    "club-run-15.jpeg": clubRun15 as unknown as string,
  },
};

const exactSchedule = (date: string, time: string): Schedule => ({
  mode: "exact",
  timeMode: "exact",
  time,
  partOfDay: null,
  weekdays: [],
  start: `${date}T${time}:00${MOSCOW_OFFSET}`,
  repeat: { type: "none" },
});

const weeklyExactSchedule = (weekday: number, date: string, time: string): Schedule => ({
  mode: "exact",
  timeMode: "exact",
  time,
  partOfDay: null,
  weekdays: [weekday],
  start: `${date}T${time}:00${MOSCOW_OFFSET}`,
  repeat: { type: "weekly" },
});

const shuLongDescription = `Утренняя субботняя пробежка по улицам и набережным города — выбирайте свою дистанцию и темп в зависимости от уровня подготовки. Бежим двумя группами: 21 км в темпе 6:00 и 8 км в темпе 7:00.\n\nРегистрация по [ссылке](${SHU_JOIN_URL})`;
const shuCityDescription = `Совместная пробежка со Skuratov Running club по улицам города, скверам и паркам. Бежим группой 10 км в темпе 6:00-6:30 и 5 км в темпе 7:00.\n\nРегистрация по [ссылке](${SHU_JOIN_URL})`;
const shuStoreAddress = "магазин SHU (Чистопрудный бульвар, 16)";
const shuCoffeeAddress = "Skuratov на Большом Овчинниковском переулке, 16 (ТЦ Аркадия, метро Новокузнецкая)";
const dynamoAddress = "Фан-шоп ФК «Динамо» (ТЦ «Арена Плаза»)";
const dynamoDescription = "Тренировки проходят на свежем воздухе в парке «Динамо». У нас можно переодеться и оставить вещи, а присоединиться — в любой момент, независимо от уровня подготовки. Регистрация не требуется.";

export const demoClubs = {
  clubs: [
    {
      id: "demo-club-01",
      name: "SHU RUN",
      avatar: "club-shu-avatar.jpg",
      isDemo: true,
      tags: ["Бег"],
      followerIds: ["demo-01", "demo-04", "demo-09", "demo-12"],
      bio: "SHU RUN™ — бренд современной технологичной одежды для бега, запущенный в 2023 году как новая линейка бренда SHU. Мы создаем функциональные куртки, тайтсы, шорты, лонгсливы, жилеты и аксессуары, которые разработаны для различных типов тренировок. В год бренд выпускает две коллекции — весенне-летнюю и осенне-зимнюю. Кроме того SHU RUN™ — это беговое сообщество с клубами в Санкт-Петербурге, Москве и Екатеринбурге.",
      plans: [
        { id: "demo-club-plan-01", title: "Длительная пробежка от магазина", description: shuLongDescription, cover: "club-run-01.jpeg", location: shuStoreAddress, schedule: exactSchedule("2026-07-11", "09:00"), timeDate: "11 июля, 09:00", externalJoinUrl: SHU_JOIN_URL },
        { id: "demo-club-plan-02", title: "Городская пробежка от кофейни", description: shuCityDescription, cover: "club-run-02.jpeg", location: shuCoffeeAddress, schedule: exactSchedule("2026-07-15", "19:20"), timeDate: "15 июля, 19:20", externalJoinUrl: SHU_JOIN_URL },
        { id: "demo-club-plan-03", title: "Длительная пробежка от магазина", description: shuLongDescription, cover: "club-run-03.jpeg", location: shuStoreAddress, schedule: exactSchedule("2026-07-18", "09:00"), timeDate: "18 июля, 09:00", externalJoinUrl: SHU_JOIN_URL },
        { id: "demo-club-plan-04", title: "Городская пробежка от кофейни", description: shuCityDescription, cover: "club-run-04.jpeg", location: shuCoffeeAddress, schedule: exactSchedule("2026-07-22", "19:20"), timeDate: "22 июля, 19:20", externalJoinUrl: SHU_JOIN_URL },
        { id: "demo-club-plan-05", title: "Длительная пробежка от магазина", description: shuLongDescription, cover: "club-run-05.jpeg", location: shuStoreAddress, schedule: exactSchedule("2026-07-25", "09:00"), timeDate: "25 июля, 09:00", externalJoinUrl: SHU_JOIN_URL },
        { id: "demo-club-plan-06", title: "Городская пробежка от кофейни", description: shuCityDescription, cover: "club-run-06.jpeg", location: shuCoffeeAddress, schedule: exactSchedule("2026-07-29", "19:20"), timeDate: "29 июля, 19:20", externalJoinUrl: SHU_JOIN_URL },
      ],
    },
    {
      id: "demo-club-02",
      name: "Light Running Club",
      avatar: "club-light-running-avatar.jpg",
      isDemo: true,
      tags: ["Бег"],
      followerIds: ["demo-02", "demo-07", "demo-11"],
      bio: "Вечерние пробежки по городу, где изучаем архитектуру и свет. Проект бюро светового дизайна RAUM",
      plans: [
        { id: "demo-club-plan-07", title: "LIGHT-RUNNING: TRAINING", description: "За руководством пробежки и контролем техники проследит постоянный пейсер проекта — тренер по бегу и триатлет Антон Ионов @ionovanton. Программа 60-минутной тренировки: 20 минут — бег до Лужников; 20 минут — специальные беговые упражнения, направленные на улучшение техники бега (СБУ); 20 минут — бег обратно. Расстояние — 5 км, темп — умеренный.", cover: "club-run-07.jpeg", location: "Rébellion The Palace of Youth, Комсомольский просп., 24, стр. 1", schedule: exactSchedule("2026-07-11", "11:50"), timeDate: "11 июля, 11:50" },
      ],
    },
    {
      id: "demo-club-03",
      name: "Peak Running Club",
      avatar: "club-peak-running-avatar.jpg",
      isDemo: true,
      tags: ["Бег"],
      followerIds: ["demo-03", "demo-06", "demo-09", "demo-10"],
      bio: "Беговой клуб на базе концептуального магазина Peak Moscow. Стараемся создать приятную атмосферу для бегунов с разным уровнем подготовки и сообщество, в котором люди хорошо проводят время. Пробежки проходят каждое воскресенье. Дистанция и темп регулярно меняются, их определяют заранее и анонсируют по четвергам в телеграм-канале магазина.",
      plans: [
        { id: "demo-club-plan-08", title: "Peak running", description: `Дистанция: 5 км / 8 км / 15 км. Темп: 6:30 / 6:00 / 5:30\n\nРегистрация по [ссылке](${PEAK_JOIN_URL})`, cover: "club-run-08.jpeg", location: "PEAK, Петровский бульвар, 8/1", schedule: weeklyExactSchedule(7, "2026-07-12", "09:00"), timeDate: "12 июля, 09:00", externalJoinUrl: PEAK_JOIN_URL },
      ],
    },
    {
      id: "demo-club-04",
      name: "Vitalik Runningclub",
      avatar: "club-vitalik-running-avatar.jpg",
      isDemo: true,
      tags: ["Бег"],
      followerIds: ["demo-01", "demo-05", "demo-08"],
      bio: "Образовалось небольшое сообщество интересующееся бегом людей. Смысл этого всего в том, что здесь любой из участников может организовать забег в любое время, месте, с комфортным темпом и расстоянием. Основные пробежки проходят по субботам, анонсы к ним появляются в ~четверг. Старт в основном от кофейни «Борис Сонный». Здесь нет «главных». Посмотрим, что из этого вырастет, а пока инджой!",
      plans: [
        { id: "demo-club-plan-09", title: "11 июля — бег!", description: "После бега любая суббота лучше. 1 группа: 8-10 км, в темпе 6’30. 2 группа: 5-6 км, в темпе 7’00. Наши субботние пробежки всегда бесплатны, открыты и бережны для всех, кто готов побегать с нами в одном темпе.", cover: "club-run-09.jpeg", location: "Борис Сонный, Селезнёвская ул., 32, Москва", schedule: weeklyExactSchedule(6, "2026-07-11", "10:00"), timeDate: "11 июля, 10:00" },
      ],
    },
    {
      id: "demo-club-05",
      name: "Динамо бежит",
      avatar: "club-dynamo-running-avatar.jpg",
      isDemo: true,
      tags: ["Бег"],
      followerIds: ["demo-02", "demo-04", "demo-06", "demo-12"],
      bio: "Мы объединились, чтобы вместе проводить тренировки, учиться бегать быстро и правильно, а также ставить перед собой новые цели.",
      plans: [
        { id: "demo-club-plan-10", title: "Общая физическая подготовка", description: dynamoDescription, cover: "club-run-10.jpeg", location: dynamoAddress, schedule: exactSchedule("2026-07-11", "10:30"), timeDate: "11 июля, 10:30" },
        { id: "demo-club-plan-11", title: "Интервальный бег", description: dynamoDescription, cover: "club-run-11.jpeg", location: dynamoAddress, schedule: exactSchedule("2026-07-15", "19:30"), timeDate: "15 июля, 19:30" },
        { id: "demo-club-plan-12", title: "Лонгран", description: dynamoDescription, cover: "club-run-12.jpeg", location: dynamoAddress, schedule: exactSchedule("2026-07-19", "10:30"), timeDate: "19 июля, 10:30" },
        { id: "demo-club-plan-13", title: "Интервальный бег", description: dynamoDescription, cover: "club-run-13.jpeg", location: dynamoAddress, schedule: exactSchedule("2026-07-22", "19:30"), timeDate: "22 июля, 19:30" },
        { id: "demo-club-plan-14", title: "Лонгран", description: dynamoDescription, cover: "club-run-14.jpeg", location: dynamoAddress, schedule: exactSchedule("2026-07-26", "10:30"), timeDate: "26 июля, 10:30" },
        { id: "demo-club-plan-15", title: "Интервальный бег", description: dynamoDescription, cover: "club-run-15.jpeg", location: dynamoAddress, schedule: exactSchedule("2026-07-29", "19:30"), timeDate: "29 июля, 19:30" },
      ],
    },
  ],
} as const satisfies { clubs: DemoClub[] };

const clubPlanTrainingMeta: Record<string, Pick<HomeFeedPlan, "level" | "distanceLabel" | "duration">> = {
  "demo-club-plan-01": { level: "tooWell", distanceLabel: "21 км" },
  "demo-club-plan-02": { level: "veryWell", distanceLabel: "10 км" },
  "demo-club-plan-03": { level: "tooWell", distanceLabel: "21 км" },
  "demo-club-plan-04": { level: "veryWell", distanceLabel: "10 км" },
  "demo-club-plan-05": { level: "tooWell", distanceLabel: "21 км" },
  "demo-club-plan-06": { level: "veryWell", distanceLabel: "10 км" },
  "demo-club-plan-07": { level: "veryWell", distanceLabel: "5 км" },
  "demo-club-plan-08": { level: "tooWell", distanceLabel: "15 км" },
  "demo-club-plan-09": { level: "well", distanceLabel: "5 км" },
  "demo-club-plan-10": { level: "veryWell", duration: "60 мин" },
  "demo-club-plan-11": { level: "tooWell", duration: "60 мин" },
  "demo-club-plan-12": { level: "tooWell", distanceLabel: "10 км" },
  "demo-club-plan-13": { level: "tooWell", duration: "60 мин" },
  "demo-club-plan-14": { level: "tooWell", distanceLabel: "10 км" },
  "demo-club-plan-15": { level: "tooWell", duration: "60 мин" },
};

export const demoClubPlans: HomeFeedPlan[] = demoClubs.clubs.flatMap((club) => {
  const avatarUrl = demoClubAssets.avatars[club.avatar];
  const clubPhotos = club.plans.map((item) => item.cover);
  return club.plans.map((plan) => ({
    id: plan.id,
    tag: "running" as PlanTag,
    format: "offline",
    ...clubPlanTrainingMeta[plan.id],
    photos: (plan.photos ?? [...clubPhotos, ...Object.keys(demoClubAssets.covers) as (keyof typeof demoClubAssets.covers)[]].slice(0, 6)).map((photo) => demoClubAssets.covers[photo]),
    title: plan.title,
    description: plan.description,
    habit: { title: club.name, durationMin: 60 },
    coverUrl: demoClubAssets.covers[plan.cover],
    gradient: "linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)",
    schedule: plan.schedule,
    participants: [avatarUrl],
    participantsLabel: "1 чел.",
    timeDate: plan.timeDate,
    address: plan.location,
    author: {
      id: club.id,
      name: club.name,
      avatarUrl,
    },
    externalJoinUrl: plan.externalJoinUrl,
  }));
});

export const activeDemoClubPlans = demoClubPlans.filter((plan) => {
  const club = demoClubs.clubs.find((item) => item.id === plan.author.id);
  return club?.disabled !== true;
});

export const activeDemoClubPlanIds = new Set(activeDemoClubPlans.map((plan) => String(plan.id)));

export const getDemoClubParticipantPeers = (planId: string): ChatPeer[] => {
  const clubId = demoClubs.clubs.find((club) => club.plans.some((plan) => plan.id === planId))?.id;
  if (!clubId) return [];

  const participantIdsByClub: Record<string, readonly string[]> = {
    "demo-club-01": ["demo-01", "demo-02", "demo-03", "demo-04", "demo-05", "demo-06", "demo-07", "demo-08", "demo-09"],
    "demo-club-02": ["demo-02", "demo-04", "demo-06", "demo-08", "demo-10", "demo-12"],
    "demo-club-03": ["demo-01", "demo-03", "demo-05", "demo-07", "demo-09", "demo-11", "demo-12"],
    "demo-club-04": ["demo-02", "demo-05", "demo-07", "demo-10", "demo-11"],
    "demo-club-05": ["demo-01", "demo-02", "demo-03", "demo-04", "demo-05", "demo-06", "demo-07", "demo-08", "demo-09", "demo-10"],
  };

  return (participantIdsByClub[clubId] ?? [])
    .map((id) => demoCommunity.people.find((person) => person.id === id))
    .filter((person): person is typeof demoCommunity.people[number] => Boolean(person))
    .map((person) => ({
      id: person.id,
      name: person.name,
      avatarUrl: demoCommunityAssets.avatars[person.avatar],
      isDemo: true,
    }));
};
