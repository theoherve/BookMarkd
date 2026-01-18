import { getCoverPublicUrl, coverExistsInStorage } from "./storage";

type GoogleBooksImageLinks = {
  thumbnail?: string;
  smallThumbnail?: string;
  medium?: string;
  large?: string;
};

/**
 * Construit l'URL d'une cover Google Books depuis les imageLinks
 */
const buildCoverUrl = (imageLinks?: GoogleBooksImageLinks): string | null => {
  if (!imageLinks) {
    return null;
  }

  // Préférer large, puis medium, puis thumbnail
  const coverUrl =
    imageLinks.large ||
    imageLinks.medium ||
    imageLinks.thumbnail ||
    imageLinks.smallThumbnail;

  if (!coverUrl) {
    return null;
  }

  // Remplacer http par https pour éviter les problèmes de sécurité
  return coverUrl.replace(/^http:/, "https:");
};

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
 * Obtient l'URL d'une cover de livre avec priorité Supabase Storage puis fallback
 * @param bookId - ID du livre
 * @param dbCoverUrl - URL de la cover depuis la base de données (optionnelle)
 * @param googleBooksCoverUrl - URL de la cover Google Books (optionnelle, si pas dans DB)
 * @returns URL de la cover ou null
 */
export const getBookCoverUrl = async (
  bookId: string,
  dbCoverUrl?: string | null,
  googleBooksCoverUrl?: string | null,
): Promise<string | null> => {
  // Normaliser undefined à null
  const normalizedDbUrl = dbCoverUrl ?? null;
  const normalizedGoogleUrl = googleBooksCoverUrl ?? null;

  // 1. Si l'URL de la DB est déjà une URL Supabase Storage, l'utiliser directement
  if (isSupabaseStorageUrl(normalizedDbUrl)) {
    return normalizedDbUrl;
  }

  // 2. Vérifier si une cover existe dans Supabase Storage
  const existsInStorage = await coverExistsInStorage(bookId);
  
  if (existsInStorage) {
    const storageUrl = getCoverPublicUrl(bookId);
    if (storageUrl) {
      return storageUrl;
    }
  }

  // 3. Fallback sur l'URL de la DB si disponible (peut être Google Books)
  if (normalizedDbUrl) {
    return normalizedDbUrl;
  }

  // 4. Fallback sur Google Books cover si fournie
  if (normalizedGoogleUrl) {
    return normalizedGoogleUrl;
  }

  return null;
};

/**
 * Helper pour obtenir l'URL d'une cover depuis les imageLinks de Google Books
 * @param bookId - ID du livre
 * @param dbCoverUrl - URL de la cover depuis la base de données (optionnelle)
 * @param imageLinks - ImageLinks de Google Books (optionnel)
 * @returns URL de la cover ou null
 */
export const getBookCoverUrlFromImageLinks = async (
  bookId: string,
  dbCoverUrl?: string | null,
  imageLinks?: GoogleBooksImageLinks | null,
): Promise<string | null> => {
  const googleBooksCoverUrl = imageLinks ? buildCoverUrl(imageLinks) : null;
  return getBookCoverUrl(bookId, dbCoverUrl, googleBooksCoverUrl);
};
