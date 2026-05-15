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

  const listIds = lists.filter((l) => l.owner).map((l) => l.id);
  if (listIds.length === 0) return [];

  // Une seule query pour tous les list_items, group côté JS
  const { data: itemRows } = await db.client
    .from("list_items")
    .select("list_id")
    .in("list_id", listIds);

  const countsByListId = new Map<string, number>();
  for (const row of (itemRows ?? []) as Array<{ list_id: string }>) {
    countsByListId.set(row.list_id, (countsByListId.get(row.list_id) ?? 0) + 1);
  }

  // Resolve avatars en parallèle
  const summaries = await Promise.all(
    lists
      .filter((l) => l.owner)
      .map(async (list) => {
        const owner = list.owner!;
        const resolvedAvatarUrl = await getUserAvatarUrl(
          owner.id,
          owner.avatarUrl,
        );
        return {
          id: list.id,
          title: list.title,
          description: list.description,
          itemCount: countsByListId.get(list.id) ?? 0,
          updatedAt: list.updatedAt,
          owner: {
            id: owner.id,
            displayName: owner.displayName,
            avatarUrl: resolvedAvatarUrl,
          },
        } satisfies PublicListSummary;
      }),
  );

  return summaries;
};
