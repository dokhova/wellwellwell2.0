import { supabase } from "@/app/lib/supabase";

export const canUploadPhotos = Boolean(supabase);

export const isUnsafeLocalImageUrl = (url: string | null | undefined) =>
  Boolean(url?.startsWith("blob:") || url?.startsWith("data:"));

export const sanitizeImageUrl = (url: string | null | undefined) =>
  url && !isUnsafeLocalImageUrl(url) ? url : null;

const getExtension = (file: File) => {
  const subtype = file.type.split("/")[1]?.toLowerCase();
  if (subtype) return subtype.replace(/[^a-z0-9]/g, "") || "jpg";
  return "jpg";
};

const shouldCompressImage = (file: File) =>
  ["image/jpeg", "image/png", "image/webp", "image/bmp"].includes(file.type);

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image decode failed"));
    image.src = url;
  });

const compressPhoto = async (file: File): Promise<File> => {
  if (!shouldCompressImage(file)) return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
    if (!longestSide) return file;

    const scale = Math.min(1, 1280 / longestSide);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.8);
    });
    if (!blob) return file;

    return new File([blob], "photo.jpg", { type: "image/jpeg" });
  } catch (error) {
    console.error("Photo compression failed; uploading original file.", error);
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export const uploadPhoto = async (
  file: File,
  options?: { onProgress?: (percent: number) => void },
): Promise<string | null> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!supabase || !supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase photo upload failed: Supabase client is not configured.");
    return null;
  }

  let displayedProgress = 0;
  const emitProgress = (percent: number) => {
    const nextProgress = Math.max(displayedProgress, Math.min(100, Math.round(percent)));
    if (nextProgress === displayedProgress) return;
    displayedProgress = nextProgress;
    options?.onProgress?.(displayedProgress);
  };

  options?.onProgress?.(0);
  const progressTimer = window.setInterval(() => {
    emitProgress(Math.min(90, displayedProgress + 4));
  }, 120);

  try {
    const uploadFile = await compressPhoto(file);
    const extension = getExtension(uploadFile);
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${supabaseUrl}/storage/v1/object/photos/${fileName}`);
      xhr.setRequestHeader("Authorization", `Bearer ${supabaseAnonKey}`);
      xhr.setRequestHeader("apikey", supabaseAnonKey);
      xhr.setRequestHeader("x-upsert", "false");
      xhr.setRequestHeader("cache-control", "31536000");
      xhr.setRequestHeader("content-type", uploadFile.type);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          emitProgress((event.loaded / event.total) * 100);
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          emitProgress(100);
          resolve();
          return;
        }
        reject(new Error(xhr.responseText || `Storage upload failed with status ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error("Storage upload network error"));
      xhr.onabort = () => reject(new Error("Storage upload aborted"));
      xhr.send(uploadFile);
    });

    const { data } = supabase.storage.from("photos").getPublicUrl(fileName);
    if (!data.publicUrl.startsWith("https://")) {
      console.error("Supabase photo upload failed: public URL is not HTTPS.", data.publicUrl);
      return null;
    }
    return data.publicUrl;
  } catch (error) {
    console.error("Supabase photo upload failed:", error instanceof Error ? error.message : String(error), error);
    return null;
  } finally {
    window.clearInterval(progressTimer);
  }
};
