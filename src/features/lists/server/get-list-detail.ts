import { notFound } from "next/navigation";

import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

import type { CollaboratorRole, ListDetail, ViewerRole } from "../types";

type SupabaseUser = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type SupabaseCollaborator = {
  user_id: string;
  role: CollaboratorRole;
  user?: SupabaseUser | SupabaseUser[] | null;
};

type SupabaseBook = {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  average_rating: number | null;
};

type SupabaseListItem = {
  id: string;
  position: number;
  note: string | null;
  book?: SupabaseBook | SupabaseBook[] | null;
};

type SupabaseListDetail = {
  id: string;
  title: string;
  description: string | null;
  visibility: ListDetail["visibility"];
  is_collaborative: boolean | null;
  owner_id: string;
  updated_at: string;
  owner?: SupabaseUser | SupabaseUser[] | null;
  list_collaborators?: SupabaseCollaborator[] | null;
  list_items?: SupabaseListItem[] | null;
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
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("lists")
    .select(
      `
        id,
        title,
        description,
        visibility,
        is_collaborative,
        owner_id,
        updated_at,
        owner:users (
          id,
          display_name,
          avatar_url
        ),
        list_collaborators (
          user_id,
          role,
          user:users (
            id,
            display_name,
            avatar_url
          )
        ),
        list_items (
          id,
          position,
          note,
          book:books (
            id,
            title,
            author,
            cover_url,
            average_rating
          )
        )
      `,
    )
    .eq("id", listId)
    .maybeSingle()
    .returns<SupabaseListDetail>();

  if (error) {
    throw error;
  }

  if (!data) {
    notFound();
  }

  const rawCollaborators = data.list_collaborators ?? [];
  const viewerRole = viewerId
    ? inferViewerRole(
        data.owner_id,
        viewerId,
        rawCollaborators.map((entry) => ({
          user_id: entry.user_id,
          role: entry.role as ViewerRole,
        })),
      )
    : null;

  if (!viewerRole && data.visibility !== "public") {
    notFound();
  }

  const owner = getFirstRelation(data.owner);
  const collaborators = rawCollaborators.map((entry) => {
    const collaboratorUser = getFirstRelation(entry.user);
    return {
      userId: collaboratorUser?.id ?? entry.user_id,
      displayName: collaboratorUser?.display_name ?? "Collaborateur·rice",
      avatarUrl: collaboratorUser?.avatar_url ?? null,
      role: entry.role,
    };
  });

  const items = (data.list_items ?? [])
    .map((item) => {
      const book = getFirstRelation(item.book);
      if (!book) {
        return null;
      }

      return {
        id: item.id,
        position: item.position,
        note: item.note ?? null,
        book: {
          id: book.id,
          title: book.title,
          author: book.author,
          coverUrl: book.cover_url ?? null,
          averageRating:
            typeof book.average_rating === "number" ? book.average_rating : null,
        },
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((left, right) => left.position - right.position);

  return {
    id: data.id,
    title: data.title,
    description: data.description ?? null,
    visibility: data.visibility,
    isCollaborative: data.is_collaborative ?? false,
    owner: {
      id: owner?.id ?? data.owner_id,
      displayName: owner?.display_name ?? "Utilisateur·rice",
      avatarUrl: owner?.avatar_url ?? null,
    },
    collaborators,
    viewerRole: viewerRole ?? "viewer",
    items,
    updatedAt: data.updated_at,
  };
};

