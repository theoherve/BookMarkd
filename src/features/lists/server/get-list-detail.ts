import { notFound } from "next/navigation";

import db from "@/lib/supabase/db";

import type { CollaboratorRole, ListDetail, ViewerRole } from "../types";


const inferViewerRole = (
  ownerId: string,
  viewerId: string,
  collaborators: Array<{ user_id: string; role: ViewerRole }>,
): ViewerRole | null => {
  if (ownerId === viewerId) {
    return "owner";
  }

  const collaborator = collaborators.find((entry) => entry.user_id === viewerId);

  if (!collaborator) {
    return null;
  }

  return collaborator.role;
};

export const getListDetail = async (
  listId: string,
  viewerId: string | null,
): Promise<ListDetail> => {
  // Fetch list with joins for owner, collaborators, and items
  const { data: listRow, error } = await db.client
    .from("lists")
    .select(
      `
      id,
      title,
      description,
      visibility,
      is_collaborative,
      updated_at,
      owner:owner_id ( id, display_name, avatar_url ),
      collaborators:list_collaborators ( role, user:user_id ( id, display_name, avatar_url ) ),
      items:list_items (
        id,
        position,
        note,
        book:book_id ( id, title, author, cover_url, average_rating )
      )
    `,
    )
    .eq("id", listId)
    .maybeSingle();

  if (error) {
    console.error("[lists] getListDetail error:", error);
    notFound();
  }

  if (!listRow) {
    notFound();
  }

  const list = db.toCamel<{
    id: string;
    title: string;
    description: string | null;
    visibility: string;
    isCollaborative: boolean | null;
    updatedAt: string;
    owner?: { id: string; displayName: string | null; avatarUrl: string | null };
    collaborators: Array<{ role: ViewerRole; user?: { id: string; displayName: string | null; avatarUrl: string | null } }>;
    items: Array<{
      id: string;
      position: number;
      note: string | null;
      book?: {
        id: string;
        title: string;
        author: string;
        coverUrl: string | null;
        averageRating: number | null;
      };
    }>;
  }>(listRow);

  const rawCollaborators = list.collaborators ?? [];
  const viewerRole = viewerId
    ? inferViewerRole(
        // Note: ownerId is the list owner id
        (list.owner?.id ?? ""),
        viewerId,
        rawCollaborators.map((entry) => ({
          user_id: entry.user?.id ?? "",
          role: entry.role,
        })),
      )
    : null;

  if (!viewerRole && list.visibility !== "public") {
    notFound();
  }

  const collaborators = rawCollaborators
    .filter((entry) => Boolean(entry.user))
    .map((entry) => ({
      userId: entry.user!.id as string,
      displayName: (entry.user!.displayName as string | null) ?? "Collaborateur·rice",
      avatarUrl: (entry.user!.avatarUrl as string | null) ?? null,
      role: entry.role as CollaboratorRole,
    }));

  const items = (list.items ?? [])
    .map((item) => ({
      id: item.id,
      position: item.position,
      note: item.note ?? null,
      book: {
        id: item.book?.id as string,
        title: item.book?.title as string,
        author: item.book?.author as string,
        coverUrl: (item.book?.coverUrl as string | null) ?? null,
        averageRating:
          typeof item.book?.averageRating === "number"
            ? item.book!.averageRating!
            : null,
      },
    }))
    .sort((left, right) => left.position - right.position);

  return {
    id: list.id,
    title: list.title,
    description: list.description ?? null,
    visibility: list.visibility as ListDetail["visibility"],
    isCollaborative: list.isCollaborative ?? false,
    owner: {
      id: (list.owner?.id as string) ?? "",
      displayName: list.owner?.displayName ?? "Utilisateur·rice",
      avatarUrl: list.owner?.avatarUrl ?? null,
    },
    collaborators,
    viewerRole: viewerRole ?? "viewer",
    items,
    updatedAt: list.updatedAt,
  };
};

