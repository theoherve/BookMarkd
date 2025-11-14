const OPEN_LIBRARY_ENDPOINT = "https://openlibrary.org/search.json";

type OpenLibraryDoc = {
  key: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
};

export type OpenLibraryResult = {
  id: string;
  title: string;
  author: string;
  publicationYear?: number | null;
  coverUrl?: string | null;
};

const buildCoverUrl = (coverId?: number) => {
  if (!coverId) {
    return null;
  }

  return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
};

export const searchOpenLibrary = async (
  query: string,
  limit = 6
): Promise<OpenLibraryResult[]> => {
  try {
    const url = new URL(OPEN_LIBRARY_ENDPOINT);
    url.searchParams.set("title", query);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set(
      "fields",
      "key,title,author_name,first_publish_year,cover_i"
    );

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "BookMarkd/1.0 (https://bookmarkd.app)",
      },
      next: { revalidate: 60 * 60 * 12 },
    });

    if (!response.ok) {
      throw new Error(`Open Library request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data?.docs || !Array.isArray(data.docs)) {
      return [];
    }

    return (data.docs as OpenLibraryDoc[]).slice(0, limit).map((doc) => ({
      id: doc.key.replace("/works/", "openlib:"),
      title: doc.title ?? "Titre inconnu",
      author: doc.author_name?.[0] ?? "Autrice inconnue",
      publicationYear: doc.first_publish_year ?? null,
      coverUrl: buildCoverUrl(doc.cover_i),
    }));
  } catch (error) {
    console.error("[open-library] search error:", error);
    return [];
  }
};

type OpenLibraryWorkResponse = {
  description?:
    | string
    | {
        value?: string;
      };
  covers?: number[];
  subjects?: string[];
};

export const fetchOpenLibraryWorkDetails = async (openLibraryId: string) => {
  try {
    const workPath = openLibraryId.startsWith("openlib:")
      ? `/works/${openLibraryId.replace("openlib:", "")}`
      : openLibraryId.startsWith("/works/")
      ? openLibraryId
      : `/works/${openLibraryId}`;

    const response = await fetch(`https://openlibrary.org${workPath}.json`, {
      headers: {
        "User-Agent": "BookMarkd/1.0 (https://bookmarkd.app)",
      },
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
      return {};
    }

    const data = (await response.json()) as OpenLibraryWorkResponse;
    const description =
      typeof data.description === "string"
        ? data.description
        : data.description?.value ?? null;
    const coverUrl = buildCoverUrl(data.covers?.[0]);
    const subjects = Array.isArray(data.subjects)
      ? data.subjects.slice(0, 8)
      : [];

    return {
      description,
      coverUrl,
      subjects,
    };
  } catch (error) {
    console.error("[open-library] work details error:", error);
    return {};
  }
};
