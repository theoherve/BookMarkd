"use server";

import { revalidatePath } from "next/cache";

import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { resolveSessionUserId } from "@/lib/auth/user";

type AddBookToReadlistResult =
  | { success: true }
  | { success: false; message: string };

export const addBookToReadlist = async (
  bookId: string,
): Promise<AddBookToReadlistResult> => {
  const session = await getCurrentSession();

  const userId = await resolveSessionUserId(session);

  if (!userId) {
    return {
      success: false,
      message: "Vous devez être connecté·e pour ajouter un livre.",
    };
  }

  try {
    // Récupérer l'enregistrement existant pour préserver le rating s'il existe
    const existing = await prisma.userBook.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
    });

    await prisma.userBook.upsert({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
      update: {
        // Si le status existe déjà, on le préserve, sinon on met "to_read"
        status: existing?.status ?? "to_read",
        // Préserver le rating s'il existe
        rating: existing?.rating ?? null,
      },
      create: {
        userId,
        bookId,
        status: "to_read",
      },
    });

    revalidatePath("/"); // feed
    revalidatePath("/search");
    revalidatePath(`/books/${bookId}`);

    return { success: true };
  } catch (error) {
    console.error("[readlist] addBookToReadlist error:", error);
    return {
      success: false,
      message: "Impossible d'ajouter ce livre à votre readlist.",
    };
  }
};

