"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth/session";
import db from "@/lib/supabase/db";
import { resolveSessionUserId } from "@/lib/auth/user";
import { getUserLists } from "@/features/lists/server/get-user-lists";
import type { ListSummary } from "@/features/lists/types";

type BaseActionResult =
  | { success: true }
  | { success: false; message: string };

type CreateListResult =
  | { success: true; listId: string }
  | { success: false; message: string };

const assertAuthenticatedUser = async () => {
  const session = await getCurrentSession();

  return resolveSessionUserId(session);
};

const loadListMembership = async (
  listId: string,
  userId: string,
) => {
  const { data: list, error } = await db.client
    .from("lists")
    .select(
      `
      id,
      owner_id,
      collaborators:list_collaborators(role, user_id)
    `,
    )
    .eq("id", listId)
    .maybeSingle();

  if (error) {
    console.error("[lists] loadListMembership error:", error);
    return null;
  }

  if (!list) {
    return null;
  }

  if (list.owner_id === userId) {
    return "owner" as const;
  }

  const collaborators =
    ((list as { collaborators?: Array<{ role: "editor" | "viewer"; user_id: string }> })
      .collaborators) ?? [];
  const collaborator = collaborators.find((c) => c.user_id === userId);

  if (!collaborator) {
    return null;
  }

  return (collaborator.role as "editor" | "viewer") ?? null;
};

const isEditorRole = (
  membership: "owner" | "editor" | "viewer" | null,
): membership is "owner" | "editor" => {
  return membership === "owner" || membership === "editor";
};

export const getMyLists = async (): Promise<ListSummary[] | null> => {
  const userId = await assertAuthenticatedUser();
  if (!userId) {
    return null;
  }
  return getUserLists(userId);
};

export const createList = async (formData: FormData): Promise<CreateListResult> => {
  const userId = await assertAuthenticatedUser();

  if (!userId) {
    return {
      success: false,
      message: "Vous devez être connecté·e pour créer une liste.",
    };
  }

  const title = formData.get("title");
  const description = formData.get("description");
  const visibility = formData.get("visibility");
  const isCollaborative = formData.get("isCollaborative") === "on";

  if (typeof title !== "string" || title.trim().length < 3) {
    return {
      success: false,
      message: "Le titre doit contenir au moins 3 caractères.",
    };
  }

  const allowedVisibilities = ["public", "unlisted", "private"] as const;

  if (
    typeof visibility !== "string" ||
    !allowedVisibilities.includes(visibility as (typeof allowedVisibilities)[number])
  ) {
    return {
      success: false,
      message: "La visibilité sélectionnée est invalide.",
    };
  }

  try {
    const { data: newList, error } = await db.client
      .from("lists")
      .insert([
        {
          owner_id: userId,
          title: title.trim(),
          description:
            typeof description === "string" ? description.trim() : null,
          visibility,
          is_collaborative: isCollaborative,
        },
      ])
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    revalidatePath("/lists");

    return {
      success: true,
      listId: newList.id as string,
    };
  } catch (error) {
    console.error("[lists] createList error:", error);
    return {
      success: false,
      message: "Impossible de créer la liste pour le moment.",
    };
  }
};

export const addBookToList = async (
  listId: string,
  bookId: string,
  note: string | null,
): Promise<BaseActionResult> => {
  const userId = await assertAuthenticatedUser();

  if (!userId) {
    return {
      success: false,
      message: "Connectez-vous pour modifier cette liste.",
    };
  }

  const membership = await loadListMembership(listId, userId);

  if (!isEditorRole(membership)) {
    return {
      success: false,
      message: "Vous n’avez pas les droits d’édition sur cette liste.",
    };
  }

  try {
    // Vérifier si le livre est déjà dans la liste
    const { data: existingItem, error: existingError } = await db.client
      .from("list_items")
      .select("id")
      .eq("list_id", listId)
      .eq("book_id", bookId)
      .maybeSingle();

    if (existingError && existingError.code !== "PGRST116") {
      // PGRST116: maybeSingle with 0 rows
      throw existingError;
    }

    if (existingItem) {
      return {
        success: false,
        message: "Ce livre est déjà présent dans la liste.",
      };
    }

    // Trouver la dernière position
    const { data: lastRows, error: lastError } = await db.client
      .from("list_items")
      .select("position")
      .eq("list_id", listId)
      .order("position", { ascending: false })
      .limit(1);

    if (lastError) {
      throw lastError;
    }

    const lastPosition = (lastRows?.[0]?.position as number | undefined) ?? 0;
    const nextPosition = lastPosition
      ? lastPosition + 1
      : 1;

    const { error: insertError } = await db.client.from("list_items").insert([
      {
        list_id: listId,
        book_id: bookId,
        position: nextPosition,
        note: note ? note.trim() : null,
      },
    ]);

    if (insertError) {
      throw insertError;
    }
  } catch (error) {
    console.error("[lists] addBookToList error:", error);
    return {
      success: false,
      message: "Impossible d'ajouter ce livre pour le moment.",
    };
  }

  revalidatePath(`/lists/${listId}`);
  revalidatePath("/lists");

  return { success: true };
};

