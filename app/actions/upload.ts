"use server";

import { createClient } from "@/lib/supabase/server";
import sharp from "sharp";

export type UploadResult = {
  success: boolean;
  url?: string;
  error?: string;
};

/**
 * Uploads an image to the venue-photos bucket with WebP conversion.
 * @param formData - FormData containing 'file' field
 * @returns Public URL of uploaded image or error
 */
export async function uploadVenuePhoto(formData: FormData): Promise<UploadResult> {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Utilizador não autenticado" };
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false, error: "Ficheiro não fornecido" };
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "Tipo de ficheiro não suportado. Use JPEG, PNG, WebP ou GIF." };
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { success: false, error: "Ficheiro muito grande. Máximo 10MB." };
  }

  try {
    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert to WebP with optimization
    const webpBuffer = await sharp(buffer)
      .webp({
        quality: 80,
        effort: 4, // 0-6, higher = slower but smaller
      })
      .resize({
        width: 1200,
        height: 1200,
        fit: "inside",
        withoutEnlargement: true,
      })
      .toBuffer();

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filename = `${user.id}/${timestamp}-${randomSuffix}.webp`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("venue-photos")
      .upload(filename, webpBuffer, {
        contentType: "image/webp",
        cacheControl: "31536000", // 1 year cache
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { success: false, error: "Erro ao fazer upload da imagem" };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("venue-photos")
      .getPublicUrl(filename);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("Image processing error:", error);
    return { success: false, error: "Erro ao processar imagem" };
  }
}

/**
 * Deletes an image from the venue-photos bucket.
 * @param url - Public URL of the image to delete
 */
export async function deleteVenuePhoto(url: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Utilizador não autenticado" };
  }

  // Extract path from URL
  const bucketUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venue-photos/`;
  if (!url.startsWith(bucketUrl)) {
    return { success: false, error: "URL inválido" };
  }

  const path = url.replace(bucketUrl, "");

  // Only allow deletion of own files
  if (!path.startsWith(user.id)) {
    return { success: false, error: "Sem permissão para apagar este ficheiro" };
  }

  const { error } = await supabase.storage
    .from("venue-photos")
    .remove([path]);

  if (error) {
    console.error("Delete error:", error);
    return { success: false, error: "Erro ao apagar imagem" };
  }

  return { success: true };
}
