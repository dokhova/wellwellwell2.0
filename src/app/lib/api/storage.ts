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

export const uploadPhoto = async (file: File): Promise<string | null> => {
  if (!supabase) {
    console.error("Supabase photo upload failed: Supabase client is not configured.");
    return null;
  }

  const extension = getExtension(file);
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

  try {
    const { error } = await supabase.storage.from("photos").upload(fileName, file);
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
