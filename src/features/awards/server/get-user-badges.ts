import db from "@/lib/supabase/db";
import type { AwardCategory } from "../types";

export type UserAwardBadge = {
  year: number;
  category: AwardCategory;
  rank: number;
};

export const getAwardBadgesForUser = async (
  userId: string,
): Promise<UserAwardBadge[]> => {
  if (!userId) return [];

  try {
    const { data, error } = await db.client
      .from("awards_winners")
      .select(
        "year, category, rank, awards_years!inner(status)",
      )
      .eq("winner_type", "user")
      .eq("winner_id", userId)
      .eq("awards_years.status", "published")
      .order("year", { ascending: false })
      .order("rank", { ascending: true });
    if (error) {
      const code = (error as { code?: string }).code;
      if (code !== "PGRST205" && code !== "42P01") {
        console.error("[awards] getAwardBadgesForUser error:", error);
      }
      return [];
    }
    return (data ?? []).map((row) => ({
      year: row.year as number,
      category: row.category as AwardCategory,
      rank: row.rank as number,
    }));
  } catch (error) {
    console.warn("[awards] getAwardBadgesForUser swallowed error:", error);
    return [];
  }
};
