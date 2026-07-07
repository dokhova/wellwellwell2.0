import challengeImg from "@/imports/challenge-opt.webp";
import type { Screen } from "@/app/types";
import { articleBodies } from "@/app/data/articles";
import { eventMeta } from "@/app/data/plans";
import appLogo from "@/imports/avatar-brand.png";
import { EventDetailScreen } from "@/app/screens/EventDetailScreen";

export function DetailScreen({ onNavigate, backTo }: { onNavigate: (s: Screen, from?: Screen) => void; backTo: Screen }) {
  return (
    <EventDetailScreen
      title="Челлендж: Вечерний цифровой детокс"
      coverSrc={challengeImg}
      authorName="Well Well Well"
      authorAvatarUrl={appLogo as unknown as string}
      authorVerified
      badgeDate="22 июня 2026"
      paragraphs={articleBodies[3]}
      meta={eventMeta[0]}
      onBack={() => onNavigate(backTo)}
      onProfile={() => onNavigate("profile", "detail")}
    />
  );
}

// ─── Screen: Article Detail ───────────────────────────────────────────────────
