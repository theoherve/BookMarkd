import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

const supabase = createSupabaseServiceClient();

// Buckets constants
export const STORAGE_BUCKETS = {
  COVERS: "covers",
  AVATARS: "avatar",
} as const;

/**
 * Génère un nom de fichier unique pour une cover de livre
 */
const generateCoverFileName = (bookId: string, extension: string = "jpg"): string => {
  return `${bookId}.${extension}`;
};

/**
 * Génère un nom de fichier unique pour un avatar d'utilisateur
 */
const generateAvatarFileName = (userId: string, extension: string = "jpg"): string => {
  return `${userId}.${extension}`;
};

/**
 * Obtient le chemin complet d'une cover dans Supabase Storage
 */
export const getCoverStoragePath = (bookId: string, extension: string = "jpg"): string => {
  return `${STORAGE_BUCKETS.COVERS}/${generateCoverFileName(bookId, extension)}`;
};

/**
 * Obtient le chemin complet d'un avatar dans Supabase Storage
 */
export const getAvatarStoragePath = (userId: string, extension: string = "jpg"): string => {
  return generateAvatarFileName(userId, extension);
};

/**
 * Obtient l'URL publique d'une cover depuis Supabase Storage
 */
export const getCoverPublicUrl = (bookId: string): string | null => {
  const path = getCoverStoragePath(bookId);
  const { data } = supabase.storage.from(STORAGE_BUCKETS.COVERS).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Obtient l'URL publique d'un avatar depuis Supabase Storage
 * Cherche le fichier réel avec n'importe quelle extension
 */
export const getAvatarPublicUrl = async (userId: string): Promise<string | null> => {
  try {
    // Lister les fichiers pour trouver celui qui correspond à l'userId
    const { data: files, error } = await supabase.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .list("", {
        search: userId,
      });

    if (error || !files || files.length === 0) {
      return null;
    }

    // Trouver le fichier qui commence par userId.
    const avatarFile = files.find((file) => file.name.startsWith(`${userId}.`));
    
    if (!avatarFile) {
      return null;
    }

    // Générer l'URL publique avec le nom de fichier réel
    const { data } = supabase.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .getPublicUrl(avatarFile.name);
    
    return data.publicUrl;
  } catch {
    return null;
  }
};

/**
 * Vérifie si une cover existe dans Supabase Storage
 */
export const coverExistsInStorage = async (bookId: string): Promise<boolean> => {
  try {
    // Lister tous les fichiers du bucket covers pour chercher celui qui commence par bookId
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.COVERS)
      .list("", {
        search: bookId,
      });

    if (error) {
      return false;
    }

    // Vérifier si le fichier existe avec différentes extensions possibles
    const fileNameWithoutExt = bookId;
    return data?.some((file) => file.name.startsWith(`${fileNameWithoutExt}.`)) ?? false;
  } catch {
    return false;
  }
};

/**
 * Vérifie si un avatar existe dans Supabase Storage
 */
export const avatarExistsInStorage = async (userId: string): Promise<boolean> => {
  try {
    // Lister tous les fichiers du bucket avatars pour chercher celui qui commence par userId
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .list("", {
        search: userId,
      });

    if (error) {
      return false;
    }

    const fileNameWithoutExt = userId;
    return data?.some((file) => file.name.startsWith(`${fileNameWithoutExt}.`)) ?? false;
  } catch {
    return false;
  }
};

/**
 * Upload une cover de livre vers Supabase Storage
 */
export const uploadCover = async (
  bookId: string,
  file: File | Blob,
  extension: string = "jpg",
): Promise<{ path: string; publicUrl: string } | null> => {
  try {
    const fileName = generateCoverFileName(bookId, extension);

    // Supprimer l'ancienne cover s'elle existe (peu importe l'extension)
    const { data: existingFiles } = await supabase.storage
      .from(STORAGE_BUCKETS.COVERS)
      .list("", {
        search: bookId,
      });

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles
        .filter((f) => f.name.startsWith(`${bookId}.`))
        .map((f) => f.name);
      
      if (filesToDelete.length > 0) {
        await supabase.storage.from(STORAGE_BUCKETS.COVERS).remove(filesToDelete);
      }
    }

    // Uploader la nouvelle cover
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.COVERS)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("[storage] Error uploading cover:", error);
      return null;
    }

    const publicUrl = getCoverPublicUrl(bookId);
    return publicUrl ? { path: data.path, publicUrl } : null;
  } catch (error) {
    console.error("[storage] Error uploading cover:", error);
    return null;
  }
};

/**
 * Upload un avatar d'utilisateur vers Supabase Storage
 */
export const uploadAvatar = async (
  userId: string,
  file: File | Blob,
  extension: string = "jpg",
): Promise<{ path: string; publicUrl: string } | null> => {
  try {
    const fileName = generateAvatarFileName(userId, extension);

    // Supprimer l'ancien avatar s'il existe
    const { data: existingFiles } = await supabase.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .list("", {
        search: userId,
      });

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles
        .filter((f) => f.name.startsWith(`${userId}.`))
        .map((f) => f.name);
      
      if (filesToDelete.length > 0) {
        await supabase.storage.from(STORAGE_BUCKETS.AVATARS).remove(filesToDelete);
      }
    }

    // Uploader le nouvel avatar
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("[storage] Error uploading avatar:", error);
      return null;
    }

    const publicUrl = await getAvatarPublicUrl(userId);
    return publicUrl ? { path: data.path, publicUrl } : null;
  } catch (error) {
    console.error("[storage] Error uploading avatar:", error);
    return null;
  }
};

/**
 * Supprime une cover de Supabase Storage
 */
export const deleteCover = async (bookId: string): Promise<boolean> => {
  try {
    const { data: existingFiles } = await supabase.storage
      .from(STORAGE_BUCKETS.COVERS)
      .list("", {
        search: bookId,
      });

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles
        .filter((f) => f.name.startsWith(`${bookId}.`))
        .map((f) => f.name);
      
      if (filesToDelete.length > 0) {
        const { error } = await supabase.storage
          .from(STORAGE_BUCKETS.COVERS)
          .remove(filesToDelete);
        
        return !error;
      }
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Supprime un avatar de Supabase Storage
 */
export const deleteAvatar = async (userId: string): Promise<boolean> => {
  try {
    const { data: existingFiles } = await supabase.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .list("", {
        search: userId,
      });

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles
        .filter((f) => f.name.startsWith(`${userId}.`))
        .map((f) => f.name);
      
      if (filesToDelete.length > 0) {
        const { error } = await supabase.storage
          .from(STORAGE_BUCKETS.AVATARS)
          .remove(filesToDelete);
        
        return !error;
      }
    }

    return true;
  } catch {
    return false;
  }
};
