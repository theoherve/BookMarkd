import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

import type { ListSummary, ViewerRole } from "../types";

const mapViewerRole = (role: ViewerRole) => role;

const parseCount = (value: unknown) => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "object" && value !== null && "count" in value) {
    const countValue = (value as { count?: number }).count;

    if (typeof countValue === "number") {
      return countValue;
    }
  }

  return 0;
};

export const getUserLists = async (userId: string): Promise<ListSummary[]> => {
  const supabase = createSupabaseServiceClient();

  const [{ data: ownedLists, error: ownedError }, { data: collaboratorRows, error: collaboratorError }] =
    await Promise.all([
      supabase
        .from("lists")
        .select(
          `
          id,
          title,
          description,
          visibility,
          is_collaborative,
          updated_at,
          list_items(count),
          list_collaborators(count)
        `,
        )
        .eq("owner_id", userId),
      supabase
        .from("list_collaborators")
        .select(
          `
          role,
          lists (
            id,
            title,
            description,
            visibility,
            is_collaborative,
            updated_at,
            list_items(count),
            list_collaborators(count)
          )
        `,
        )
        .eq("user_id", userId),
    ]);

  if (ownedError) {
    throw ownedError;
  }

  if (collaboratorError) {
    throw collaboratorError;
  }

  const summaries: ListSummary[] = [];

  if (ownedLists) {
    for (const list of ownedLists) {
      summaries.push({
        id: list.id,
        title: list.title,
        description: list.description ?? null,
        visibility: list.visibility,
        isCollaborative: list.is_collaborative ?? false,
        updatedAt: list.updated_at,
        itemCount: parseCount(list.list_items),
        collaboratorCount: parseCount(list.list_collaborators),
        viewerRole: mapViewerRole("owner"),
      });
    }
  }

  if (collaboratorRows) {
    for (const row of collaboratorRows) {
      if (!row.lists) {
        continue;
      }

      summaries.push({
        id: row.lists.id,
        title: row.lists.title,
        description: row.lists.description ?? null,
        visibility: row.lists.visibility,
        isCollaborative: row.lists.is_collaborative ?? false,
        updatedAt: row.lists.updated_at,
        itemCount: parseCount(row.lists.list_items),
        collaboratorCount: parseCount(row.lists.list_collaborators),
        viewerRole: mapViewerRole(row.role),
      });
    }
  }

  return summaries.sort((left, right) => {
    if (left.updatedAt === right.updatedAt) {
      return left.title.localeCompare(right.title, "fr");
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
};