export const removeListItem = async (
  listId: string,
  listItemId: string,
): Promise<BaseActionResult> => {
  const userId = await assertAuthenticatedUser();

  if (!userId) {
    return {
      success: false,
      message: "Connectez-vous pour modifier cette liste.",
    };
  }

  const membership = await loadListMembership(listId, userId);

  if (!isEditorRole(membership)) {
    return {
      success: false,
      message: "Vous n’avez pas les droits d’édition sur cette liste.",
    };
  }

  try {
    // Vérifier que l'élément appartient bien à la liste avant de le supprimer
    const { data: item, error: itemError } = await db.client
      .from("list_items")
      .select("list_id")
      .eq("id", listItemId)
      .maybeSingle();

    if (itemError) {
      throw itemError;
    }

    if (!item || (item.list_id as string) !== listId) {
      return {
        success: false,
        message: "Cet élément n'appartient pas à cette liste.",
      };
    }

    const { error: deleteError } = await db.client
      .from("list_items")
      .delete()
      .eq("id", listItemId);

    if (deleteError) {
      throw deleteError;
    }
  } catch (error) {
    console.error("[lists] removeListItem error:", error);
    return {
      success: false,
      message: "Impossible de retirer cet élément.",
    };
  }

  revalidatePath(`/lists/${listId}`);
  revalidatePath("/lists");

  return { success: true };
};

export const leaveList = async (
  listId: string,
): Promise<BaseActionResult> => {
  const userId = await assertAuthenticatedUser();

  if (!userId) {
    return {
      success: false,
      message: "Connectez-vous pour modifier cette liste.",
    };
  }

  const membership = await loadListMembership(listId, userId);

  if (!membership || membership === "owner") {
    return {
      success: false,
      message: "Impossible de quitter cette liste.",
    };
  }

  try {
    const { error } = await db.client
      .from("list_collaborators")
      .delete()
      .eq("list_id", listId)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("[lists] leaveList error:", error);
    return {
      success: false,
      message: "Impossible de quitter la liste pour le moment.",
    };
  }

  revalidatePath(`/lists/${listId}`);
  revalidatePath("/lists");

  redirect("/lists");
};

export const reorderListItems = async (
  listId: string,
  itemIds: string[],
): Promise<BaseActionResult> => {
  const userId = await assertAuthenticatedUser();

  if (!userId) {
    return {
      success: false,
      message: "Connectez-vous pour modifier cette liste.",
    };
  }

  const membership = await loadListMembership(listId, userId);

  if (!isEditorRole(membership)) {
    return {
      success: false,
      message: "Vous n'avez pas les droits d'édition sur cette liste.",
    };
  }

  try {
    // Vérifier que tous les items appartiennent à la liste
    const { data: items, error: itemsError } = await db.client
      .from("list_items")
      .select("id")
      .in("id", itemIds)
      .eq("list_id", listId);

    if (itemsError) {
      throw itemsError;
    }

    if ((items?.length ?? 0) !== itemIds.length) {
      return {
        success: false,
        message: "Certains éléments n'appartiennent pas à cette liste.",
      };
    }

    // Mettre à jour les positions
    for (let index = 0; index < itemIds.length; index++) {
      const itemId = itemIds[index]!;
      const { error } = await db.client
        .from("list_items")
        .update({ position: index + 1 })
        .eq("id", itemId)
        .eq("list_id", listId);
      if (error) {
        throw error;
      }
    }
  } catch (error) {
    console.error("[lists] reorderListItems error:", error);
    return {
      success: false,
      message: "Impossible de réorganiser les éléments.",
    };
  }

  revalidatePath(`/lists/${listId}`);
  revalidatePath("/lists");

  return { success: true };
};

