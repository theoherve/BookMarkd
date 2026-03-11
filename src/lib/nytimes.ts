import type { NytimesBook, NytimesListResult } from "@/types/editorial";

const NYT_API_BASE = "https://api.nytimes.com/svc/books/v3";

// Lists we poll weekly (most relevant for international readers)
export const NYT_LISTS = [
  { name: "hardcover-fiction", label: "Best-sellers Fiction" },
  { name: "hardcover-nonfiction", label: "Best-sellers Non-fiction" },
] as const;

export type NytimesListName = (typeof NYT_LISTS)[number]["name"];

export async function fetchNytimesBestsellerList(
  listName: NytimesListName
): Promise<NytimesListResult | null> {
  const apiKey = process.env.NYT_BOOKS_API_KEY;
  if (!apiKey) {
    console.error("[nytimes] NYT_BOOKS_API_KEY is not set");
    return null;
  }

  const url = `${NYT_API_BASE}/lists/current/${listName}.json?api-key=${apiKey}`;

  try {
    const res = await fetch(url, { next: { revalidate: 0 } });

    if (!res.ok) {
      console.error(`[nytimes] API error for list ${listName}: ${res.status} ${res.statusText}`);
      return null;
    }

    const json = await res.json();
    const results = json?.results;

    if (!results) {
      console.error(`[nytimes] Unexpected response structure for list ${listName}`);
      return null;
    }

    return {
      list_name: results.list_name,
      list_name_encoded: results.list_name_encoded,
      bestsellers_date: results.bestsellers_date,
      published_date: results.published_date,
      books: (results.books ?? []).map(
        (b: Record<string, unknown>): NytimesBook => ({
          rank: b.rank as number,
          title: b.title as string,
          author: b.author as string,
          description: b.description as string,
          primary_isbn13: b.primary_isbn13 as string,
          book_image: b.book_image as string,
        })
      ),
    };
  } catch (err) {
    console.error(`[nytimes] Fetch failed for list ${listName}:`, err);
    return null;
  }
}

export function getNytimesListLabel(listName: string): string {
  return NYT_LISTS.find((l) => l.name === listName)?.label ?? listName;
}
