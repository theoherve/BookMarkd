import { getAvatarPublicUrl, avatarExistsInStorage } from "./storage";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

/**
 * Vérifie si une URL est une URL Supabase Storage
 */
const isSupabaseStorageUrl = (url: string | null | undefined): boolean => {
  if (!url) {
    return false;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.BOOK_MARKD_SUPABASE_URL;
  
  if (!supabaseUrl) {
    return false;
  }

  return url.startsWith(`${supabaseUrl}/storage/v1/object/public/`);
};

/**
 * Obtient l'URL d'un avatar d'utilisateur avec priorité Supabase Storage puis fallback
 * @param userId - ID de l'utilisateur
 * @param dbAvatarUrl - URL de l'avatar depuis la base de données (optionnelle)
 * @returns URL de l'avatar ou null
 */
export const getUserAvatarUrl = async (
  userId: string,
  dbAvatarUrl?: string | null,
): Promise<string | null> => {
  // 1. Si l'URL de la DB est déjà une URL Supabase Storage, l'utiliser directement
  if (isSupabaseStorageUrl(dbAvatarUrl)) {
    return dbAvatarUrl;
  }

  // 2. Vérifier si un avatar existe dans Supabase Storage
  const existsInStorage = await avatarExistsInStorage(userId);
  
  if (existsInStorage) {
    const storageUrl = getAvatarPublicUrl(userId);
    if (storageUrl) {
      return storageUrl;
    }
  }

  // 3. Fallback sur l'URL de la base de données si disponible
  if (dbAvatarUrl) {
    return dbAvatarUrl;
  }

  return null;
};
