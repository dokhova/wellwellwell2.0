import { supabase } from "@/app/lib/supabase";

const getExtension = (file: File) => {
  const subtype = file.type.split("/")[1]?.toLowerCase();
  if (subtype) return subtype.replace(/[^a-z0-9]/g, "") || "jpg";
  return "jpg";
};

export const uploadPhoto = async (file: File): Promise<string | null> => {
  if (!supabase) return null;

  const extension = getExtension(file);
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

  try {
    const { error } = await supabase.storage.from("photos").upload(fileName, file);
    if (error) throw error;

    const { data } = supabase.storage.from("photos").getPublicUrl(fileName);
    return data.publicUrl;
  } catch (error) {
    console.error("Supabase photo upload failed", error);
    return null;
  }
};
