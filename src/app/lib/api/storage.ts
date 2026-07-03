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

export const uploadPhoto = async (file: File): Promise<string | null> => {
  if (!supabase) {
    console.error("Supabase photo upload failed: Supabase client is not configured.");
    return null;
  }

  const uploadFile = await compressPhoto(file);
  const extension = getExtension(uploadFile);
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

  try {
    const { error } = await supabase.storage.from("photos").upload(fileName, uploadFile);
    if (error) {
      console.error("Supabase photo upload failed:", error.message, error);
      return null;
    }

    const { data } = supabase.storage.from("photos").getPublicUrl(fileName);
    if (!data.publicUrl.startsWith("https://")) {
      console.error("Supabase photo upload failed: public URL is not HTTPS.", data.publicUrl);
      return null;
    }
    return data.publicUrl;
  } catch (error) {
    console.error("Supabase photo upload failed:", error instanceof Error ? error.message : String(error), error);
    return null;
  }
};
