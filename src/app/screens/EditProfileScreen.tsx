import { useCallback, useEffect, useState, type ChangeEvent, type TouchEvent } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, Image as ImageIcon, Plus, X } from "lucide-react";
import { HomeSheet } from "@/app/components/HomeSheet";
import { DEFAULT_COVER_URLS, resolveCoverUrl, type ExpertProfile } from "@/app/data/profile";
import { GREEN, GREEN_LIGHT } from "@/app/data/constants";
import { uploadPhoto } from "@/app/lib/api/storage";

type CropTarget = "avatar" | "cover";
const MAX_CROP_SIDE = 1600;

const scrollFocusedFieldIntoView = (element: HTMLElement) => {
  window.setTimeout(() => {
    element.scrollIntoView({ block: "center", behavior: "smooth" });
  }, 300);
};

const isEditableElement = (element: Element | null): element is HTMLInputElement | HTMLTextAreaElement =>
  element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;

const loadImage = (file: File) => new Promise<HTMLImageElement>((resolve, reject) => {
  const imageUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(imageUrl);
    resolve(image);
  };
  image.onerror = () => {
    URL.revokeObjectURL(imageUrl);
    reject(new Error("Image decode failed"));
  };
  image.src = imageUrl;
});

const centerCropImageFile = async (file: File, aspect: number) => {
  const image = await loadImage(file);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const sourceAspect = sourceWidth / sourceHeight;
  const cropWidth = sourceAspect > aspect ? sourceHeight * aspect : sourceWidth;
  const cropHeight = sourceAspect > aspect ? sourceHeight : sourceWidth / aspect;
  const cropX = (sourceWidth - cropWidth) / 2;
  const cropY = (sourceHeight - cropHeight) / 2;
  const scale = Math.min(1, MAX_CROP_SIDE / Math.max(cropWidth, cropHeight));

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context is not available");

  canvas.width = Math.max(1, Math.round(cropWidth * scale));
  canvas.height = Math.max(1, Math.round(cropHeight * scale));
  context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.9);
  });
  if (!blob) throw new Error("Canvas export failed");

  return new File([blob], "cropped-photo.jpg", { type: "image/jpeg" });
};

