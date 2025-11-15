import db from "@/lib/supabase/db";

import type { ListSummary, ViewerRole } from "../types";

const mapViewerRole = (role: ViewerRole) => role;

export const getUserLists = async (userId: string): Promise<ListSummary[]> => {
  const [ownedListsRows, collaboratorRows] = await Promise.all([
    db.client
      .from("lists")
      .select(
        `
        id,
        title,
        description,
        visibility,
        is_collaborative,
        updated_at
      `,
      )
      .eq("owner_id", userId)
      .then((r) =>
        db.toCamel<
          Array<{
            id: string;
            title: string;
            description: string | null;
            visibility: string;
            isCollaborative: boolean | null;
            updatedAt: string;
          }>
        >(r.data ?? []),
      ),
    db.client
      .from("list_collaborators")
      .select(
        `
        role,
        list:list_id (
          id,
          title,
          description,
          visibility,
          is_collaborative,
          updated_at
        )
      `,
      )
      .eq("user_id", userId)
      .then((r) =>
        db.toCamel<
          Array<{
            role: ViewerRole;
            list?: {
              id: string;
              title: string;
              description: string | null;
              visibility: string;
              isCollaborative: boolean | null;
              updatedAt: string;
            };
          }>
        >(r.data ?? []),
      ),
  ]);

  const summaries: ListSummary[] = [];

  // Ajouter les listes possédées
  for (const list of ownedListsRows) {
    // Counts (items, collaborators)
    const [{ count: itemsCount }, { count: collaboratorCount }] =
      await Promise.all([
        db.client
          .from("list_items")
          .select("id", { count: "exact", head: true })
          .eq("list_id", list.id),
        db.client
          .from("list_collaborators")
          .select("user_id", { count: "exact", head: true })
          .eq("list_id", list.id),
      ]);
    summaries.push({
      id: list.id,
      title: list.title,
      description: list.description ?? null,
      visibility: list.visibility as ListSummary["visibility"],
      isCollaborative: list.isCollaborative ?? false,
      updatedAt: list.updatedAt,
      itemCount: itemsCount ?? 0,
      collaboratorCount: collaboratorCount ?? 0,
      viewerRole: mapViewerRole("owner"),
    });
  }

  // Ajouter les listes où l'utilisateur est collaborateur
  for (const collaboratorRow of collaboratorRows) {
    const list = collaboratorRow.list;
    if (!list) {
      continue;
    }
    const [{ count: itemsCount }, { count: collaboratorCount }] =
      await Promise.all([
        db.client
          .from("list_items")
          .select("id", { count: "exact", head: true })
          .eq("list_id", list.id),
        db.client
          .from("list_collaborators")
          .select("user_id", { count: "exact", head: true })
          .eq("list_id", list.id),
      ]);

    summaries.push({
      id: list.id,
      title: list.title,
      description: list.description ?? null,
      visibility: list.visibility as ListSummary["visibility"],
      isCollaborative: list.isCollaborative ?? false,
      updatedAt: list.updatedAt,
      itemCount: itemsCount ?? 0,
      collaboratorCount: collaboratorCount ?? 0,
      viewerRole: mapViewerRole(collaboratorRow.role as ViewerRole),
    });
  }

  return summaries.sort((left, right) => {
    if (left.updatedAt === right.updatedAt) {
      return left.title.localeCompare(right.title, "fr");
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
};

