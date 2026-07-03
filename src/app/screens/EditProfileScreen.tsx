import { useState } from "react";
import { ArrowLeft, Image as ImageIcon, X } from "lucide-react";
import type { ExpertProfile } from "@/app/data/profile";
import { GREEN } from "@/app/data/constants";
import { uploadPhoto } from "@/app/lib/api/storage";

export function EditProfileScreen({
  profile,
  onBack,
  onSave,
}: {
  profile: ExpertProfile;
  onBack: () => void;
  onSave: (profile: ExpertProfile) => void;
}) {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [photoUrls, setPhotoUrls] = useState<string[]>(
    profile.photoUrls?.length ? profile.photoUrls : profile.photoUrl ? [profile.photoUrl] : []
  );
  const coverPhotoUrl = photoUrls[0] ?? null;
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  const handlePhotoPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) {
      const nextPhotoUrls = await Promise.all(
        files.map((file) => uploadPhoto(file))
      );
      const uploadedUrls = nextPhotoUrls.filter((url): url is string => Boolean(url));
      if (uploadedUrls.length > 0) {
        setPhotoUrls((current) => [...current, ...uploadedUrls]);
      }
    }
    event.target.value = "";
  };

  const handleSave = () => {
    try {
      onSave({
        ...profile,
        name: name.trim() || profile.name,
        bio: bio.trim(),
        photoUrl: photoUrls[0] ?? null,
        photoUrls,
      });
    } catch (error) {
      console.error("EditProfileScreen save failed", error);
    }
  };

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-14 flex-shrink-0 items-center justify-between px-4">
        <button onClick={onBack} className="flex h-10 w-10 items-center justify-start">
          <ArrowLeft size={20} strokeWidth={2.2} color="var(--foreground)" />
        </button>
        <h1 className="text-[16px] font-semibold leading-6 text-foreground">Редактировать</h1>
        <div className="h-10 w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <label className="relative mb-5 block aspect-[1.9/1] overflow-hidden rounded-xl bg-gray-200">
          {coverPhotoUrl ? (
            <img loading="lazy" decoding="async" src={coverPhotoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary">
              <span className="text-[42px] font-bold" style={{ color: GREEN }}>{initials}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/25" />
          <span className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-[12px] font-medium text-white">
            <ImageIcon size={14} strokeWidth={2} />
            Добавить фото
          </span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoPick} />
        </label>

        {photoUrls.length > 0 && (
          <div className="mb-5 grid grid-cols-3 gap-2">
            {photoUrls.map((photoUrl, index) => (
              <div key={`${photoUrl}-${index}`} className="relative aspect-square overflow-hidden rounded-xl bg-gray-200">
                <img loading="lazy" decoding="async" src={photoUrl} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => setPhotoUrls((current) => current.filter((_, photoIndex) => photoIndex !== index))}
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white active:opacity-85"
                  aria-label="Удалить фото"
                >
                  <X size={15} strokeWidth={2.2} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-[13px] leading-4 text-muted-foreground">Имя</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-12 w-full rounded-xl bg-card px-4 text-[15px] text-foreground outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[13px] leading-4 text-muted-foreground">Био</span>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={5}
              className="min-h-[120px] w-full resize-none rounded-xl bg-card px-4 py-3.5 text-[15px] leading-5 text-foreground outline-none"
            />
          </label>
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-border bg-card px-4 pb-4 pt-3">
        <button
          onClick={handleSave}
          className="h-12 w-full rounded-xl text-[15px] font-semibold text-white"
          style={{ backgroundColor: GREEN }}
        >
          Сохранить
        </button>
      </div>
    </div>
  );
}
