import { searchGoogleBooks, canUseGoogleBooks } from "@/lib/google-books";
import { incrementGoogleBooksQuota } from "@/lib/google-books/quota-tracker";

const DEBUG = process.env.DEBUG_COVERS === "1";
const dbg = (...args: unknown[]) => {
  if (DEBUG) console.log("[covers/google-books-search]", ...args);
};

const upgradeZoom = (url: string): string => {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname.includes("books.google.") ||
      parsed.hostname.includes("books.googleusercontent.com")
    ) {
      parsed.searchParams.set("zoom", "3");
      parsed.searchParams.set("img", "1");
      parsed.searchParams.set("printsec", "frontcover");
      parsed.searchParams.delete("edge");
      return parsed.toString().replace(/^http:/, "https:");
    }
  } catch {
    // ignore
  }
  return url.replace(/^http:/, "https:");
};

export const findGoogleBooksCoverBySearch = async (
  title: string,
  author: string,
): Promise<string | null> => {
  if (!title) {
    return null;
  }

  const canUse = await canUseGoogleBooks();
  if (!canUse) {
    dbg("quota exhausted, skipping");
    return null;
  }

  const quotaOk = await incrementGoogleBooksQuota();
  if (!quotaOk) {
    dbg("quota increment refused");
    return null;
  }

  const query = author ? `${title} ${author}` : title;
  let results = await searchGoogleBooks(query, 3);

  if (!results.length) {
    dbg(`no results for "${query}", retrying in 2s`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    results = await searchGoogleBooks(query, 3);
  }

  if (!results.length) {
    dbg(`no results after retry for "${query}"`);
    return null;
  }

  for (const result of results) {
    if (result.coverUrl) {
      return upgradeZoom(result.coverUrl);
    }
  }

  dbg(`${results.length} results but none with cover`);
  return null;
};
