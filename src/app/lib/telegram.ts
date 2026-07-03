declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        initDataUnsafe: {
          start_param?: string;
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
      };
    };
  }
}

export const BOT_USERNAME = "WellWellWell_New_bot";

export const buildPlanStartAppUrl = (planId: string) =>
  `https://t.me/${BOT_USERNAME}?startapp=plan_${encodeURIComponent(planId)}`;

export const getTelegramStartParam = () => window.Telegram?.WebApp?.initDataUnsafe?.start_param ?? "";

export function getTelegramUser() {
  // MVP only: initDataUnsafe is not HMAC-validated on the client.
  // Production launch needs server-side initData validation with the bot token.
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (tgUser) return tgUser;

  return {
    id: 0,
    first_name: "Тест",
    last_name: "Пользователь",
    username: "test_user",
    photo_url: undefined,
  };
}

export function initTelegram() {
  window.Telegram?.WebApp?.ready();
  window.Telegram?.WebApp?.expand();
}
