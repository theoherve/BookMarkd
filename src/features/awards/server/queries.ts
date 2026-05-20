import db from "@/lib/supabase/db";
import type {
  AwardCategory,
  AwardWinner,
  AwardsYear,
} from "../types";

type WinnerRow = {
  id: string;
  year: number;
  category: AwardCategory;
  rank: number;
  winnerType: AwardWinner["winnerType"];
  winnerId: string | null;
  snapshot: AwardWinner["snapshot"];
  score: number;
  metadata: Record<string, unknown>;
  createdAt: string;
};

type YearRow = {
  year: number;
  status: AwardsYear["status"];
  theme: string | null;
  intro: string | null;
  summary: AwardsYear["summary"];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const isTolerableError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  // Missing table (migration not applied yet) or network failure (build-time
  // with placeholder env vars in CI).
  if (code === "PGRST205" || code === "42P01") return true;
  const name = (error as { name?: string }).name;
  if (name === "TypeError") return true;
  const message = (error as { message?: string }).message ?? "";
  return /fetch failed|ENOTFOUND|ECONNREFUSED|getaddrinfo/i.test(message);
};

const safeAwait = async <T>(
  promise: Promise<{ data: T | null; error: unknown }>,
  fallback: T,
): Promise<T> => {
  try {
    const { data, error } = await promise;
    if (error) {
      if (isTolerableError(error)) return fallback;
      throw error;
    }
    return (data ?? fallback) as T;
  } catch (error) {
    if (isTolerableError(error)) return fallback;
    throw error;
  }
};

export const listAwardsYears = async (): Promise<AwardsYear[]> => {
  const rows = await safeAwait<unknown[]>(
    db.client
      .from("awards_years")
      .select("year, status, theme, intro, summary, published_at, created_at, updated_at")
      .order("year", { ascending: false }) as unknown as Promise<{
      data: unknown[] | null;
      error: unknown;
    }>,
    [],
  );
  return rows.map((row) => db.toCamel<YearRow>(row));
};

export const getAwardsYear = async (
  year: number,
): Promise<AwardsYear | null> => {
  try {
    const { data, error } = await db.client
      .from("awards_years")
      .select("year, status, theme, intro, summary, published_at, created_at, updated_at")
      .eq("year", year)
      .maybeSingle();
    if (error) {
      if (isTolerableError(error)) return null;
      throw error;
    }
    if (!data) return null;
    return db.toCamel<YearRow>(data);
  } catch (error) {
    if (isTolerableError(error)) return null;
    throw error;
  }
};

export const getWinnersForYear = async (
  year: number,
): Promise<AwardWinner[]> => {
  const rows = await safeAwait<unknown[]>(
    db.client
      .from("awards_winners")
      .select("id, year, category, rank, winner_type, winner_id, snapshot, score, metadata, created_at")
      .eq("year", year)
      .order("category", { ascending: true })
      .order("rank", { ascending: true }) as unknown as Promise<{
      data: unknown[] | null;
      error: unknown;
    }>,
    [],
  );
  return rows.map((row) => db.toCamel<WinnerRow>(row));
};

export const getPublishedYears = async (): Promise<number[]> => {
  try {
    const { data, error } = await db.client
      .from("awards_years")
      .select("year")
      .eq("status", "published")
      .order("year", { ascending: false });
    if (error) {
      if (isTolerableError(error)) return [];
      throw error;
    }
    return (data ?? []).map((row) => row.year as number);
  } catch (error) {
    if (isTolerableError(error)) return [];
    throw error;
  }
};

export const getDraftYearsCount = async (): Promise<number> => {
  try {
    const { count, error } = await db.client
      .from("awards_years")
      .select("year", { count: "exact", head: true })
      .eq("status", "draft");
    if (error) {
      if (isTolerableError(error)) return 0;
      throw error;
    }
    return count ?? 0;
  } catch (error) {
    if (isTolerableError(error)) return 0;
    throw error;
  }
};

export const groupWinnersByCategory = (
  winners: AwardWinner[],
): Record<AwardCategory, AwardWinner[]> => {
  const empty = (): AwardWinner[] => [];
  const result: Record<AwardCategory, AwardWinner[]> = {
    book_of_the_year: empty(),
    reader_of_the_year: empty(),
    top_categories: empty(),
    top_reviewer: empty(),
    most_loved_review: empty(),
    trending_wishlist: empty(),
    best_newcomer: empty(),
    feeling_award: empty(),
  };
  for (const w of winners) {
    result[w.category].push(w);
  }
  return result;
};
