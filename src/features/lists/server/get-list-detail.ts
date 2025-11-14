import { notFound } from "next/navigation";

import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

import type { ListDetail, ViewerRole } from "../types";

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
    .maybeSingle();

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
          role: entry.role,
        })),
      )
    : null;

  if (!viewerRole && data.visibility !== "public") {
    notFound();
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description ?? null,
    visibility: data.visibility,
    isCollaborative: data.is_collaborative ?? false,
    owner: {
      id: data.owner?.id ?? data.owner_id,
      displayName: data.owner?.display_name ?? "Utilisateur·rice",
      avatarUrl: data.owner?.avatar_url ?? null,
    },
    collaborators: rawCollaborators.map((entry) => ({
      userId: entry.user?.id ?? entry.user_id,
      displayName: entry.user?.display_name ?? "Collaborateur·rice",
      avatarUrl: entry.user?.avatar_url ?? null,
      role: entry.role,
    })),
    viewerRole: viewerRole ?? "viewer",
    items: (data.list_items ?? [])
      .filter((item) => item.book !== null)
      .map((item) => ({
        id: item.id,
        position: item.position,
        note: item.note ?? null,
        book: {
          id: item.book.id,
          title: item.book.title,
          author: item.book.author,
          coverUrl: item.book.cover_url ?? null,
          averageRating: typeof item.book.average_rating === "number" ? item.book.average_rating : null,
        },
      }))
      .sort((left, right) => left.position - right.position),
    updatedAt: data.updated_at,
  };
};

