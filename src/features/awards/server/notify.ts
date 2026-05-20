import type { SupabaseClient } from "@supabase/supabase-js";
import type { AwardCategory } from "../types";

type Client = SupabaseClient;

const CHUNK = 1000;

export const chunkInsertNotifications = async <T extends Record<string, unknown>>(
  supabase: Client,
  rows: T[],
): Promise<{ inserted: number }> => {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from("notifications").insert(slice);
    if (error) throw error;
    inserted += slice.length;
  }
  return { inserted };
};

export type WinnerNotificationInput = {
  userId: string;
  year: number;
  category: AwardCategory;
  rank: number;
};

export const notifyAwardsPublished = async (
  supabase: Client,
  year: number,
  winnerInputs: WinnerNotificationInput[],
): Promise<{ announcementInserted: number; winnerInserted: number }> => {
  const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)).toISOString();

  const { data: users, error } = await supabase
    .from("users")
    .select("id")
    .lte("created_at", yearEnd)
    .is("disabled_at", null);
  if (error) throw error;

  const announcementRows = (users ?? []).map((u) => ({
    user_id: u.id as string,
    type: "awards_announcement",
    payload: { year },
  }));

  const { inserted: announcementInserted } = await chunkInsertNotifications(
    supabase,
    announcementRows,
  );

  const winnerRows = winnerInputs.map((w) => ({
    user_id: w.userId,
    type: "awards_winner",
    payload: { year: w.year, category: w.category, rank: w.rank },
  }));

  const { inserted: winnerInserted } = await chunkInsertNotifications(
    supabase,
    winnerRows,
  );

  return { announcementInserted, winnerInserted };
};
