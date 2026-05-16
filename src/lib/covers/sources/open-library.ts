const USER_AGENT = "BookMarkd/1.0 (https://bookmarkd.app)";

const DEBUG = process.env.DEBUG_COVERS === "1";
const dbg = (...args: unknown[]) => {
  if (DEBUG) console.log("[covers/open-library]", ...args);
};

const buildCoverUrl = (coverId: number, size: "M" | "L" = "L") => {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
};

const buildCoverUrlFromOlid = (olid: string, size: "M" | "L" = "L") => {
  return `https://covers.openlibrary.org/b/olid/${olid}-${size}.jpg?default=false`;
};

const buildCoverUrlFromIsbn = (isbn: string, size: "M" | "L" = "L") => {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg?default=false`;
};

const PLACEHOLDER_AUTHORS = new Set([
  "autrice inconnue",
  "auteur inconnu",
  "auteure inconnue",
  "inconnu",
  "inconnue",
  "anonymous",
  "anonyme",
]);

export const isPlaceholderAuthor = (author: string | null | undefined): boolean => {
  if (!author) return true;
  return PLACEHOLDER_AUTHORS.has(author.trim().toLowerCase());
};

type OpenLibraryEditionResponse = {
  covers?: number[];
  works?: Array<{ key: string }>;
};

type OpenLibraryWorkResponse = {
  covers?: number[];
};

type OpenLibrarySearchDoc = {
  cover_i?: number;
  cover_edition_key?: string;
  edition_key?: string[];
  isbn?: string[];
};

type OpenLibrarySearchResponse = {
  docs?: OpenLibrarySearchDoc[];
};

const fetchJson = async <T>(url: string, timeoutMs = 5000): Promise<T | null> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) {
      dbg(`fetchJson !ok ${response.status} ${url}`);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    dbg(`fetchJson threw ${url}`, error);
    return null;
  }
};

export const findOpenLibraryCoverByIsbn = async (
  isbn: string,
): Promise<string | null> => {
  const cleanIsbn = isbn.replace(/[-\s]/g, "");
  if (!cleanIsbn) {
    return null;
  }

  const direct = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg?default=false`;
  try {
    const head = await fetch(direct, {
      method: "HEAD",
      headers: { "User-Agent": USER_AGENT },
    });
    dbg(`isbn HEAD ${direct} → ${head.status} len=${head.headers.get("content-length")}`);
    if (head.ok && head.status === 200) {
      const len = head.headers.get("content-length");
      if (!len || Number.parseInt(len, 10) > 1024) {
        return direct;
      }
    }
  } catch (error) {
    dbg(`isbn HEAD threw`, error);
  }

  const edition = await fetchJson<OpenLibraryEditionResponse>(
    `https://openlibrary.org/isbn/${cleanIsbn}.json`,
  );

  if (edition?.covers?.length) {
    return buildCoverUrl(edition.covers[0]);
  }

  if (edition?.works?.[0]?.key) {
    const work = await fetchJson<OpenLibraryWorkResponse>(
      `https://openlibrary.org${edition.works[0].key}.json`,
    );
    if (work?.covers?.length) {
      return buildCoverUrl(work.covers[0]);
    }
  }

  return null;
};

export const findOpenLibraryCoverByTitleAuthor = async (
  title: string,
  author: string,
): Promise<string | null> => {
  if (!title) {
    return null;
  }

  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("title", title);
  if (author && !isPlaceholderAuthor(author)) {
    url.searchParams.set("author", author);
  }
  url.searchParams.set("limit", "5");
  url.searchParams.set("fields", "cover_i,cover_edition_key,edition_key,isbn");

  const data = await fetchJson<OpenLibrarySearchResponse>(url.toString());

  if (!data?.docs?.length) {
    dbg(`search no docs ${url.toString()}`);
    return null;
  }

  for (const doc of data.docs) {
    if (doc.cover_i) {
      return buildCoverUrl(doc.cover_i);
    }
  }

  for (const doc of data.docs) {
    if (doc.cover_edition_key) {
      dbg(`search via cover_edition_key=${doc.cover_edition_key}`);
      return buildCoverUrlFromOlid(doc.cover_edition_key);
    }
  }

  for (const doc of data.docs) {
    if (doc.isbn?.[0]) {
      dbg(`search via isbn=${doc.isbn[0]}`);
      return buildCoverUrlFromIsbn(doc.isbn[0]);
    }
  }

  for (const doc of data.docs) {
    if (doc.edition_key?.[0]) {
      dbg(`search via edition_key=${doc.edition_key[0]}`);
      return buildCoverUrlFromOlid(doc.edition_key[0]);
    }
  }

  dbg(`search ${data.docs.length} docs but no cover/olid/isbn`);
  return null;
};
