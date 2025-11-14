"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
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
  const list = await prisma.list.findUnique({
    where: { id: listId },
    include: {
      collaborators: {
        where: { userId },
        select: {
          userId: true,
          role: true,
        },
      },
    },
  });

  if (!list) {
    return null;
  }

  if (list.ownerId === userId) {
    return "owner" as const;
  }

  const collaborator = list.collaborators[0];

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

  try {
    const newList = await prisma.list.create({
      data: {
        ownerId: userId,
        title: title.trim(),
        description: typeof description === "string" ? description.trim() : null,
        visibility,
        isCollaborative,
      },
    });

    revalidatePath("/lists");

    return {
      success: true,
      listId: newList.id,
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
    const existingItem = await prisma.listItem.findFirst({
      where: {
        listId,
        bookId,
      },
      select: { id: true },
    });

    if (existingItem) {
      return {
        success: false,
        message: "Ce livre est déjà présent dans la liste.",
      };
    }

    // Trouver la dernière position
    const lastPositionRow = await prisma.listItem.findFirst({
      where: { listId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const nextPosition = lastPositionRow?.position
      ? lastPositionRow.position + 1
      : 1;

    await prisma.listItem.create({
      data: {
        listId,
        bookId,
        position: nextPosition,
        note: note ? note.trim() : null,
      },
    });
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
    const item = await prisma.listItem.findUnique({
      where: { id: listItemId },
      select: { listId: true },
    });

    if (!item || item.listId !== listId) {
      return {
        success: false,
        message: "Cet élément n'appartient pas à cette liste.",
      };
    }

    await prisma.listItem.delete({
      where: { id: listItemId },
    });
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
    await prisma.listCollaborator.delete({
      where: {
        listId_userId: {
          listId,
          userId,
        },
      },
    });
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
    const items = await prisma.listItem.findMany({
      where: {
        id: { in: itemIds },
        listId,
      },
      select: { id: true },
    });

    if (items.length !== itemIds.length) {
      return {
        success: false,
        message: "Certains éléments n'appartiennent pas à cette liste.",
      };
    }

    // Mettre à jour les positions
    await prisma.$transaction(
      itemIds.map((itemId, index) =>
        prisma.listItem.update({
          where: { id: itemId },
          data: { position: index + 1 },
        }),
      ),
    );
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

