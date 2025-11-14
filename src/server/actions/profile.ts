"use server";

import { revalidatePath } from "next/cache";

import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";
import { prisma } from "@/lib/prisma/client";

type ActionResult =
  | { success: true }
  | { success: false; message: string };

const requireSession = async () => {
  const session = await getCurrentSession();
  const userId = await resolveSessionUserId(session);
  if (!userId) {
    throw new Error("AUTH_REQUIRED");
  }
  return userId;
};

type UpdateProfileInput = {
  displayName?: string;
  bio?: string | null;
  avatarUrl?: string | null;
};

export const updateProfile = async (
  input: UpdateProfileInput,
): Promise<ActionResult> => {
  try {
    const userId = await requireSession();

    const updateData: {
      displayName?: string;
      bio?: string | null;
      avatarUrl?: string | null;
    } = {};

    if (input.displayName !== undefined) {
      const trimmedName = input.displayName.trim();
      if (trimmedName.length < 2) {
        return {
          success: false,
          message: "Le nom doit contenir au moins 2 caractères.",
        };
      }
      updateData.displayName = trimmedName;
    }

    if (input.bio !== undefined) {
      updateData.bio = input.bio?.trim() || null;
    }

    if (input.avatarUrl !== undefined) {
      updateData.avatarUrl = input.avatarUrl?.trim() || null;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath("/profiles/me");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Vous devez être connecté·e pour mettre à jour votre profil.",
      };
    }
    console.error("[profile] updateProfile error:", error);
    return {
      success: false,
      message: "Impossible de mettre à jour votre profil.",
    };
  }
};

type UpdateTopBooksInput = {
  topBooks: Array<{ bookId: string; position: number }>;
};

export const updateTopBooks = async (
  input: UpdateTopBooksInput,
): Promise<ActionResult> => {
  try {
    const userId = await requireSession();

    // Valider les positions (1, 2, 3)
    const positions = input.topBooks.map((tb) => tb.position);
    if (new Set(positions).size !== positions.length) {
      return {
        success: false,
        message: "Chaque position doit être unique (1, 2, ou 3).",
      };
    }

    const validPositions = positions.filter((p) => p >= 1 && p <= 3);
    if (validPositions.length !== positions.length) {
      return {
        success: false,
        message: "Les positions doivent être entre 1 et 3.",
      };
    }

    // Vérifier que les livres existent
    const bookIds = input.topBooks.map((tb) => tb.bookId);
    const existingBooks = await prisma.book.findMany({
      where: { id: { in: bookIds } },
      select: { id: true },
    });

    if (existingBooks.length !== bookIds.length) {
      return {
        success: false,
        message: "Un ou plusieurs livres n'existent pas.",
      };
    }

    // Supprimer les anciens top books de l'utilisateur
    await prisma.userTopBook.deleteMany({
      where: { userId },
    });

    // Créer les nouveaux top books
    if (input.topBooks.length > 0) {
      await prisma.userTopBook.createMany({
        data: input.topBooks.map((tb) => ({
          userId,
          bookId: tb.bookId,
          position: tb.position,
        })),
      });
    }

    revalidatePath("/profiles/me");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Vous devez être connecté·e pour mettre à jour votre top 3.",
      };
    }
    console.error("[profile] updateTopBooks error:", error);
    return {
      success: false,
      message: "Impossible de mettre à jour votre top 3 livres.",
    };
  }
};

