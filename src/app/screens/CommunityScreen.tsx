import { Activity, Footprints, MapPin, RotateCcw, Timer, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import type { ExpertProfile } from "@/app/data/profile";

const TEAL = "#00A89D";
const TEAL_TEXT = "#36DDD0";
const CORAL = "#FF6B5A";
const AMBER = "#F0C05A";
const SWIPE_DURATION_MS = 280;

type SwipeDirection = "left" | "right";

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "Участник";

function ProfilePhoto({ profile }: { profile: ExpertProfile }) {
  const [failed, setFailed] = useState(false);
  const photoUrl = profile.photoUrl ?? profile.photoUrls[0] ?? null;

  useEffect(() => setFailed(false), [photoUrl]);

  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#126F68,#092E30)]" />
      {photoUrl && !failed ? (
        <img
          src={photoUrl}
          alt=""
          draggable={false}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-[96px] font-black text-white/20">
          {firstName(profile.name).slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,120,110,.28),rgba(4,48,44,.42))] mix-blend-multiply" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.18)_0%,rgba(0,0,0,0)_38%,rgba(0,0,0,.88)_100%)]" />
    </>
  );
}

function ProfileTag({ children }: { children: string }) {
  const normalized = children.toLocaleLowerCase("ru-RU");
  const Icon = normalized.includes("км") ? Activity : normalized.includes("темп") ? Timer : normalized.includes("район") ? MapPin : Footprints;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1.5 text-[12px] font-semibold text-white backdrop-blur-md">
      <Icon size={13} color={TEAL_TEXT} />
      {children}
    </span>
  );
}

function RunnerCard({ profile, dragX }: { profile: ExpertProfile; dragX?: number }) {
  const tags = profile.tags?.filter(Boolean).slice(0, 3) ?? [];
  const rightOpacity = Math.max(0, Math.min(1, (dragX ?? 0) / 105));
  const leftOpacity = Math.max(0, Math.min(1, -(dragX ?? 0) / 105));

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[26px] bg-[#102629] shadow-[0_20px_50px_rgba(0,0,0,.32)]">
      <ProfilePhoto profile={profile} />
      <div
        className="pointer-events-none absolute left-5 top-6 -rotate-12 rounded-xl border-[3px] px-3 py-1 text-[20px] font-black tracking-wide"
        style={{ borderColor: TEAL, color: TEAL_TEXT, opacity: rightOpacity }}
      >
        БЕЖИМ
      </div>
      <div
        className="pointer-events-none absolute right-5 top-6 rotate-12 rounded-xl border-[3px] px-3 py-1 text-[20px] font-black tracking-wide"
        style={{ borderColor: CORAL, color: "#FF8A7A", opacity: leftOpacity }}
      >
        ПРОПУСК
      </div>
      <div className="absolute inset-x-5 bottom-5">
        <h2 className="text-[28px] font-extrabold leading-8 text-white">{firstName(profile.name)}</h2>
        {tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {tags.map((tag) => <ProfileTag key={tag}>{tag}</ProfileTag>)}
          </div>
        )}
        {profile.bio && <p className="mt-2.5 line-clamp-3 text-[14px] leading-[1.4] text-white/80">{profile.bio}</p>}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  disabled,
  filled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  filled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="flex h-[58px] w-[58px] items-center justify-center rounded-full border border-white/10 active:scale-95 disabled:opacity-30"
        style={filled
          ? { background: TEAL, boxShadow: "0 8px 24px rgba(0,168,157,.38)" }
          : { background: "#1A2A2C" }}
        aria-label={label}
      >
        {children}
      </button>
      <span className="max-w-[92px] text-center text-[11px] font-semibold leading-4 text-white/60">{label}</span>
    </div>
  );
}

