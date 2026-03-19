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

/**
 * Fetch a bestseller list for a specific date (for backfill)
 * NYT API: /lists/{date}/{list}.json
 * date format: YYYY-MM-DD
 */
export async function fetchNytimesBestsellerListByDate(
  listName: NytimesListName,
  date: string
): Promise<NytimesListResult | null> {
  const apiKey = process.env.NYT_BOOKS_API_KEY;
  if (!apiKey) {
    console.error("[nytimes] NYT_BOOKS_API_KEY is not set");
    return null;
  }

  const url = `${NYT_API_BASE}/lists/${date}/${listName}.json?api-key=${apiKey}`;

  try {
    const res = await fetch(url, { next: { revalidate: 0 } });

    if (!res.ok) {
      console.error(`[nytimes] API error for list ${listName} date ${date}: ${res.status} ${res.statusText}`);
      return null;
    }

    const json = await res.json();
    const results = json?.results;

    if (!results) {
      console.error(`[nytimes] Unexpected response structure for list ${listName} date ${date}`);
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
    console.error(`[nytimes] Fetch failed for list ${listName} date ${date}:`, err);
    return null;
  }
}

export function getNytimesListLabel(listName: string): string {
  return NYT_LISTS.find((l) => l.name === listName)?.label ?? listName;
}

// ── Semester utilities ─────────────────────────────────────────────────────

export type SemesterInfo = {
  label: string;    // "S1 2025", "S2 2025"
  start: string;    // "2025-01-01"
  end: string;      // "2025-06-30"
  year: number;
  half: 1 | 2;
};

/**
 * Get semester info for a given date.
 * S1 = Jan 1 – Jun 30, S2 = Jul 1 – Dec 31
 */
export function getSemesterForDate(date: Date): SemesterInfo {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed

  if (month < 6) {
    return {
      label: `S1 ${year}`,
      start: `${year}-01-01`,
      end: `${year}-06-30`,
      year,
      half: 1,
    };
  }
  return {
    label: `S2 ${year}`,
    start: `${year}-07-01`,
    end: `${year}-12-31`,
    year,
    half: 2,
  };
}

/**
 * Get the previous semester (the one that just ended).
 * Called on Jan 1 → returns S2 of previous year.
 * Called on Jul 1 → returns S1 of current year.
 */
export function getPreviousSemester(date: Date): SemesterInfo {
  const year = date.getFullYear();
  const month = date.getMonth();

  if (month < 6) {
    // We're in S1 → previous semester is S2 of last year
    return {
      label: `S2 ${year - 1}`,
      start: `${year - 1}-07-01`,
      end: `${year - 1}-12-31`,
      year: year - 1,
      half: 2,
    };
  }
  // We're in S2 → previous semester is S1 of current year
  return {
    label: `S1 ${year}`,
    start: `${year}-01-01`,
    end: `${year}-06-30`,
    year,
    half: 1,
  };
}

/**
 * Generate all Monday dates within a date range (for backfill).
 * NYT publishes new lists every week, aligned to specific dates.
 */
export function getMondaysInRange(startDate: string, endDate: string): string[] {
  const mondays: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  // Advance to first Monday
  while (current.getDay() !== 1) {
    current.setDate(current.getDate() + 1);
  }

  while (current <= end) {
    mondays.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 7);
  }

  return mondays;
}

/**
 * Format semester dates in French for display.
 */
export function formatSemesterLabel(semester: SemesterInfo): string {
  const months = semester.half === 1
    ? "janvier à juin"
    : "juillet à décembre";
  return `${months} ${semester.year}`;
}
