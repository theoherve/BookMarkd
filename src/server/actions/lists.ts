"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth/session";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { resolveSessionUserId } from "@/lib/auth/user";

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
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("lists")
    .select(
      `
      owner_id,
      list_collaborators ( user_id, role )
    `,
    )
    .eq("id", listId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  if (data.owner_id === userId) {
    return "owner" as const;
  }

  const collaborator = (data.list_collaborators ?? []).find(
    (entry) => entry.user_id === userId,
  );

  if (!collaborator) {
    return null;
  }

  return collaborator.role as "editor" | "viewer";
};

const isEditorRole = (
  membership: "owner" | "editor" | "viewer" | null,
): membership is "owner" | "editor" => {
  return membership === "owner" || membership === "editor";
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

  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("lists")
    .insert({
      owner_id: userId,
      title: title.trim(),
      description: typeof description === "string" ? description.trim() : null,
      visibility,
      is_collaborative: isCollaborative,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[lists] createList error:", error);
    return {
      success: false,
      message: "Impossible de créer la liste pour le moment.",
    };
  }

  revalidatePath("/lists");

  if (!data?.id) {
    return {
      success: false,
      message: "La création de la liste a échoué.",
    };
  }

  return {
    success: true,
    listId: data.id,
  };
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

  const supabase = createSupabaseServiceClient();

  const { data: existingItem, error: existingError } = await supabase
    .from("list_items")
    .select("id")
    .eq("list_id", listId)
    .eq("book_id", bookId)
    .maybeSingle();

  if (existingError) {
    console.error("[lists] addBookToList existingError:", existingError);
    return {
      success: false,
      message: "Impossible de vérifier la liste.",
    };
  }

  if (existingItem) {
    return {
      success: false,
      message: "Ce livre est déjà présent dans la liste.",
    };
  }

  const { data: lastPositionRow, error: positionError } = await supabase
    .from("list_items")
    .select("position")
    .eq("list_id", listId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (positionError) {
    console.error("[lists] addBookToList positionError:", positionError);
    return {
      success: false,
      message: "Impossible de déterminer la position du nouvel élément.",
    };
  }

  const nextPosition = lastPositionRow?.position
    ? lastPositionRow.position + 1
    : 1;

  const { error } = await supabase.from("list_items").insert({
    id: randomUUID(),
    list_id: listId,
    book_id: bookId,
    position: nextPosition,
    note: note ? note.trim() : null,
  });

  if (error) {
    console.error("[lists] addBookToList insert error:", error);
    return {
      success: false,
      message: "Impossible d’ajouter ce livre pour le moment.",
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

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("list_items")
    .delete()
    .eq("id", listItemId)
    .eq("list_id", listId);

  if (error) {
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

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("list_collaborators")
    .delete()
    .eq("list_id", listId)
    .eq("user_id", userId);

  if (error) {
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

