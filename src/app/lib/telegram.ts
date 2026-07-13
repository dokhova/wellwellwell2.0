declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        disableVerticalSwipes?: () => void;
        openLink?: (url: string) => void;
        openTelegramLink?: (url: string) => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        initDataUnsafe: {
          start_param?: string;
          auth_date?: number | string;
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

const CAMPAIGN_PATTERN = /^[a-z0-9-]+$/;

export const buildPlanStartAppUrl = (planId: string, campaign?: string) => {
  const campaignSuffix = campaign && CAMPAIGN_PATTERN.test(campaign) ? `__${campaign}` : "";
  return `https://t.me/${BOT_USERNAME}?startapp=plan_${encodeURIComponent(planId)}${campaignSuffix}`;
};

export const getTelegramStartParam = () => window.Telegram?.WebApp?.initDataUnsafe?.start_param ?? "";
export const getTelegramAuthDate = () => {
  const authDate = window.Telegram?.WebApp?.initDataUnsafe?.auth_date;
  return authDate === undefined || authDate === null ? "" : String(authDate);
};

export const parsePlanStartParam = (startParam: string) => {
  const plansMatch = startParam.match(/^plans(?:__(.+))?$/);
  if (plansMatch) {
    const rawCampaign = plansMatch[1];
    return {
      kind: "plans" as const,
      campaign: rawCampaign && CAMPAIGN_PATTERN.test(rawCampaign) ? rawCampaign : undefined,
    };
  }

  const match = startParam.match(/^plan_(.+)$/);
  if (!match) return null;
  const [rawPlanId, rawCampaign] = match[1].split("__", 2);
  return {
    kind: "plan" as const,
    planId: decodeURIComponent(rawPlanId),
    campaign: rawCampaign && CAMPAIGN_PATTERN.test(rawCampaign) ? rawCampaign : undefined,
  };
};

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
  const webApp = window.Telegram?.WebApp;
  webApp?.ready();
  webApp?.expand();
  webApp?.disableVerticalSwipes?.();
}
