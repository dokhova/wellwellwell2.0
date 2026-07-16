import clubAsset1 from "@/imports/clubs/SHU RUN_Avatar.jpg";
import clubAsset2 from "@/imports/clubs/Peak Runing Club_Avatar.jpg";
import clubAsset3 from "@/imports/clubs/Vitalik Runningclub_Avatar.jpg";
import clubAsset4 from "@/imports/clubs/S95_Avatar.jpg";
import clubAsset5 from "@/imports/clubs/i_love_running_Avatar.jpg";
import clubAsset6 from "@/imports/clubs/yoga_dom_Avatar.jpg";
import clubAsset7 from "@/imports/clubs/begaesh_kak_devchonka_Avatar.jpg";
import clubAsset8 from "@/imports/clubs/DDX_Fintes_Avatar.jpg";
import clubAsset9 from "@/imports/clubs/tsFitness_Avatar.jpg";
import clubAsset10 from "@/imports/clubs/yo_boddy_fitness_Avatar.jpg";
import clubAsset11 from "@/imports/clubs/neverlate_Avatar.jpg";
import clubAsset12 from "@/imports/clubs/SMSTRETCHING_Avatar.jpg";
import clubAsset13 from "@/imports/clubs/yoga_space_Avatar.jpg";
import clubAsset14 from "@/imports/clubs/Run2.jpeg";
import clubAsset15 from "@/imports/clubs/Run3.jpeg";
import clubAsset16 from "@/imports/clubs/Run4.jpeg";
import clubAsset17 from "@/imports/clubs/Run5.jpeg";
import clubAsset18 from "@/imports/clubs/Run6.jpeg";
import clubAsset19 from "@/imports/clubs/Run8.jpeg";
import clubAsset20 from "@/imports/clubs/Run9.jpeg";
import clubAsset21 from "@/imports/clubs/Run10.jpeg";
import clubAsset22 from "@/imports/clubs/Run11.jpeg";
import clubAsset23 from "@/imports/clubs/Run12.jpeg";
import clubAsset24 from "@/imports/clubs/Run13.jpeg";
import clubAsset25 from "@/imports/clubs/Run14.jpeg";
import clubAsset26 from "@/imports/clubs/Run15.jpeg";
import clubAsset27 from "@/imports/clubs/Run16.jpeg";
import clubAsset28 from "@/imports/clubs/Run17.jpeg";
import clubAsset29 from "@/imports/clubs/Run18.jpeg";
import clubAsset30 from "@/imports/clubs/run28.jpeg";
import clubAsset31 from "@/imports/clubs/run29.jpeg";
import clubAsset32 from "@/imports/clubs/yoga1.jpeg";
import clubAsset33 from "@/imports/clubs/yoga2.jpeg";
import clubAsset34 from "@/imports/clubs/yoga3.jpeg";
import clubAsset35 from "@/imports/clubs/yoga4.jpeg";
import clubAsset36 from "@/imports/clubs/yoga5.jpeg";
import clubAsset37 from "@/imports/clubs/yoga6.jpeg";
import clubAsset38 from "@/imports/clubs/yoga7.jpeg";
import clubAsset39 from "@/imports/clubs/yoga8.jpeg";
import clubAsset40 from "@/imports/clubs/yoga9.jpeg";
import clubAsset41 from "@/imports/clubs/yoga10.jpeg";
import clubAsset42 from "@/imports/clubs/yoga11.jpeg";
import clubAsset43 from "@/imports/clubs/yoga12.jpeg";
import clubAsset44 from "@/imports/clubs/yoga13.jpeg";
import clubAsset45 from "@/imports/clubs/yoga14.jpeg";
import clubAsset46 from "@/imports/clubs/yoga15.jpeg";
import clubAsset47 from "@/imports/clubs/yoga16.jpeg";
import clubAsset48 from "@/imports/clubs/yoga17.jpeg";
import clubAsset49 from "@/imports/clubs/yoga18.jpeg";
import clubAsset50 from "@/imports/clubs/yoga19.jpeg";
import clubAsset51 from "@/imports/clubs/yoga20.jpeg";
import clubAsset52 from "@/imports/clubs/run31.jpeg";
import clubAsset53 from "@/imports/clubs/fitnes1.jpeg";
import clubAsset54 from "@/imports/clubs/fitnes2.jpeg";
import clubAsset55 from "@/imports/clubs/fitnes3.jpeg";
import clubAsset56 from "@/imports/clubs/fitnes4.jpeg";
import clubAsset57 from "@/imports/clubs/fitnes5.jpeg";
import clubAsset58 from "@/imports/clubs/fitnes6.jpeg";
import clubAsset59 from "@/imports/clubs/fitnes7.jpeg";
import clubAsset60 from "@/imports/clubs/fitnes8.jpeg";
import clubAsset61 from "@/imports/clubs/fitnes9.jpeg";
import clubAsset62 from "@/imports/clubs/fitnes10.jpeg";
import clubAsset63 from "@/imports/clubs/fitnes11.jpeg";
import clubAsset64 from "@/imports/clubs/stretch1.jpg";
import clubAsset65 from "@/imports/clubs/yoga21.jpeg";
import clubAsset66 from "@/imports/clubs/yoga22.jpeg";
import clubAsset67 from "@/imports/clubs/yoga23.jpeg";
import clubAsset68 from "@/imports/clubs/yoga24.jpeg";
import clubAsset69 from "@/imports/clubs/yoga25.jpeg";
import { demoCommunity, demoCommunityAssets } from "@/app/data/demoCommunity";
import type { ChatPeer, HomeFeedPlan, PlanTag, Schedule } from "@/app/types";

const MOSCOW_OFFSET = "+03:00";

