import db from "@/lib/supabase/db";
import { getUserAvatarUrl } from "@/lib/storage/avatars";

import type { PublicListSummary } from "../types";

export const getPublicLists = async (
  limit = 20,
): Promise<PublicListSummary[]> => {
  const { data: rows, error } = await db.client
    .from("lists")
    .select(
      `
      id,
      title,
      description,
      updated_at,
      owner:owner_id (
        id,
        display_name,
        avatar_url
      )
    `,
    )
    .eq("visibility", "public")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[lists] getPublicLists error:", error);
    return [];
  }

  const lists = (rows ?? []).map((row) =>
    db.toCamel<{
      id: string;
      title: string;
      description: string | null;
      updatedAt: string;
      owner?: { id: string; displayName: string; avatarUrl: string | null };
    }>(row),
  );

  const summaries: PublicListSummary[] = [];

  for (const list of lists) {
    if (!list.owner) continue;

    const { count } = await db.client
      .from("list_items")
      .select("id", { count: "exact", head: true })
      .eq("list_id", list.id);

    const resolvedAvatarUrl = await getUserAvatarUrl(
      list.owner.id,
      list.owner.avatarUrl,
    );

    summaries.push({
      id: list.id,
      title: list.title,
      description: list.description,
      itemCount: count ?? 0,
      updatedAt: list.updatedAt,
      owner: {
        id: list.owner.id,
        displayName: list.owner.displayName,
        avatarUrl: resolvedAvatarUrl,
      },
    });
  }

  return summaries;
};