export function EditProfileScreen({
  profile,
  onBack,
  onSave,
  onDeleteAccount,
}: {
  profile: ExpertProfile;
  onBack: () => void;
  onSave: (profile: ExpertProfile) => void;
  onDeleteAccount: () => void;
}) {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [photoUrl, setPhotoUrl] = useState<string | null>(profile.photoUrl);
  const [coverUrls, setCoverUrls] = useState<string[] | null>(profile.coverUrls);
  const [uploadTarget, setUploadTarget] = useState<CropTarget | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [fieldFocused, setFieldFocused] = useState(false);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState(0);
  const [coverEmblaRef, coverEmblaApi] = useEmblaCarousel({ loop: false });
  const visibleCoverUrls = coverUrls === null ? [...DEFAULT_COVER_URLS] : coverUrls;
  const showAddCoverSlide = visibleCoverUrls.length < 5;
  const coverSlideCount = visibleCoverUrls.length + (showAddCoverSlide ? 1 : 0);
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  const onCoverSelect = useCallback(() => {
    if (!coverEmblaApi) return;
    setSelectedCoverIndex(coverEmblaApi.selectedScrollSnap());
  }, [coverEmblaApi]);

  useEffect(() => {
    if (!coverEmblaApi) return;
    onCoverSelect();
    coverEmblaApi.on("select", onCoverSelect);
    coverEmblaApi.on("reInit", onCoverSelect);
  }, [coverEmblaApi, onCoverSelect]);

  useEffect(() => {
    coverEmblaApi?.reInit();
    setSelectedCoverIndex((index) => Math.min(index, Math.max(0, coverSlideCount - 1)));
  }, [coverEmblaApi, coverSlideCount]);

  const handleImagePick = (target: CropTarget) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const aspect = target === "avatar" ? 1 : 3 / 4;
      setUploadTarget(target);
      setUploadProgress(0);
      void centerCropImageFile(file, aspect)
        .then((croppedFile) => uploadPhoto(croppedFile, { onProgress: setUploadProgress }))
        .then((uploadedUrl) => {
          if (uploadedUrl && target === "avatar") {
            setPhotoUrl(uploadedUrl);
          } else if (uploadedUrl) {
            setCoverUrls((current) => [...(current ?? []), uploadedUrl].slice(0, 5));
          }
        })
        .catch((error) => {
          console.error("Profile image upload failed", error);
        })
        .finally(() => {
          setUploadProgress(null);
          setUploadTarget(null);
        });
    }
    event.target.value = "";
  };

  const handleSave = () => {
    try {
      onSave({
        ...profile,
        name: name.trim() || profile.name,
        bio: bio.trim(),
        photoUrl,
        photoUrls: profile.photoUrls,
        coverUrls,
      });
    } catch (error) {
      console.error("EditProfileScreen save failed", error);
    }
  };

  const handleScrollTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const activeElement = document.activeElement;
    if (isEditableElement(activeElement) && event.target !== activeElement) {
      activeElement.blur();
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

      <div
        className={`flex-1 overflow-y-auto px-4 ${fieldFocused ? "pb-[40vh]" : "pb-4"}`}
        onTouchStart={handleScrollTouchStart}
      >
        <div className="mb-6 rounded-xl bg-card px-4 py-4">
          <span className="mb-3 block text-[13px] leading-4 text-muted-foreground">Аватар</span>
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full bg-secondary">
              {photoUrl ? (
                <img loading="lazy" decoding="async" src={photoUrl} alt={name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: GREEN_LIGHT }}>
                  <span className="text-[28px] font-bold" style={{ color: GREEN }}>{initials}</span>
                </div>
              )}
              {uploadTarget === "avatar" && uploadProgress !== null && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                  <span className="text-[17px] font-semibold text-white">{uploadProgress}%</span>
                </div>
              )}
            </div>
            <label className={`flex h-11 items-center gap-2 rounded-xl border px-4 text-[14px] font-semibold text-foreground ${uploadProgress === null ? "active:opacity-85" : "cursor-not-allowed opacity-50"}`}>
              <ImageIcon size={17} strokeWidth={2} />
              Сменить фото
              <input type="file" accept="image/*" disabled={uploadProgress !== null} className="hidden" onChange={handleImagePick("avatar")} />
            </label>
          </div>
        </div>

        <div className="mb-6 rounded-xl bg-card px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[13px] leading-4 text-muted-foreground">Обложки</span>
            <span className="text-[12px] leading-4 text-muted-foreground">{visibleCoverUrls.length}/5</span>
          </div>
          <div className="relative aspect-[3/4] w-full max-h-[45dvh] overflow-hidden rounded-xl bg-gray-200">
            <div ref={coverEmblaRef} className="h-full overflow-hidden">
              <div className="flex h-full">
                {visibleCoverUrls.map((coverUrl, index) => {
                  const isDefaultCover = coverUrl.startsWith("default:");
                  return (
                    <div key={`${coverUrl}-${index}`} className="relative min-w-0 flex-[0_0_100%]">
                      <img loading="lazy" decoding="async" src={resolveCoverUrl(coverUrl)} alt="" className="h-full w-full object-cover" />
                      {isDefaultCover && (
                        <span className="absolute inset-x-4 bottom-4 rounded-full bg-black/45 px-3 py-1.5 text-center text-[12px] font-medium text-white">
                          Обложка по умолчанию
                        </span>
                      )}
                      <button
                        onClick={() => setCoverUrls((current) => (current ?? [...DEFAULT_COVER_URLS]).filter((_, coverIndex) => coverIndex !== index))}
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white active:opacity-85"
                        aria-label="Удалить обложку"
                      >
                        <X size={18} strokeWidth={2.2} />
                      </button>
                    </div>
                  );
                })}
                {showAddCoverSlide && (
                  <div className="min-w-0 flex-[0_0_100%] p-3">
                    <label className={`flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted text-[14px] font-semibold text-foreground ${uploadProgress === null ? "active:opacity-85" : "cursor-not-allowed opacity-50"}`}>
                      <Plus size={24} strokeWidth={2.2} />
                      Добавить
                      <input type="file" accept="image/*" disabled={uploadProgress !== null} className="hidden" onChange={handleImagePick("cover")} />
                    </label>
                  </div>
                )}
              </div>
            </div>
            {uploadTarget === "cover" && uploadProgress !== null && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60">
                <span className="text-[22px] font-semibold text-white">{uploadProgress}%</span>
              </div>
            )}
            {coverSlideCount > 1 && (
              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                {Array.from({ length: coverSlideCount }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => coverEmblaApi?.scrollTo(index)}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: selectedCoverIndex === index ? 18 : 6,
                      backgroundColor: selectedCoverIndex === index ? "#fff" : "rgba(255,255,255,0.55)",
                    }}
                    aria-label={`Обложка ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-[13px] leading-4 text-muted-foreground">Имя</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                onFocus={(event) => {
                  setFieldFocused(true);
                  scrollFocusedFieldIntoView(event.currentTarget);
                }}
                onBlur={() => setFieldFocused(false)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
                enterKeyHint="done"
                className="h-12 w-full rounded-xl bg-card px-4 text-[15px] text-foreground outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[13px] leading-4 text-muted-foreground">Био</span>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                onFocus={(event) => {
                  setFieldFocused(true);
                  scrollFocusedFieldIntoView(event.currentTarget);
                }}
                onBlur={() => setFieldFocused(false)}
                rows={5}
                className="min-h-[120px] w-full resize-none rounded-xl bg-card px-4 py-3.5 text-[15px] leading-5 text-foreground outline-none"
              />
            </label>
          </div>
          <button
            onClick={() => setDeleteOpen(true)}
            className="mt-10 w-full text-center text-[13px] font-normal text-muted-foreground"
          >
            Удалить аккаунт
          </button>
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-border bg-card px-4 pb-4 pt-3">
        <button
          onClick={handleSave}
          disabled={uploadProgress !== null}
          className="h-12 w-full rounded-xl text-[15px] font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: GREEN }}
        >
          Сохранить
        </button>
      </div>

      {deleteOpen && (
        <HomeSheet title="Удалить аккаунт" onClose={() => setDeleteOpen(false)}>
          <p className="mb-4 text-[14px] leading-5 text-gray-500">Все твои данные будут удалены без возможности восстановления: профиль, планы, комментарии, сообщения и подписки.</p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteOpen(false)} className="h-11 flex-1 rounded-xl bg-gray-100 text-[14px] font-semibold text-gray-900">Отмена</button>
            <button onClick={onDeleteAccount} className="h-11 flex-1 rounded-xl text-[14px] font-semibold text-white" style={{ backgroundColor: "#DC2626" }}>Удалить</button>
          </div>
        </HomeSheet>
      )}
    </div>
  );
}