export function CommunityScreen({
  profiles,
  loading,
  onProfileOpen,
  onConnect,
}: {
  profiles: ExpertProfile[];
  loading?: boolean;
  onProfileOpen: (profile: ExpertProfile) => void;
  onConnect: (profile: ExpertProfile) => void;
}) {
  const profileById = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile])), [profiles]);
  const [deckIds, setDeckIds] = useState<string[]>(() => profiles.map((profile) => profile.id));
  const [skippedIds, setSkippedIds] = useState<string[]>([]);
  const [handledIds, setHandledIds] = useState<string[]>([]);
  const [dragX, setDragX] = useState(0);
  const [animating, setAnimating] = useState(false);
  const dragXRef = useRef(0);
  const pointerStartX = useRef(0);
  const cardWidth = useRef(0);
  const dragging = useRef(false);
  const moved = useRef(false);

  useEffect(() => {
    const seen = new Set([...deckIds, ...handledIds]);
    const incomingIds = profiles.map((profile) => profile.id).filter((id) => !seen.has(id));
    if (incomingIds.length > 0) setDeckIds((ids) => [...incomingIds, ...ids]);
  }, [deckIds, handledIds, profiles]);

  const topProfile = deckIds[0] ? profileById.get(deckIds[0]) : undefined;
  const nextProfile = deckIds[1] ? profileById.get(deckIds[1]) : undefined;

  const updateDragX = (value: number) => {
    dragXRef.current = value;
    setDragX(value);
  };

  const swipe = (direction: SwipeDirection) => {
    if (!topProfile || animating) return;
    const profile = topProfile;
    setAnimating(true);
    updateDragX(direction === "right" ? window.innerWidth + 180 : -(window.innerWidth + 180));
    if (direction === "right") onConnect(profile);

    window.setTimeout(() => {
      setDeckIds((ids) => ids.slice(1));
      setHandledIds((ids) => [profile.id, ...ids]);
      if (direction === "left") setSkippedIds((ids) => [profile.id, ...ids]);
      updateDragX(0);
      setAnimating(false);
    }, SWIPE_DURATION_MS);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (animating) return;
    dragging.current = true;
    moved.current = false;
    pointerStartX.current = event.clientX;
    cardWidth.current = event.currentTarget.getBoundingClientRect().width;
    setAnimating(false);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragging.current) return;
    const nextX = event.clientX - pointerStartX.current;
    if (Math.abs(nextX) > 6) moved.current = true;
    updateDragX(nextX);
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const threshold = Math.max(105, cardWidth.current * 0.32);
    if (Math.abs(dragXRef.current) >= threshold) {
      swipe(dragXRef.current > 0 ? "right" : "left");
      return;
    }
    setAnimating(true);
    updateDragX(0);
    window.setTimeout(() => setAnimating(false), SWIPE_DURATION_MS);
  };

  const openTopProfile = () => {
    if (!moved.current && topProfile) onProfileOpen(topProfile);
  };

  const rewind = () => {
    if (!skippedIds.length || animating) return;
    const [lastSkipped, ...remaining] = skippedIds;
    setSkippedIds(remaining);
    setHandledIds((ids) => ids.filter((id) => id !== lastSkipped));
    setDeckIds((ids) => [lastSkipped, ...ids.filter((id) => id !== lastSkipped)]);
  };

  const showAgain = () => {
    setDeckIds(profiles.map((profile) => profile.id));
    setSkippedIds([]);
    setHandledIds([]);
    updateDragX(0);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0C1618] text-white">
      <header className="flex flex-shrink-0 items-center justify-center px-5 pb-2 pt-4">
        <div className="text-center">
          <h1 className="text-[18px] font-bold leading-6 text-white">Сообщество</h1>
          <p className="text-[12px] leading-4 text-white/55">бегуны рядом с тобой</p>
        </div>
      </header>

      <div className="relative mx-[18px] min-h-0 flex-1">
        {!topProfile ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-7 text-center">
            {loading ? (
              <p className="text-[14px] text-white/60">Ищем бегунов рядом…</p>
            ) : (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/7">
                  <UserRound size={30} color={TEAL_TEXT} />
                </div>
                <h2 className="mt-4 text-[19px] font-bold">Пока всё</h2>
                <p className="mt-1.5 text-[14px] leading-5 text-white/55">Новые бегуны появятся скоро</p>
                {profiles.length > 0 && (
                  <button type="button" onClick={showAgain} className="mt-5 rounded-2xl bg-[#00A89D] px-5 py-3 text-[14px] font-bold text-[#04302C] active:opacity-80">
                    Показать снова
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            {nextProfile && (
              <div className="absolute inset-0 translate-y-3 scale-[.95]" aria-hidden="true">
                <RunnerCard profile={nextProfile} />
              </div>
            )}
            <button
              type="button"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onClick={openTopProfile}
              className="absolute inset-0 touch-none select-none rounded-[26px] text-left"
              style={{
                transform: `translateX(${dragX}px) rotate(${dragX * 0.045}deg)`,
                transition: animating ? `transform ${SWIPE_DURATION_MS}ms ease` : "none",
              }}
              aria-label={`Открыть профиль ${topProfile.name}`}
            >
              <RunnerCard profile={topProfile} dragX={dragX} />
            </button>
          </>
        )}
      </div>

      {topProfile && (
        <div className="flex flex-shrink-0 items-start justify-center gap-6 px-3 pb-[90px] pt-4">
          <ActionButton label="Вернуть" disabled={!skippedIds.length} onClick={rewind}>
            <RotateCcw size={23} color={AMBER} />
          </ActionButton>
          <ActionButton label="Пропуск" onClick={() => swipe("left")}>
            <X size={28} color={CORAL} />
          </ActionButton>
          <ActionButton label="Бежим вместе" filled onClick={() => swipe("right")}>
            <Footprints size={25} color="#04302C" />
          </ActionButton>
        </div>
      )}
    </div>
  );
}
