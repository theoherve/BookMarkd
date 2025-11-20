const GOOGLE_BOOKS_API_ENDPOINT = "https://www.googleapis.com/books/v1/volumes";

const GOOGLE_BOOKS_QUOTA_LIMIT = 950; // Limite de sécurité (1000 req/jour max)

type GoogleBooksVolumeInfo = {
  title?: string;
  authors?: string[];
  publishedDate?: string;
  description?: string;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
    medium?: string;
    large?: string;
  };
  industryIdentifiers?: Array<{
    type: string;
    identifier: string;
  }>;
  categories?: string[];
  language?: string;
  publisher?: string;
  pageCount?: number;
};

type GoogleBooksVolume = {
  id: string;
  volumeInfo?: GoogleBooksVolumeInfo;
};

type GoogleBooksSearchResponse = {
  items?: GoogleBooksVolume[];
  totalItems?: number;
};

export type GoogleBooksResult = {
  id: string;
  title: string;
  author: string;
  publicationYear?: number | null;
  coverUrl?: string | null;
  summary?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  language?: string | null;
  categories?: string[];
};

const buildCoverUrl = (imageLinks?: GoogleBooksVolumeInfo["imageLinks"]) => {
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

const extractYear = (publishedDate?: string): number | null => {
  if (!publishedDate) {
    return null;
  }

  // Format peut être "2024", "2024-01", "2024-01-15"
  const yearMatch = publishedDate.match(/^(\d{4})/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    if (year > 0 && year <= new Date().getFullYear() + 10) {
      return year;
    }
  }

  return null;
};

const extractISBN = (
  industryIdentifiers?: GoogleBooksVolumeInfo["industryIdentifiers"]
): string | null => {
  if (!industryIdentifiers || industryIdentifiers.length === 0) {
    return null;
  }

  // Préférer ISBN_13, sinon ISBN_10
  const isbn13 = industryIdentifiers.find((id) => id.type === "ISBN_13");
  if (isbn13?.identifier) {
    return isbn13.identifier;
  }

  const isbn10 = industryIdentifiers.find((id) => id.type === "ISBN_10");
  if (isbn10?.identifier) {
    return isbn10.identifier;
  }

  return null;
};

const getApiKey = (): string | null => {
  return process.env.GOOGLE_BOOKS_API_KEY || null;
};

export const searchGoogleBooks = async (
  query: string,
  limit = 6
): Promise<GoogleBooksResult[]> => {
  try {
    const apiKey = getApiKey();

    if (!apiKey) {
      console.warn("[google-books] API key not configured");
      return [];
    }

    const url = new URL(GOOGLE_BOOKS_API_ENDPOINT);
    url.searchParams.set("q", query);
    url.searchParams.set("maxResults", String(limit));
    url.searchParams.set("key", apiKey);
    url.searchParams.set("langRestrict", "fr"); // Prioriser les livres français

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "BookMarkd/1.0 (https://bookmarkd.app)",
      },
      next: { revalidate: 60 * 60 * 12 }, // Cache 12h
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }

      // Gestion spécifique des erreurs 403 (Forbidden)
      if (response.status === 403) {
        const reason = errorData?.error?.errors?.[0]?.reason || "unknown";
        
        if (reason === "API_KEY_HTTP_REFERRER_BLOCKED") {
          console.warn(
            "[google-books] API key blocked by HTTP referrer restrictions. " +
            "Pour les appels serveur, désactivez les restrictions HTTP referrer dans Google Cloud Console. " +
            "Basculement vers OpenLibrary..."
          );
          // Retourner un tableau vide pour déclencher le fallback
          return [];
        }
        
        console.error(
          `[google-books] API error 403: ${errorData?.error?.message || response.statusText}`
        );
        return [];
      }

      // Autres erreurs (401, 429, etc.)
      console.error(
        `[google-books] API error: ${response.status} ${response.statusText}`,
        errorText
      );
      
      // Pour les erreurs non-403, on retourne un tableau vide pour déclencher le fallback
      return [];
    }

    const data = (await response.json()) as GoogleBooksSearchResponse;

    if (!data?.items || !Array.isArray(data.items)) {
      return [];
    }

    return data.items.slice(0, limit).map((item) => {
      const volumeInfo = item.volumeInfo || {};
      const authors = volumeInfo.authors || [];
      const author = authors[0] || "Auteur inconnu";
      const title = volumeInfo.title || "Titre inconnu";

      return {
        id: `googlebooks:${item.id}`,
        title,
        author,
        publicationYear: extractYear(volumeInfo.publishedDate),
        coverUrl: buildCoverUrl(volumeInfo.imageLinks),
        summary: volumeInfo.description || null,
        isbn: extractISBN(volumeInfo.industryIdentifiers),
        publisher: volumeInfo.publisher || null,
        language: volumeInfo.language || null,
        categories: volumeInfo.categories || [],
      };
    });
  } catch (error) {
    console.error("[google-books] search error:", error);
    return [];
  }
};

type GoogleBooksVolumeResponse = {
  volumeInfo?: GoogleBooksVolumeInfo;
};

export const fetchGoogleBooksDetails = async (googleBooksId: string) => {
  try {
    const apiKey = getApiKey();

    if (!apiKey) {
      console.warn("[google-books] API key not configured");
      return {};
    }

    // Extraire l'ID du format "googlebooks:OL123456W" ou "OL123456W"
    const volumeId = googleBooksId.startsWith("googlebooks:")
      ? googleBooksId.replace("googlebooks:", "")
      : googleBooksId;

    const url = new URL(`${GOOGLE_BOOKS_API_ENDPOINT}/${volumeId}`);
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "BookMarkd/1.0 (https://bookmarkd.app)",
      },
      next: { revalidate: 60 * 60 * 24 }, // Cache 24h
    });

    if (!response.ok) {
      return {};
    }

    const data = (await response.json()) as GoogleBooksVolumeResponse;
    const volumeInfo = data.volumeInfo || {};

    const description = volumeInfo.description || null;
    const coverUrl = buildCoverUrl(volumeInfo.imageLinks);
    const categories = Array.isArray(volumeInfo.categories)
      ? volumeInfo.categories.slice(0, 8)
      : [];

    return {
      description,
      coverUrl,
      categories,
      isbn: extractISBN(volumeInfo.industryIdentifiers),
      publisher: volumeInfo.publisher || null,
      language: volumeInfo.language || null,
      pageCount: volumeInfo.pageCount || null,
    };
  } catch (error) {
    console.error("[google-books] volume details error:", error);
    return {};
  }
};

// Fonction pour vérifier si on peut utiliser Google Books (quota)
export const canUseGoogleBooks = async (): Promise<boolean> => {
  try {
    // Vérifier si l'API key est configurée
    const apiKey = getApiKey();
    if (!apiKey) {
      return false;
    }

    // Importer dynamiquement pour éviter les problèmes de dépendance circulaire
    const { checkGoogleBooksQuota } = await import(
      "@/lib/google-books/quota-tracker"
    );

    const quotaUsed = await checkGoogleBooksQuota();
    return quotaUsed < GOOGLE_BOOKS_QUOTA_LIMIT;
  } catch (error) {
    console.error("[google-books] quota check error:", error);
    // En cas d'erreur, on refuse par sécurité
    return false;
  }
};

// Export de la limite pour utilisation ailleurs
export { GOOGLE_BOOKS_QUOTA_LIMIT };

