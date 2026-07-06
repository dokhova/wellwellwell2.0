import posthog from "posthog-js";

export const TEAM_IDS: string[] = [];

export type PlanViewSource = "deeplink" | "feed" | "profile" | "search" | "calendar";

type AnalyticsEventProps = {
  app_open: { source: "deeplink" | "direct"; plan_id?: string; campaign?: string };
  terms_shown: Record<string, never>;
  terms_accepted: Record<string, never>;
  plan_view: { plan_id: string; source: PlanViewSource };
  plan_join: { plan_id: string; source: PlanViewSource };
  plan_link_copied: { plan_id: string; screen: "feed" | "plan" };
  plan_check: { plan_id: string };
  comment_sent: { plan_id: string };
  follow: { target_id: string; target_is_demo: boolean };
  message_sent: Record<string, never>;
  plan_created: { plan_id: string };
};

export type AnalyticsEvent = keyof AnalyticsEventProps;

const posthogKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST as string | undefined;
let analyticsEnabled = false;

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    autocapture: false,
    capture_pageview: false,
  });
  analyticsEnabled = true;
}

export const track = <TEvent extends AnalyticsEvent>(
  event: TEvent,
  props: AnalyticsEventProps[TEvent],
) => {
  if (!analyticsEnabled) return;
  posthog.capture(event, props);
};

export const identifyUser = ({
  telegramId,
  name,
  username,
}: {
  telegramId: number | string;
  name: string;
  username?: string;
}) => {
  if (!analyticsEnabled) return;
  const id = String(telegramId);
  posthog.identify(id, {
    name,
    username,
    is_team: TEAM_IDS.includes(id),
  });
};
