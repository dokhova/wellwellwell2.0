import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { GREEN } from "@/app/data/constants";

const getCroppedImageFile = async (imageUrl: string, croppedAreaPixels: Area) => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Image decode failed"));
    element.src = imageUrl;
  });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context is not available");

  canvas.width = Math.max(1, Math.round(croppedAreaPixels.width));
  canvas.height = Math.max(1, Math.round(croppedAreaPixels.height));
  context.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.9);
  });
  if (!blob) throw new Error("Canvas export failed");

  return new File([blob], "cropped-photo.jpg", { type: "image/jpeg" });
};

export function ImageCropSheet({
  imageUrl,
  aspect,
  onCancel,
  onComplete,
}: {
  imageUrl: string;
  aspect: number;
  onCancel: () => void;
  onComplete: (file: File) => Promise<void>;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleCropComplete = useCallback((_croppedArea: Area, nextCroppedAreaPixels: Area) => {
    setCroppedAreaPixels(nextCroppedAreaPixels);
  }, []);

  const handleComplete = async () => {
    if (!croppedAreaPixels || isSaving) return;
    setIsSaving(true);
    try {
      const file = await getCroppedImageFile(imageUrl, croppedAreaPixels);
      await onComplete(file);
    } catch (error) {
      console.error("Image crop failed", error);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black text-white">
      <div className="relative min-h-0 flex-1">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onCropComplete={handleCropComplete}
          onZoomChange={setZoom}
          minZoom={1}
          maxZoom={4}
          showGrid={false}
        />
      </div>
      <div className="flex flex-shrink-0 items-center gap-3 bg-black px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="h-12 flex-1 rounded-xl border border-white/25 text-[15px] font-semibold text-white disabled:opacity-45"
        >
          Отмена
        </button>
        <button
          onClick={handleComplete}
          disabled={isSaving || !croppedAreaPixels}
          className="h-12 flex-1 rounded-xl text-[15px] font-semibold text-white disabled:opacity-55"
          style={{ backgroundColor: GREEN }}
        >
          {isSaving ? "Сохраняем..." : "Готово"}
        </button>
      </div>
    </div>
  );
}
