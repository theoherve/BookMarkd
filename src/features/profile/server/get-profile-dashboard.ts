import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

import type { ProfileDashboard, ReadingStats } from "../types";

const buildReadingStats = (rows: Array<{ status: string | null }>): ReadingStats => {
  const initial: ReadingStats = {
    toRead: 0,
    reading: 0,
    finished: 0,
  };

  return rows.reduce((accumulator, row) => {
    if (!row.status) {
      return accumulator;
    }

    if (row.status === "to_read") {
      accumulator.toRead += 1;
    }

    if (row.status === "reading") {
      accumulator.reading += 1;
    }

    if (row.status === "finished") {
      accumulator.finished += 1;
    }

    return accumulator;
  }, initial);
};

export const getProfileDashboard = async (userId: string): Promise<ProfileDashboard> => {
  const supabase = createSupabaseServiceClient();

  const [
    { data: userRow, error: userError },
    ownedListsResponse,
    collaborationsResponse,
    { data: readingRows, error: readingError },
    recommendationsResponse,
  ] = await Promise.all([
    supabase
      .from("users")
      .select("display_name, email, bio, avatar_url")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("lists")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId),
    supabase
      .from("list_collaborators")
      .select("list_id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("user_books")
      .select("status")
      .eq("user_id", userId),
    supabase
      .from("recommendations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  if (userError) {
    throw userError;
  }

  if (!userRow) {
    throw new Error("Utilisateur introuvable.");
  }

  if (readingError) {
    throw readingError;
  }

  const ownedLists = ownedListsResponse.count ?? 0;
  const collaborativeLists = collaborationsResponse.count ?? 0;
  const recommendationsCount = recommendationsResponse.count ?? 0;
  const readingStats = buildReadingStats(readingRows ?? []);

  return {
    displayName: userRow.display_name ?? "Utilisateur·rice",
    email: userRow.email ?? "",
    bio: userRow.bio ?? null,
    avatarUrl: userRow.avatar_url ?? null,
    ownedLists,
    collaborativeLists,
    recommendationsCount,
    readingStats,
  };
};

