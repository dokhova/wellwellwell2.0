import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MessageCircle, MoreVertical, Search, X } from "lucide-react";
import type { Article, ChatPeer } from "@/app/types";
import { articles } from "@/app/data/articles";
import { experts, type ExpertProfile } from "@/app/data/profile";
import { GREEN } from "@/app/data/constants";
import { searchProfiles } from "@/app/lib/api/profiles";
import { sanitizeImageUrl } from "@/app/lib/api/storage";

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

function PersonAvatar({ person, size = 40 }: { person: ExpertProfile; size?: number }) {
  const avatarUrl = sanitizeImageUrl(person.photoUrl);
  if (avatarUrl) {
    return <img src={avatarUrl} alt={person.name} className="flex-shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }

  const initials = person.name.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return (
    <div className="flex flex-shrink-0 items-center justify-center rounded-full bg-white" style={{ width: size, height: size }}>
      <span className="text-[13px] font-bold" style={{ color: GREEN }}>{initials}</span>
    </div>
  );
}

function PersonCard({
  person,
  onProfile,
  onMessage,
}: {
  person: ExpertProfile;
  onProfile: () => void;
  onMessage: () => void;
}) {
  return (
    <button onClick={onProfile} className="mx-4 flex items-center gap-3 rounded-[20px] bg-white p-4 text-left active:opacity-90">
      <PersonAvatar person={person} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-gray-900">{person.name}</p>
        {person.username && <p className="mt-0.5 truncate text-[12px] text-gray-500">@{person.username}</p>}
      </div>
      <button
        onClick={(event) => {
          event.stopPropagation();
          onMessage();
        }}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: GREEN }}
        aria-label="Написать"
      >
        <MessageCircle size={17} strokeWidth={2} color="#fff" />
      </button>
    </button>
  );
}

export function SearchScreen({
  onBack,
  onArticle,
  currentUserId,
  onProfile,
  onMessagePeer,
}: {
  onBack: () => void;
  onArticle: (a: Article) => void;
  currentUserId: string;
  onProfile: (profile: ExpertProfile) => void;
  onMessagePeer: (peer: ChatPeer) => void;
}) {
  const [query, setQuery] = useState("");
  const [remotePeople, setRemotePeople] = useState<ExpertProfile[]>([]);
  const normalizedQuery = query.trim().toLowerCase();
  const results = normalizedQuery
    ? articles.filter(a =>
        a.title.toLowerCase().includes(normalizedQuery) ||
        a.author.toLowerCase().includes(normalizedQuery)
      )
    : articles;
  const localPeople = useMemo(() => {
    if (!normalizedQuery) return [];
    return experts.filter((person) =>
      person.id !== currentUserId &&
      (
        person.name.toLowerCase().includes(normalizedQuery) ||
        person.username?.toLowerCase().includes(normalizedQuery)
      )
    );
  }, [currentUserId, normalizedQuery]);
  const people = useMemo(() => {
    const merged = [...remotePeople.filter((person) => person.id !== currentUserId), ...localPeople];
    return Array.from(new Map(merged.map((person) => [person.id, person])).values());
  }, [currentUserId, localPeople, remotePeople]);
  const hasResults = people.length > 0 || results.length > 0;

  useEffect(() => {
    if (!normalizedQuery) {
      setRemotePeople([]);
      return;
    }

    let cancelled = false;
    const loadPeople = async () => {
      try {
        const profiles = await searchProfiles(normalizedQuery);
        if (!cancelled) setRemotePeople(profiles);
      } catch (error) {
        console.error("Supabase profile search failed", error);
      }
    };

    void loadPeople();
    return () => {
      cancelled = true;
    };
  }, [normalizedQuery]);

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
        {people.map((person) => (
          <PersonCard
            key={person.id}
            person={person}
            onProfile={() => onProfile(person)}
            onMessage={() => onMessagePeer({ id: person.id, name: person.name, avatarUrl: sanitizeImageUrl(person.photoUrl) })}
          />
        ))}
        {results.map(article => (
          <ArticleCard
            key={article.id}
            article={article}
            onPress={() => onArticle(article)}
          />
        ))}
        {!hasResults && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Search size={32} strokeWidth={1.5} color="#D1D5DB" />
            <p className="text-[14px] text-gray-400">Ничего не найдено</p>
          </div>
        )}
      </div>
    </div>
  );
}
