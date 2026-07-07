import challengeImg from "@/imports/challenge-opt.webp";
import type { Article } from "@/app/types";
import { articleBodies } from "@/app/data/articles";
import { eventMeta } from "@/app/data/plans";
import { UNSPLASH } from "@/app/data/constants";
import { EventDetailScreen } from "@/app/screens/EventDetailScreen";

export function ArticleScreen({ article, onBack, onProfile }: { article: Article; onBack: () => void; onProfile?: () => void }) {
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
