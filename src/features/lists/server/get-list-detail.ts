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
        book:book_id ( id, title, author, cover_url, summary, publication_year, average_rating, book_tags ( tag:tag_id ( id, name ) ) )
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
        summary: string | null;
        publicationYear: number | null;
        averageRating: number | null;
        bookTags?: Array<{ tag?: { id: string; name: string } }>;
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

  // Autoriser l'accès via lien direct pour les listes "unlisted".
  // Bloquer uniquement si la liste est "private" et que l'utilisateur n'a aucun rôle.
  if (!viewerRole && list.visibility === "private") {
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

  // Fetch readers count for each book in the list
  const bookIds = (list.items ?? [])
    .map((item) => item.book?.id)
    .filter((id): id is string => Boolean(id));

  const readersCountByBook = new Map<string, number>();
  if (bookIds.length > 0) {
    const { data: readersRows } = await db.client
      .from("user_books")
      .select("book_id")
      .in("book_id", bookIds);
    for (const row of readersRows ?? []) {
      const { bookId } = db.toCamel<{ bookId: string }>(row);
      readersCountByBook.set(bookId, (readersCountByBook.get(bookId) ?? 0) + 1);
    }
  }

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
        summary: (item.book?.summary as string | null) ?? null,
        publicationYear: item.book?.publicationYear ?? null,
        averageRating:
          typeof item.book?.averageRating === "number"
            ? item.book!.averageRating!
            : null,
        tags: (item.book?.bookTags ?? [])
          .filter((bt) => Boolean(bt.tag))
          .map((bt) => ({ id: bt.tag!.id, name: bt.tag!.name })),
        readersCount: readersCountByBook.get(item.book?.id as string) ?? 0,
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

