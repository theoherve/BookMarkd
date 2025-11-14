import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

import type { CollaboratorRole, ListSummary, ViewerRole } from "../types";

const mapViewerRole = (role: ViewerRole) => role;

type SupabaseCountAggregate = { count: number | null } | null;

type SupabaseListRow = {
  id: string;
  title: string;
  description: string | null;
  visibility: ListSummary["visibility"];
  is_collaborative: boolean | null;
  updated_at: string;
  list_items: SupabaseCountAggregate | SupabaseCountAggregate[];
  list_collaborators: SupabaseCountAggregate | SupabaseCountAggregate[];
};

type SupabaseCollaboratorRow = {
  role: CollaboratorRole;
  lists?: SupabaseListRow | SupabaseListRow[] | null;
};

const getFirstRelation = <T>(
  value: T | T[] | null | undefined,
): T | null => {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
};

const parseCount = (value: unknown) => {
  if (typeof value === "number") {
    return value;
  }

  if (Array.isArray(value)) {
    return parseCount(value[0]);
  }

  if (typeof value === "object" && value !== null && "count" in value) {
    const countValue = (value as { count?: number | null }).count;

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
        .eq("owner_id", userId)
        .returns<SupabaseListRow[]>(),
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
        .eq("user_id", userId)
        .returns<SupabaseCollaboratorRow[]>(),
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
      const list = getFirstRelation(row.lists);
      if (!list) {
        continue;
      }

      summaries.push({
        id: list.id,
        title: list.title,
        description: list.description ?? null,
        visibility: list.visibility,
        isCollaborative: list.is_collaborative ?? false,
        updatedAt: list.updated_at,
        itemCount: parseCount(list.list_items),
        collaboratorCount: parseCount(list.list_collaborators),
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