type DemoClubPlan = {
  id: string;
  title: string;
  description: string;
  cover: keyof typeof demoClubAssets.covers;
  location: string;
  schedule: Schedule;
  timeDate: string;
  tag: PlanTag;
  externalJoinUrl: string;
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
    "SHU RUN_Avatar.jpg": clubAsset1 as unknown as string,
    "Peak Runing Club_Avatar.jpg": clubAsset2 as unknown as string,
    "Vitalik Runningclub_Avatar.jpg": clubAsset3 as unknown as string,
    "S95_Avatar.jpg": clubAsset4 as unknown as string,
    "i_love_running_Avatar.jpg": clubAsset5 as unknown as string,
    "yoga_dom_Avatar.jpg": clubAsset6 as unknown as string,
    "begaesh_kak_devchonka_Avatar.jpg": clubAsset7 as unknown as string,
    "DDX_Fintes_Avatar.jpg": clubAsset8 as unknown as string,
    "tsFitness_Avatar.jpg": clubAsset9 as unknown as string,
    "yo_boddy_fitness_Avatar.jpg": clubAsset10 as unknown as string,
    "neverlate_Avatar.jpg": clubAsset11 as unknown as string,
    "SMSTRETCHING_Avatar.jpg": clubAsset12 as unknown as string,
    "yoga_space_Avatar.jpg": clubAsset13 as unknown as string,
  },
  covers: {
    "Run2.jpeg": clubAsset14 as unknown as string,
    "Run3.jpeg": clubAsset15 as unknown as string,
    "Run4.jpeg": clubAsset16 as unknown as string,
    "Run5.jpeg": clubAsset17 as unknown as string,
    "Run6.jpeg": clubAsset18 as unknown as string,
    "Run8.jpeg": clubAsset19 as unknown as string,
    "Run9.jpeg": clubAsset20 as unknown as string,
    "Run10.jpeg": clubAsset21 as unknown as string,
    "Run11.jpeg": clubAsset22 as unknown as string,
    "Run12.jpeg": clubAsset23 as unknown as string,
    "Run13.jpeg": clubAsset24 as unknown as string,
    "Run14.jpeg": clubAsset25 as unknown as string,
    "Run15.jpeg": clubAsset26 as unknown as string,
    "Run16.jpeg": clubAsset27 as unknown as string,
    "Run17.jpeg": clubAsset28 as unknown as string,
    "Run18.jpeg": clubAsset29 as unknown as string,
    "run28.jpeg": clubAsset30 as unknown as string,
    "run29.jpeg": clubAsset31 as unknown as string,
    "yoga1.jpeg": clubAsset32 as unknown as string,
    "yoga2.jpeg": clubAsset33 as unknown as string,
    "yoga3.jpeg": clubAsset34 as unknown as string,
    "yoga4.jpeg": clubAsset35 as unknown as string,
    "yoga5.jpeg": clubAsset36 as unknown as string,
    "yoga6.jpeg": clubAsset37 as unknown as string,
    "yoga7.jpeg": clubAsset38 as unknown as string,
    "yoga8.jpeg": clubAsset39 as unknown as string,
    "yoga9.jpeg": clubAsset40 as unknown as string,
    "yoga10.jpeg": clubAsset41 as unknown as string,
    "yoga11.jpeg": clubAsset42 as unknown as string,
    "yoga12.jpeg": clubAsset43 as unknown as string,
    "yoga13.jpeg": clubAsset44 as unknown as string,
    "yoga14.jpeg": clubAsset45 as unknown as string,
    "yoga15.jpeg": clubAsset46 as unknown as string,
    "yoga16.jpeg": clubAsset47 as unknown as string,
    "yoga17.jpeg": clubAsset48 as unknown as string,
    "yoga18.jpeg": clubAsset49 as unknown as string,
    "yoga19.jpeg": clubAsset50 as unknown as string,
    "yoga20.jpeg": clubAsset51 as unknown as string,
    "run31.jpeg": clubAsset52 as unknown as string,
    "fitnes1.jpeg": clubAsset53 as unknown as string,
    "fitnes2.jpeg": clubAsset54 as unknown as string,
    "fitnes3.jpeg": clubAsset55 as unknown as string,
    "fitnes4.jpeg": clubAsset56 as unknown as string,
    "fitnes5.jpeg": clubAsset57 as unknown as string,
    "fitnes6.jpeg": clubAsset58 as unknown as string,
    "fitnes7.jpeg": clubAsset59 as unknown as string,
    "fitnes8.jpeg": clubAsset60 as unknown as string,
    "fitnes9.jpeg": clubAsset61 as unknown as string,
    "fitnes10.jpeg": clubAsset62 as unknown as string,
    "fitnes11.jpeg": clubAsset63 as unknown as string,
    "stretch1.jpg": clubAsset64 as unknown as string,
    "yoga21.jpeg": clubAsset65 as unknown as string,
    "yoga22.jpeg": clubAsset66 as unknown as string,
    "yoga23.jpeg": clubAsset67 as unknown as string,
    "yoga24.jpeg": clubAsset68 as unknown as string,
    "yoga25.jpeg": clubAsset69 as unknown as string,
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

export const demoClubs = {
  clubs: [
    {
      id: "demo-club-01",
      name: "SHU RUN",
      avatar: "SHU RUN_Avatar.jpg",
      isDemo: true,
      tags: ["Бег"],
      followerIds: ["demo-01","demo-02","demo-03"],
      bio: "SHU RUN — бренд современной технологичной одежды для бега, запущенный в 2023 году как новая линейка бренда SHU. Мы создаем функциональные куртки, тайтсы, шорты, лонгсливы, жилеты и аксессуары для разных типов тренировок. В год выходят две коллекции: весенне-летняя и осенне-зимняя. Кроме того, SHU RUN — это беговое сообщество с клубами в Санкт-Петербурге, Москве и Екатеринбурге.",
      plans: [
        {
          id: "demo-club-plan-01",
          title: "Городская пробежка от кофейни",
          description: "Совместная пробежка со Skuratov Running Club по улицам города, скверам и паркам. Бежим группой: 10 км в темпе 6:00–6:30 и 5 км в темпе 7:00. Регистрация по [ссылке](https://t.me/shu_run_tracking_bot)",
          cover: "Run2.jpeg",
          location: "Кофейня Skuratov, Большой Овчинниковский переулок, 16 (ТЦ «Аркадия», метро «Новокузнецкая»)",
          schedule: exactSchedule("2026-07-15", "19:20"),
          timeDate: "15 июля, 19:20",
          tag: "running",
          externalJoinUrl: "https://t.me/shu_run_tracking_bot",
        },
        {
          id: "demo-club-plan-02",
          title: "Длительная пробежка от магазина",
          description: "Утренняя субботняя пробежка по улицам и набережным города. Выбирайте свою дистанцию и темп в зависимости от уровня подготовки: бежим двумя группами, 21 км в темпе 6:00 и 8 км в темпе 7:00. Регистрация по [ссылке](https://t.me/shu_run_tracking_bot)",
          cover: "Run3.jpeg",
          location: "Магазин SHU, Чистопрудный бульвар, 16",
          schedule: exactSchedule("2026-07-18", "09:00"),
          timeDate: "18 июля, 09:00",
          tag: "running",
          externalJoinUrl: "https://t.me/shu_run_tracking_bot",
        },
        {
          id: "demo-club-plan-03",
          title: "Городская пробежка от кофейни",
          description: "Совместная пробежка со Skuratov Running Club по улицам города, скверам и паркам. Бежим группой: 10 км в темпе 6:00–6:30 и 5 км в темпе 7:00. Регистрация по [ссылке](https://t.me/shu_run_tracking_bot)",
          cover: "Run4.jpeg",
          location: "Кофейня Skuratov, Большой Овчинниковский переулок, 16 (ТЦ «Аркадия», метро «Новокузнецкая»)",
          schedule: exactSchedule("2026-07-22", "19:20"),
          timeDate: "22 июля, 19:20",
          tag: "running",
          externalJoinUrl: "https://t.me/shu_run_tracking_bot",
        },
        {
          id: "demo-club-plan-04",
          title: "Длительная пробежка от магазина",
          description: "Утренняя субботняя пробежка по улицам и набережным города. Выбирайте свою дистанцию и темп в зависимости от уровня подготовки: бежим двумя группами, 21 км в темпе 6:00 и 8 км в темпе 7:00. Регистрация по [ссылке](https://t.me/shu_run_tracking_bot)",
          cover: "Run5.jpeg",
          location: "Магазин SHU, Чистопрудный бульвар, 16",
          schedule: exactSchedule("2026-07-25", "09:00"),
          timeDate: "25 июля, 09:00",
          tag: "running",
          externalJoinUrl: "https://t.me/shu_run_tracking_bot",
        },
        {
          id: "demo-club-plan-05",
          title: "Городская пробежка от кофейни",
          description: "Совместная пробежка со Skuratov Running Club по улицам города, скверам и паркам. Бежим группой: 10 км в темпе 6:00–6:30 и 5 км в темпе 7:00. Регистрация по [ссылке](https://t.me/shu_run_tracking_bot)",
          cover: "Run6.jpeg",
          location: "Кофейня Skuratov, Большой Овчинниковский переулок, 16 (ТЦ «Аркадия», метро «Новокузнецкая»)",
          schedule: exactSchedule("2026-07-29", "19:20"),
          timeDate: "29 июля, 19:20",
          tag: "running",
          externalJoinUrl: "https://t.me/shu_run_tracking_bot",
        },
      ],
    },
    {
      id: "demo-club-02",
      name: "Peak Running Club",
      avatar: "Peak Runing Club_Avatar.jpg",
      isDemo: true,
      tags: ["Бег"],
      followerIds: ["demo-04","demo-05","demo-06","demo-07"],
      bio: "Беговой клуб на базе концептуального магазина Peak Moscow. Создаем приятную атмосферу для бегунов с разным уровнем подготовки и сообщество, в котором люди хорошо проводят время. Пробежки проходят каждое воскресенье. Дистанция и темп регулярно меняются, их объявляют по четвергам в телеграм-канале магазина.",
      plans: [
        {
          id: "demo-club-plan-06",
          title: "Воскресная пробежка Peak",
          description: "Воскресная пробежка клуба. Дистанция 5, 8 или 15 км, темп 6:30, 6:00 или 5:30. Точную дистанцию и темп объявляют по четвергам в телеграм-канале магазина. Регистрация по [ссылке](https://t.me/peakmoscow)",
          cover: "Run8.jpeg",
          location: "PEAK, Петровский бульвар, 8/1",
          schedule: exactSchedule("2026-07-19", "09:00"),
          timeDate: "19 июля, 09:00",
          tag: "running",
          externalJoinUrl: "https://t.me/peakmoscow",
        },
        {
          id: "demo-club-plan-07",
          title: "Воскресная пробежка Peak",
          description: "Воскресная пробежка клуба. Дистанция 5, 8 или 15 км, темп 6:30, 6:00 или 5:30. Точную дистанцию и темп объявляют по четвергам в телеграм-канале магазина. Регистрация по [ссылке](https://t.me/peakmoscow)",
          cover: "Run9.jpeg",
          location: "PEAK, Петровский бульвар, 8/1",
          schedule: exactSchedule("2026-07-26", "09:00"),
          timeDate: "26 июля, 09:00",
          tag: "running",
          externalJoinUrl: "https://t.me/peakmoscow",
        },
      ],
    },
    {
      id: "demo-club-03",
      name: "Vitalik Runningclub",
      avatar: "Vitalik Runningclub_Avatar.jpg",
      isDemo: true,
      tags: ["Бег","Тренировка"],
      followerIds: ["demo-07","demo-08","demo-09"],
      bio: "Небольшое сообщество интересующихся бегом людей. Смысл в том, что любой участник может организовать забег в удобное время и месте, с комфортным темпом и расстоянием. Основные пробежки проходят по субботам, анонсы появляются примерно в четверг. Старт обычно от кофейни «Борис Сонный». Здесь нет главных. Посмотрим, что из этого вырастет, а пока инджой!",
      plans: [
        {
          id: "demo-club-plan-08",
          title: "Субботняя пробежка",
          description: "После бега любая суббота лучше. Бежим двумя группами: 8–10 км в темпе 6:30 и 5–6 км в темпе 7:00. Наши субботние пробежки всегда бесплатны, открыты и бережны для всех, кто готов побегать с нами в одном темпе.",
          cover: "Run10.jpeg",
          location: "Кофейня «Борис Сонный», Селезнёвская ул., 32",
          schedule: exactSchedule("2026-07-18", "10:00"),
          timeDate: "18 июля, 10:00",
          tag: "running",
          externalJoinUrl: "https://t.me/vitalikrc",
        },
        {
          id: "demo-club-plan-09",
          title: "Субботняя пробежка",
          description: "После бега любая суббота лучше. Бежим двумя группами: 8–10 км в темпе 6:30 и 5–6 км в темпе 7:00. Наши субботние пробежки всегда бесплатны, открыты и бережны для всех, кто готов побегать с нами в одном темпе.",
          cover: "Run11.jpeg",
          location: "Кофейня «Борис Сонный», Селезнёвская ул., 32",
          schedule: exactSchedule("2026-07-25", "10:00"),
          timeDate: "25 июля, 10:00",
          tag: "running",
          externalJoinUrl: "https://t.me/vitalikrc",
        },
        {
          id: "demo-club-plan-10",
          title: "Интервальная тренировка",
          description: "Интервальная беговая тренировка: работаем над скоростью короткими отрезками с восстановлением. Подходит для любого уровня подготовки, регистрация не требуется.",
          cover: "Run12.jpeg",
          location: "Фан-шоп ФК «Динамо», ТЦ «Арена Плаза» (парк «Динамо»)",
          schedule: exactSchedule("2026-07-15", "19:30"),
          timeDate: "15 июля, 19:30",
          tag: "running",
          externalJoinUrl: "https://t.me/vitalikrc",
        },
        {
          id: "demo-club-plan-11",
          title: "Лонгран",
          description: "Совместный лонгран в спокойном темпе: длительная пробежка для развития выносливости. Присоединиться можно независимо от уровня подготовки, регистрация не требуется.",
          cover: "Run13.jpeg",
          location: "Фан-шоп ФК «Динамо», ТЦ «Арена Плаза» (парк «Динамо»)",
          schedule: exactSchedule("2026-07-19", "10:30"),
          timeDate: "19 июля, 10:30",
          tag: "running",
          externalJoinUrl: "https://t.me/vitalikrc",
        },
        {
          id: "demo-club-plan-12",
          title: "Интервальная тренировка",
          description: "Интервальная беговая тренировка: работаем над скоростью короткими отрезками с восстановлением. Подходит для любого уровня подготовки, регистрация не требуется.",
          cover: "Run14.jpeg",
          location: "Фан-шоп ФК «Динамо», ТЦ «Арена Плаза» (парк «Динамо»)",
          schedule: exactSchedule("2026-07-22", "19:30"),
          timeDate: "22 июля, 19:30",
          tag: "running",
          externalJoinUrl: "https://t.me/vitalikrc",
        },
        {
          id: "demo-club-plan-13",
          title: "Лонгран",
          description: "Совместный лонгран в спокойном темпе: длительная пробежка для развития выносливости. Присоединиться можно независимо от уровня подготовки, регистрация не требуется.",
          cover: "Run15.jpeg",
          location: "Фан-шоп ФК «Динамо», ТЦ «Арена Плаза» (парк «Динамо»)",
          schedule: exactSchedule("2026-07-26", "10:30"),
          timeDate: "26 июля, 10:30",
          tag: "running",
          externalJoinUrl: "https://t.me/vitalikrc",
        },
        {
          id: "demo-club-plan-14",
          title: "Интервальная тренировка",
          description: "Интервальная беговая тренировка: работаем над скоростью короткими отрезками с восстановлением. Подходит для любого уровня подготовки, регистрация не требуется.",
          cover: "Run16.jpeg",
          location: "Фан-шоп ФК «Динамо», ТЦ «Арена Плаза» (парк «Динамо»)",
          schedule: exactSchedule("2026-07-29", "19:30"),
          timeDate: "29 июля, 19:30",
          tag: "running",
          externalJoinUrl: "https://t.me/vitalikrc",
        },
      ],
    },
    {
      id: "demo-club-04",
      name: "S95",
      avatar: "S95_Avatar.jpg",
      isDemo: true,
      tags: ["Бег"],
      followerIds: ["demo-10","demo-11","demo-12","demo-01"],
      bio: "Система независимых парковых забегов. Сделана бегунами для бегунов. Суббота, 9 утра, 5 км: бесплатные забеги в парках Москвы и других городов, куда можно прийти с семьей, друзьями и питомцами.",
      plans: [
        {
          id: "demo-club-plan-15",
          title: "Парковый забег 5 км",
          description: "Субботний парковый забег на 5 км. Дистанцию можно пробежать, пройти пешком или помочь волонтером — рады всем независимо от возраста и уровня подготовки. Можно участвовать с семьей, друзьями и питомцами, а после забега пообщаться за чаепитием. Регистрация по [ссылке](https://s95.ru/user/sign_up)",
          cover: "Run17.jpeg",
          location: "Парки Москвы: ЗИЛ, Измайлово, Кузьминки, Царицыно, Олимпийская деревня и другие (полный список локаций на s95.ru)",
          schedule: exactSchedule("2026-07-18", "09:00"),
          timeDate: "18 июля, 09:00",
          tag: "running",
          externalJoinUrl: "https://s95.ru/user/sign_up",
        },
        {
          id: "demo-club-plan-16",
          title: "Парковый забег 5 км",
          description: "Субботний парковый забег на 5 км. Дистанцию можно пробежать, пройти пешком или помочь волонтером — рады всем независимо от возраста и уровня подготовки. Можно участвовать с семьей, друзьями и питомцами, а после забега пообщаться за чаепитием. Регистрация по [ссылке](https://s95.ru/user/sign_up)",
          cover: "Run18.jpeg",
          location: "Парки Москвы: ЗИЛ, Измайлово, Кузьминки, Царицыно, Олимпийская деревня и другие (полный список локаций на s95.ru)",
          schedule: exactSchedule("2026-07-25", "09:00"),
          timeDate: "25 июля, 09:00",
          tag: "running",
          externalJoinUrl: "https://s95.ru/user/sign_up",
        },
      ],
    },
    {
      id: "demo-club-05",
      name: "I Love Running",
      avatar: "i_love_running_Avatar.jpg",
      isDemo: true,
      tags: ["Бег"],
      followerIds: ["demo-01","demo-02","demo-03"],
      bio: "Начните бегать легко и с удовольствием! Новичкам поставим технику бега и поможем комфортно пробежать первые километры, а любителей подготовим к топовым забегам по всему миру.",
      plans: [
        {
          id: "demo-club-plan-25",
          title: "Коферан",
          description: "Коферан — групповая беговая тренировка в комфортном темпе, в конце которой можно поболтать за кружкой кофе. Собираемся, чтобы пробежаться по красивым набережным Москвы утром выходного дня: без спешки, гонки и страданий. С группой бежит пейсмейкер, маршрут кольцевой, сбор в 08:45. В июле участие бесплатное для всех по промокоду SUPERJULY.",
          cover: "run28.jpeg",
          location: "Кафе «Лу» в Лужниках, ул. Лужники, 24, стр. 61 (метро «Воробьевы горы»)",
          schedule: exactSchedule("2026-07-19", "09:00"),
          timeDate: "19 июля, 09:00",
          tag: "running",
          externalJoinUrl: "https://ilovesupersport.ru/running/coffee-run",
        },
        {
          id: "demo-club-plan-26",
          title: "Коферан",
          description: "Коферан — групповая беговая тренировка в комфортном темпе, в конце которой можно поболтать за кружкой кофе. Собираемся, чтобы пробежаться по красивым набережным Москвы утром выходного дня: без спешки, гонки и страданий. С группой бежит пейсмейкер, маршрут кольцевой, сбор в 08:45. В июле участие бесплатное для всех по промокоду SUPERJULY.",
          cover: "run29.jpeg",
          location: "Кафе «Лу» в Лужниках, ул. Лужники, 24, стр. 61 (метро «Воробьевы горы»)",
          schedule: exactSchedule("2026-07-26", "09:00"),
          timeDate: "26 июля, 09:00",
          tag: "running",
          externalJoinUrl: "https://ilovesupersport.ru/running/coffee-run",
        },
      ],
    },
    {
      id: "demo-club-06",
      name: "ЙогаДом",
      avatar: "yoga_dom_Avatar.jpg",
      isDemo: true,
      tags: ["Йога","Медитация","Для девушек"],
      followerIds: ["demo-04","demo-05","demo-06","demo-07"],
      bio: "Студия йоги и медитации. Студия-легенда, где с 2008 года практикуют не потому, что это модно, а потому что это работает.",
      plans: [
        {
          id: "demo-club-plan-27",
          title: "Аштанга йога. Майсор-класс",
          description: "Аштанга йога. Майсор-класс с преподавателем студии ЙогаДом (Наташа Савина). Уровень: все уровни. Стоимость 1500 ₽, запись через YClients студии.",
          cover: "yoga1.jpeg",
          location: "Петровский пер., 1/30с1, Москва м. Чеховская | м. Пушкинская",
          schedule: exactSchedule("2026-07-15", "06:30"),
          timeDate: "15 июля, 06:30–09:30",
          tag: "yoga",
          externalJoinUrl: "https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-14",
        },
        {
          id: "demo-club-plan-28",
          title: "Хатха-йога",
          description: "Хатха-йога с преподавателем студии ЙогаДом (Анастасия Барабанова). Уровень: все уровни. Стоимость 1800 ₽, запись через YClients студии по [ссылке](https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-15)",
          cover: "yoga2.jpeg",
          location: "Петровский пер., 1/30с1, Москва м. Чеховская | м. Пушкинская",
          schedule: exactSchedule("2026-07-15", "18:15"),
          timeDate: "15 июля, 18:15–19:45",
          tag: "yoga",
          externalJoinUrl: "https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-15",
        },
        {
          id: "demo-club-plan-29",
          title: "Йога под открытым небом на Тверском бульваре",
          description: "Бесплатная практика под открытым небом от студии ЙогаДом. Регистрация обязательна, открывается за 5 дней до практики в YClients, анонсы в сторис и телеграм-канале студии. Ведет Яна Танас. Уровень: все уровни.",
          cover: "yoga3.jpeg",
          location: "Тверской бульвар",
          schedule: exactSchedule("2026-07-15", "19:00"),
          timeDate: "15 июля, 19:00–20:30",
          tag: "yoga",
          externalJoinUrl: "https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-16",
        },
        {
          id: "demo-club-plan-30",
          title: "Хатха-йога и медитация",
          description: "Хатха-йога и медитация с преподавателем студии ЙогаДом (Артем Сагателян). Уровень: все уровни. Стоимость 1800 ₽, запись через YClients студии по [ссылке](https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-17)",
          cover: "yoga4.jpeg",
          location: "Петровский пер., 1/30с1, Москва м. Чеховская | м. Пушкинская",
          schedule: exactSchedule("2026-07-15", "19:45"),
          timeDate: "15 июля, 19:45–21:15",
          tag: "yoga",
          externalJoinUrl: "https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-17",
        },
        {
          id: "demo-club-plan-31",
          title: "Аштанга йога. Майсор-класс",
          description: "Аштанга йога. Майсор-класс с преподавателем студии ЙогаДом (Наташа Савина). Уровень: все уровни. Стоимость 1500 ₽, запись через YClients студии по [ссылке](https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-18)",
          cover: "yoga5.jpeg",
          location: "Петровский пер., 1/30с1, Москва м. Чеховская | м. Пушкинская",
          schedule: exactSchedule("2026-07-16", "06:30"),
          timeDate: "16 июля, 06:30–09:30",
          tag: "yoga",
          externalJoinUrl: "https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-18",
        },
        {
          id: "demo-club-plan-32",
          title: "Силовая йога",
          description: "Силовая йога с преподавателем студии ЙогаДом (Мария Колесник). Уровень: все уровни. Стоимость 1800 ₽, запись через YClients студии по [ссылке](https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-19)",
          cover: "yoga6.jpeg",
          location: "Петровский пер., 1/30с1, Москва м. Чеховская | м. Пушкинская",
          schedule: exactSchedule("2026-07-16", "18:45"),
          timeDate: "16 июля, 18:45–20:15",
          tag: "yoga",
          externalJoinUrl: "https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-19",
        },
        {
          id: "demo-club-plan-33",
          title: "Хатха-йога",
          description: "Хатха-йога с преподавателем студии ЙогаДом (Татьяна Мещерякова). Уровень: все уровни. Стоимость 1800 ₽, запись через YClients студии по [ссылке](https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-20)",
          cover: "yoga7.jpeg",
          location: "Петровский пер., 1/30с1, Москва м. Чеховская | м. Пушкинская",
          schedule: exactSchedule("2026-07-16", "18:45"),
          timeDate: "16 июля, 18:45–20:15",
          tag: "yoga",
          externalJoinUrl: "https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-20",
        },
        {
          id: "demo-club-plan-34",
          title: "Виньяса-йога",
          description: "Виньяса-йога с преподавателем студии ЙогаДом (Дарья Ди Сойфер). Уровень: все уровни. Стоимость 1800 ₽, запись через YClients студии по [ссылке](https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-21)",
          cover: "yoga8.jpeg",
          location: "Петровский пер., 1/30с1, Москва м. Чеховская | м. Пушкинская",
          schedule: exactSchedule("2026-07-16", "20:15"),
          timeDate: "16 июля, 20:15–22:00",
          tag: "yoga",
          externalJoinUrl: "https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-21",
        },
        {
          id: "demo-club-plan-35",
          title: "Хатха-йога",
          description: "Хатха-йога с преподавателем студии ЙогаДом (Илья Азуевский). Уровень: легкий уровень. Стоимость 1800 ₽, запись через YClients студии по [ссылке](https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-22)",
          cover: "yoga9.jpeg",
          location: "Петровский пер., 1/30с1, Москва м. Чеховская | м. Пушкинская",
          schedule: exactSchedule("2026-07-16", "20:15"),
          timeDate: "16 июля, 20:15–21:45",
          tag: "yoga",
          externalJoinUrl: "https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-22",
        },
        {
          id: "demo-club-plan-36",
          title: "Аштанга йога. Майсор-класс",
          description: "Аштанга йога. Майсор-класс с преподавателем студии ЙогаДом (Наташа Савина). Уровень: все уровни. Стоимость 1500 ₽, запись через YClients студии по [ссылке](https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-23)",
          cover: "yoga10.jpeg",
          location: "Петровский пер., 1/30с1, Москва м. Чеховская | м. Пушкинская",
          schedule: exactSchedule("2026-07-17", "06:30"),
          timeDate: "17 июля, 06:30–09:30",
          tag: "yoga",
          externalJoinUrl: "https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-23",
        },
        {
          id: "demo-club-plan-37",
          title: "Йогатерапия. Женская мистерия",
          description: "Йогатерапия. Женская мистерия с преподавателем студии ЙогаДом (Яна Танас). Уровень: все уровни. Стоимость 2500 ₽, запись через YClients студии по [ссылке](https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-24)",
          cover: "yoga11.jpeg",
          location: "Петровский пер., 1/30с1, Москва м. Чеховская | м. Пушкинская",
          schedule: exactSchedule("2026-07-17", "19:00"),
          timeDate: "17 июля, 19:00–21:00",
          tag: "yoga",
          externalJoinUrl: "https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-24",
        },
        {
          id: "demo-club-plan-38",
          title: "Аштанга виньяса йога",
          description: "Аштанга виньяса йога с преподавателем студии ЙогаДом (Наташа Савина). Уровень: все уровни. Стоимость 1500 ₽, запись через YClients студии по [ссылке](https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-25)",
          cover: "yoga12.jpeg",
          location: "Петровский пер., 1/30с1, Москва м. Чеховская | м. Пушкинская",
          schedule: exactSchedule("2026-07-18", "08:00"),
          timeDate: "18 июля, 08:00–11:00",
          tag: "yoga",
          externalJoinUrl: "https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-25",
        },
        {
          id: "demo-club-plan-39",
          title: "Виньяса-йога",
          description: "Виньяса-йога с преподавателем студии ЙогаДом (Дарья Ди Сойфер). Уровень: все уровни. Стоимость 1800 ₽, запись через YClients студии по [ссылке](https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-26)",
          cover: "yoga13.jpeg",
          location: "Петровский пер., 1/30с1, Москва м. Чеховская | м. Пушкинская",
          schedule: exactSchedule("2026-07-18", "11:00"),
          timeDate: "18 июля, 11:00–12:45",
          tag: "yoga",
          externalJoinUrl: "https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-26",
        },
        {
          id: "demo-club-plan-40",
          title: "Силовая виньяса",
          description: "Силовая виньяса с преподавателем студии ЙогаДом (Светлана Селихова). Уровень: средний уровень. Стоимость 1800 ₽, запись через YClients студии по [ссылке](https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-27)",
          cover: "yoga14.jpeg",
          location: "Петровский пер., 1/30с1, Москва м. Чеховская | м. Пушкинская",
          schedule: exactSchedule("2026-07-18", "13:00"),
          timeDate: "18 июля, 13:00–15:00",
          tag: "yoga",
          externalJoinUrl: "https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-27",
        },
        {
          id: "demo-club-plan-41",
          title: "Основы йоги",
          description: "Основы йоги с преподавателем студии ЙогаДом (Илья Азуевский). Уровень: для начинающих. Стоимость 2000 ₽, запись через YClients студии по [ссылке](https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-28)",
          cover: "yoga15.jpeg",
          location: "Петровский пер., 1/30с1, Москва м. Чеховская | м. Пушкинская",
          schedule: exactSchedule("2026-07-18", "13:00"),
          timeDate: "18 июля, 13:00–15:00",
          tag: "yoga",
          externalJoinUrl: "https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-28",
        },
        {
          id: "demo-club-plan-42",
          title: "Пробуждение силы",
          description: "Пробуждение силы с преподавателем студии ЙогаДом (Дементий Лузик). Уровень: все уровни. Стоимость 2000 ₽, запись через YClients студии по [ссылке](https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-29)",
          cover: "yoga16.jpeg",
          location: "Петровский пер., 1/30с1, Москва м. Чеховская | м. Пушкинская",
          schedule: exactSchedule("2026-07-19", "09:00"),
          timeDate: "19 июля, 09:00–11:00",
          tag: "yoga",
          externalJoinUrl: "https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-29",
        },
        {
          id: "demo-club-plan-43",
          title: "Хатха-йога. Интенсив",
          description: "Хатха-йога. Интенсив с преподавателем студии ЙогаДом (Анфиса Дьяконова). Уровень: средний уровень. Стоимость 1800 ₽, запись через YClients студии по [ссылке](https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-30)",
          cover: "yoga17.jpeg",
          location: "Петровский пер., 1/30с1, Москва м. Чеховская | м. Пушкинская",
          schedule: exactSchedule("2026-07-19", "10:30"),
          timeDate: "19 июля, 10:30–12:30",
          tag: "yoga",
          externalJoinUrl: "https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-30",
        },
        {
          id: "demo-club-plan-44",
          title: "Йога под открытым небом на Тверском бульваре",
          description: "Бесплатная практика под открытым небом от студии ЙогаДом. Регистрация обязательна, открывается за 5 дней до практики в YClients, анонсы в сторис и телеграм-канале студии. Ведет Руслан Алиев. Уровень: все уровни.",
          cover: "yoga18.jpeg",
          location: "Тверской бульвар",
          schedule: exactSchedule("2026-07-19", "11:00"),
          timeDate: "19 июля, 11:00–12:30",
          tag: "yoga",
          externalJoinUrl: "https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-31",
        },
        {
          id: "demo-club-plan-45",
          title: "Хатха-йога",
          description: "Хатха-йога с преподавателем студии ЙогаДом (Татьяна Мещерякова). Уровень: все уровни. Стоимость 1800 ₽, запись через YClients студии по [ссылке](https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-32)",
          cover: "yoga19.jpeg",
          location: "Петровский пер., 1/30с1, Москва м. Чеховская | м. Пушкинская",
          schedule: exactSchedule("2026-07-19", "12:00"),
          timeDate: "19 июля, 12:00–13:30",
          tag: "yoga",
          externalJoinUrl: "https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-32",
        },
        {
          id: "demo-club-plan-46",
          title: "Йога и гонг-медитация",
          description: "Йога и гонг-медитация с преподавателем студии ЙогаДом (Ксения Листиткова). Уровень: все уровни. Стоимость 3000 ₽, запись через YClients студии по [ссылке](https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-33)",
          cover: "yoga20.jpeg",
          location: "Петровский пер., 1/30с1, Москва м. Чеховская | м. Пушкинская",
          schedule: exactSchedule("2026-07-19", "16:00"),
          timeDate: "19 июля, 16:00–18:00",
          tag: "yoga",
          externalJoinUrl: "https://n1188592.yclients.com/company/1089485/activity/select?o=act2026-07-33",
        },
      ],
    },
    {
      id: "demo-club-07",
      name: "Бегаешь как девчонка",
      avatar: "begaesh_kak_devchonka_Avatar.jpg",
      isDemo: true,
      tags: ["Бег","Для девушек"],
      followerIds: ["demo-07","demo-08","demo-09"],
      bio: "Первое в России беговое приложение для женщин: трекер бега и эмоций.",
      plans: [
        {
          id: "demo-club-plan-47",
          title: "Тренировка по технике бега",
          description: "Открытая тренировка по технике бега от команды приложения «Бегаешь как девчонка». Информация по [ссылке](https://womenfest.sport.mos.ru/?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQPOTM2NjE5NzQzMzkyNDU5AAGnkDtHFpS_1aE4en-LmKw84Ua6v7Lc9HSpBveZ59bUtZdrcgkzOisV2WnXMuo_aem_dcyXkrJXfu1l9hP4B7jRCw)",
          cover: "run31.jpeg",
          location: "Парк искусств «Музеон»",
          schedule: exactSchedule("2026-07-18", "12:30"),
          timeDate: "18 июля, 12:30",
          tag: "running",
          externalJoinUrl: "https://womenfest.sport.mos.ru/?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQPOTM2NjE5NzQzMzkyNDU5AAGnkDtHFpS_1aE4en-LmKw84Ua6v7Lc9HSpBveZ59bUtZdrcgkzOisV2WnXMuo_aem_dcyXkrJXfu1l9hP4B7jRCw",
        },
      ],
    },
    {
      id: "demo-club-08",
      name: "DDX Fitness",
      avatar: "DDX_Fintes_Avatar.jpg",
      isDemo: true,
      tags: ["Спорт","Фестиваль"],
      followerIds: ["demo-10","demo-11","demo-12","demo-01"],
      bio: "Крупнейшая федеральная сеть фитнес-клубов России.",
      plans: [
        {
          id: "demo-club-plan-48",
          title: "DDX Fitness Fest, день 1",
          description: "DDX Fitness Fest — большой спортивный фестиваль под открытым небом: более 150 тренировок от кардио и функциональных до танцев, батутов и йоги, лекции блогеров и экспертов, духовные практики, детская зона и фудкорт. Вечером концерты: 25 июля XOLIDAYBOY, 26 июля Клава Кока и Мари Краймбрери. Вход по билетам от 4000 ₽ за день, комбо на два дня 5000 ₽. Запись по [ссылке](https://ddx-fest.ru/)",
          cover: "fitnes1.jpeg",
          location: "Музей-заповедник «Коломенское»",
          schedule: exactSchedule("2026-07-25", "11:00"),
          timeDate: "25 июля, 11:00–22:00",
          tag: "other",
          externalJoinUrl: "https://ddx-fest.ru/",
        },
        {
          id: "demo-club-plan-49",
          title: "DDX Fitness Fest, день 2",
          description: "DDX Fitness Fest — большой спортивный фестиваль под открытым небом: более 150 тренировок от кардио и функциональных до танцев, батутов и йоги, лекции блогеров и экспертов, духовные практики, детская зона и фудкорт. Вечером концерты: 25 июля XOLIDAYBOY, 26 июля Клава Кока и Мари Краймбрери. Вход по билетам от 4000 ₽ за день, комбо на два дня 5000 ₽. Запись по [ссылке](https://ddx-fest.ru/)",
          cover: "fitnes2.jpeg",
          location: "Музей-заповедник «Коломенское»",
          schedule: exactSchedule("2026-07-26", "11:00"),
          timeDate: "26 июля, 11:00–22:00",
          tag: "other",
          externalJoinUrl: "https://ddx-fest.ru/",
        },
      ],
    },
    {
      id: "demo-club-09",
      name: "TS Fitness",
      avatar: "tsFitness_Avatar.jpg",
      isDemo: true,
      tags: ["Растяжка","Пилатес","Йога"],
      followerIds: ["demo-01","demo-02","demo-03"],
      bio: "Премиальная сеть студий фитнеса.",
      plans: [
        {
          id: "demo-club-plan-50",
          title: "Пилатес и растяжка",
          description: "Каждые выходные встречаемся, чтобы двигаться, заряжаться и наслаждаться летом. Тренировки на свежем воздухе уже стали маленькой традицией. Запись открывается за 3 дня до тренировки по ссылке в профиле студии по [ссылке](https://tsfitness-event.timepad.ru/events/?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQPOTM2NjE5NzQzMzkyNDU5AAGnHYOsyoCvKV6_qOWyLnBojciyzi2sAK8_K9zuVMXpl33FSSuW4fdLOWIjnEg_aem_WEyPIjJqzf4jlIq9tPSiDA)",
          cover: "fitnes3.jpeg",
          location: "Парк Горького",
          schedule: exactSchedule("2026-07-18", "14:00"),
          timeDate: "18 июля, 14:00–15:00",
          tag: "recovery",
          externalJoinUrl: "https://tsfitness-event.timepad.ru/events/?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQPOTM2NjE5NzQzMzkyNDU5AAGnHYOsyoCvKV6_qOWyLnBojciyzi2sAK8_K9zuVMXpl33FSSuW4fdLOWIjnEg_aem_WEyPIjJqzf4jlIq9tPSiDA",
        },
        {
          id: "demo-club-plan-51",
          title: "Хатха-йога",
          description: "Каждые выходные встречаемся, чтобы двигаться, заряжаться и наслаждаться летом. Тренировки на свежем воздухе уже стали маленькой традицией. Запись открывается за 3 дня до тренировки по ссылке в профиле студии по [ссылке](https://tsfitness-event.timepad.ru/events/?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQPOTM2NjE5NzQzMzkyNDU5AAGnHYOsyoCvKV6_qOWyLnBojciyzi2sAK8_K9zuVMXpl33FSSuW4fdLOWIjnEg_aem_WEyPIjJqzf4jlIq9tPSiDA)",
          cover: "fitnes4.jpeg",
          location: "Парк Горького",
          schedule: exactSchedule("2026-07-25", "14:00"),
          timeDate: "25 июля, 14:00–15:01",
          tag: "yoga",
          externalJoinUrl: "https://tsfitness-event.timepad.ru/events/?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQPOTM2NjE5NzQzMzkyNDU5AAGnHYOsyoCvKV6_qOWyLnBojciyzi2sAK8_K9zuVMXpl33FSSuW4fdLOWIjnEg_aem_WEyPIjJqzf4jlIq9tPSiDA",
        },
      ],
    },
    {
      id: "demo-club-10",
      name: "YoBody Fitness",
      avatar: "yo_boddy_fitness_Avatar.jpg",
      isDemo: true,
      tags: ["Бег","Тренировка","Фитнес","Знакомства","Бокс"],
      followerIds: ["demo-04","demo-05","demo-06","demo-07"],
      bio: "Сеть фитнес-клубов России. Все лето проводит бесплатные ивенты в Лужниках.",
      plans: [
        {
          id: "demo-club-plan-52",
          title: "Беговая тренировка",
          description: "Бесплатный ивент YoBody Fitness в Лужниках в рамках летней программы клуба. Групповая беговая тренировка на свежем воздухе. Подробнее по [ссылке](https://www.instagram.com/p/DakewN_tFN3/?utm_source=ig_web_copy_link)",
          cover: "fitnes5.jpeg",
          location: "Лужники",
          schedule: exactSchedule("2026-07-18", "11:00"),
          timeDate: "18 июля, 11:00",
          tag: "running",
          externalJoinUrl: "https://www.instagram.com/p/DakewN_tFN3/?utm_source=ig_web_copy_link",
        },
        {
          id: "demo-club-plan-53",
          title: "Олимпийская разминка с Дмитрием Яшанькиным",
          description: "Бесплатный ивент YoBody Fitness в Лужниках в рамках летней программы клуба. Разминка с чемпионом мира по фитнесу Дмитрием Яшанькиным. Подробнее по [ссылке](https://www.instagram.com/p/DakewN_tFN3/?utm_source=ig_web_copy_link)",
          cover: "fitnes6.jpeg",
          location: "Лужники",
          schedule: exactSchedule("2026-07-18", "13:40"),
          timeDate: "18 июля, 13:40",
          tag: "other",
          externalJoinUrl: "https://www.instagram.com/p/DakewN_tFN3/?utm_source=ig_web_copy_link",
        },
        {
          id: "demo-club-plan-54",
          title: "Фитнес-тиндер",
          description: "Бесплатный ивент YoBody Fitness в Лужниках в рамках летней программы клуба. Формат знакомств через совместную тренировку. Подробнее по [ссылке](https://www.instagram.com/p/DakewN_tFN3/?utm_source=ig_web_copy_link)",
          cover: "fitnes7.jpeg",
          location: "Лужники",
          schedule: exactSchedule("2026-07-18", "14:30"),
          timeDate: "18 июля, 14:30",
          tag: "other",
          externalJoinUrl: "https://www.instagram.com/p/DakewN_tFN3/?utm_source=ig_web_copy_link",
        },
        {
          id: "demo-club-plan-55",
          title: "Тренировка по боксу",
          description: "Бесплатный ивент YoBody Fitness в Лужниках в рамках летней программы клуба. Открытая тренировка по боксу. Подробнее по [ссылке](https://www.instagram.com/p/DakewN_tFN3/?utm_source=ig_web_copy_link)",
          cover: "fitnes8.jpeg",
          location: "Лужники",
          schedule: exactSchedule("2026-07-19", "11:00"),
          timeDate: "19 июля, 11:00",
          tag: "other",
          externalJoinUrl: "https://www.instagram.com/p/DakewN_tFN3/?utm_source=ig_web_copy_link",
        },
        {
          id: "demo-club-plan-56",
          title: "Групповая тренировка Сэм Сабадаш х SALAME",
          description: "Бесплатный ивент YoBody Fitness в Лужниках в рамках летней программы клуба. Групповая тренировка от Сэм Сабадаш х SALAME. Подробнее по [ссылке](https://www.instagram.com/p/DakewN_tFN3/?utm_source=ig_web_copy_link)",
          cover: "fitnes9.jpeg",
          location: "Лужники",
          schedule: exactSchedule("2026-07-19", "18:00"),
          timeDate: "19 июля, 18:00",
          tag: "other",
          externalJoinUrl: "https://www.instagram.com/p/DakewN_tFN3/?utm_source=ig_web_copy_link",
        },
      ],
    },
    {
      id: "demo-club-11",
      name: "Neverlate x GTfit",
      avatar: "neverlate_Avatar.jpg",
      isDemo: true,
      tags: ["Бег"],
      followerIds: ["demo-07","demo-08","demo-09"],
      bio: "Коллаборация бренда спортивной одежды neverlate и фитнес-центра GTfit в Лужниках",
      plans: [
        {
          id: "demo-club-plan-57",
          title: "Субботняя пробежка",
          description: "Субботняя пробежка: бегаем в комфортном темпе, тренируемся и знакомимся. Бесплатно. Подробнее по [ссылке](https://www.instagram.com/reel/Dau74Jjsv35/)",
          cover: "fitnes10.jpeg",
          location: "Лужники",
          schedule: exactSchedule("2026-07-18", "11:30"),
          timeDate: "18 июля, 11:30",
          tag: "running",
          externalJoinUrl: "https://www.instagram.com/reel/Dau74Jjsv35/",
        },
        {
          id: "demo-club-plan-58",
          title: "Субботняя пробежка",
          description: "Субботняя пробежка: бегаем в комфортном темпе, тренируемся и знакомимся. Бесплатно. Подробнее по [ссылке](https://www.instagram.com/reel/Dau74Jjsv35/)",
          cover: "fitnes11.jpeg",
          location: "Лужники",
          schedule: exactSchedule("2026-07-25", "11:30"),
          timeDate: "25 июля, 11:30",
          tag: "running",
          externalJoinUrl: "https://www.instagram.com/reel/Dau74Jjsv35/",
        },
      ],
    },
    {
      id: "demo-club-12",
      name: "SMSTRETCHING",
      avatar: "SMSTRETCHING_Avatar.jpg",
      isDemo: true,
      tags: ["Спорт","Фестиваль","Для девушек"],
      followerIds: ["demo-10","demo-11","demo-12","demo-01"],
      bio: "Сеть бутик-студий растяжки и фитнеса в Москве.",
      plans: [
        {
          id: "demo-club-plan-59",
          title: "Женский фестиваль спорта",
          description: "Женский фестиваль спорта с SMSTRETCHING и Московским спортом в парке искусств «Музеон». В программе: 11:00 зарядка в белом с Катей Акулиной, 12:30 функциональная тренировка с Катей Миненковой, 13:30 барре с Леной Логовичевой, 14:40 пилатес с Марией-Элизей Дашковой, 15:30 йога с Роксаной Трюкер, 16:30 растяжка с Алиной Логвиной. Дресс-код тренировок у сцены у фонтана белый, у сцены «НОВА» свободный. Выбирай направление по настроению и регистрируйся на сайте фестиваля. Подробнее по [ссылке](https://www.instagram.com/p/Dau3Z9MjdcC/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==)",
          cover: "stretch1.jpg",
          location: "Парк искусств «Музеон»",
          schedule: exactSchedule("2026-07-18", "11:00"),
          timeDate: "18 июля, 11:00–17:15",
          tag: "other",
          externalJoinUrl: "https://www.instagram.com/p/Dau3Z9MjdcC/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
        },
      ],
    },
    {
      id: "demo-club-13",
      name: "Yoga Space",
      avatar: "yoga_space_Avatar.jpg",
      isDemo: true,
      tags: ["Йога","Бег"],
      followerIds: ["demo-01","demo-02","demo-03"],
      bio: "Студии йоги в центре Москвы. Мероприятия Yoga Space — лучший способ стать частью комьюнити людей, влюбленных в йогу.",
      plans: [
        {
          id: "demo-club-plan-60",
          title: "Аштанга с Татьяной Барабаш",
          description: "Класс «Аштанга: прогибы, сила, подвижность и свобода движения». Разберем, как раскрывать грудную клетку, чтобы прогиб шел за счет всего тела и не перегружал поясницу: от Бхуджангасаны до глубоких вариантов. Мероприятие платное, стоимость от 2500 ₽, запись по [ссылке](https://yogaspace.ru/events)",
          cover: "yoga21.jpeg",
          location: "Yoga Space Мясницкая, ул. Мясницкая, 24/7",
          schedule: exactSchedule("2026-07-18", "18:30"),
          timeDate: "18 июля, 18:30–21:00",
          tag: "yoga",
          externalJoinUrl: "https://yogaspace.ru/events",
        },
        {
          id: "demo-club-plan-61",
          title: "Йога на крыше МАММ",
          description: "Yoga Space × МАММ: практикуем йогу на крыше музея. Практика с преподавателями Yoga Space, а после класса можно посмотреть искусство: билет на выставку включен в стоимость. Мероприятие платное, стоимость 2000 ₽, запись по [ссылке](https://yogaspace.ru/events)",
          cover: "yoga22.jpeg",
          location: "МАММ, ул. Остоженка, 16",
          schedule: exactSchedule("2026-07-18", "11:00"),
          timeDate: "18 июля, 11:00",
          tag: "yoga",
          externalJoinUrl: "https://yogaspace.ru/events",
        },
        {
          id: "demo-club-plan-62",
          title: "Йога на крыше МАММ",
          description: "Yoga Space × МАММ: практикуем йогу на крыше музея. Практика с преподавателями Yoga Space, а после класса можно посмотреть искусство: билет на выставку включен в стоимость. Мероприятие платное, стоимость 2000 ₽, запись по [ссылке](https://yogaspace.ru/events)",
          cover: "yoga23.jpeg",
          location: "МАММ, ул. Остоженка, 16",
          schedule: exactSchedule("2026-07-18", "17:00"),
          timeDate: "18 июля, 17:00",
          tag: "yoga",
          externalJoinUrl: "https://yogaspace.ru/events",
        },
        {
          id: "demo-club-plan-63",
          title: "Интенсив: Ширшасана, стойка на голове",
          description: "Интенсив со Светланой Селиховой о том, как безопасно и уверенно освоить стойку на голове: биомеханика, отстройки, подводящие упражнения и работа с шейно-воротниковой зоной. Мероприятие платное, запись по [ссылке](https://yogaspace.ru/events)",
          cover: "yoga24.jpeg",
          location: "Yoga Space Дмитровка",
          schedule: exactSchedule("2026-07-19", "11:45"),
          timeDate: "19 июля, 11:45–13:45",
          tag: "yoga",
          externalJoinUrl: "https://yogaspace.ru/events",
        },
        {
          id: "demo-club-plan-64",
          title: "Йога и бег с Екатериной Рябовой",
          description: "Класс из двух частей: 30 минут хатха-йоги и разминки в студии на Мясницкой и 30 минут пробежки в районе Чистых прудов. Мероприятие платное, стоимость 1700 ₽ или по абонементу, запись по [ссылке](https://yogaspace.ru/events)",
          cover: "yoga25.jpeg",
          location: "Yoga Space Мясницкая, ул. Мясницкая, 24/7",
          schedule: exactSchedule("2026-07-19", "15:45"),
          timeDate: "19 июля, 15:45–16:45",
          tag: "running",
          externalJoinUrl: "https://yogaspace.ru/events",
        },
      ],
    },
  ],
} as const satisfies { clubs: DemoClub[] };

export const demoClubPlans: HomeFeedPlan[] = demoClubs.clubs.flatMap((club) => {
  const avatarUrl = demoClubAssets.avatars[club.avatar];
  const clubPhotos = club.plans.map((item) => item.cover);
  return club.plans.map((plan) => ({
    id: plan.id,
    tag: plan.tag,
    format: "offline",
    photos: [plan.cover, ...clubPhotos.filter((photo) => photo !== plan.cover)]
      .slice(0, 6)
      .map((photo) => demoClubAssets.covers[photo]),
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
  const club: DemoClub | undefined = demoClubs.clubs.find((item) => item.id === plan.author.id);
  return club?.disabled !== true;
});

export const activeDemoClubPlanIds = new Set(activeDemoClubPlans.map((plan) => String(plan.id)));

export const getDemoClubParticipantPeers = (planId: string): ChatPeer[] => {
  const clubId = demoClubs.clubs.find((club) => club.plans.some((plan) => plan.id === planId))?.id;
  if (!clubId) return [];

  const participantIdsByClub: Record<string, readonly string[]> = {
    "demo-club-01": ["demo-01","demo-02","demo-03","demo-04"],
    "demo-club-02": ["demo-06","demo-07","demo-08","demo-09","demo-10"],
    "demo-club-03": ["demo-11","demo-12","demo-01","demo-02","demo-03","demo-04"],
    "demo-club-04": ["demo-04","demo-05","demo-06","demo-07","demo-08","demo-09","demo-10"],
    "demo-club-05": ["demo-09","demo-10","demo-11","demo-12","demo-01","demo-02","demo-03","demo-04"],
    "demo-club-06": ["demo-02","demo-03","demo-04","demo-05"],
    "demo-club-07": ["demo-07","demo-08","demo-09","demo-10","demo-11"],
    "demo-club-08": ["demo-12","demo-01","demo-02","demo-03","demo-04","demo-05"],
    "demo-club-09": ["demo-05","demo-06","demo-07","demo-08","demo-09","demo-10","demo-11"],
    "demo-club-10": ["demo-10","demo-11","demo-12","demo-01","demo-02","demo-03","demo-04","demo-05"],
    "demo-club-11": ["demo-03","demo-04","demo-05","demo-06"],
    "demo-club-12": ["demo-08","demo-09","demo-10","demo-11","demo-12"],
    "demo-club-13": ["demo-01","demo-02","demo-03","demo-04","demo-05","demo-06"],
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
