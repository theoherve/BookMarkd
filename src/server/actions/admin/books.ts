"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import db from "@/lib/supabase/db";

type ActionResult = { success: true } | { success: false; message: string };

export const updateBookMetadata = async (
  bookId: string,
  data: {
    title?: string;
    author?: string;
    publicationYear?: number | null;
    summary?: string | null;
    isbn?: string | null;
    publisher?: string | null;
    language?: string | null;
    coverUrl?: string | null;
  }
): Promise<ActionResult> => {
  try {
    await requireAdmin();

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.author !== undefined) updateData.author = data.author;
    if (data.publicationYear !== undefined) updateData.publication_year = data.publicationYear;
    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.isbn !== undefined) updateData.isbn = data.isbn;
    if (data.publisher !== undefined) updateData.publisher = data.publisher;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.coverUrl !== undefined) updateData.cover_url = data.coverUrl;

    const { error } = await db.client
      .from("books")
      .update(updateData)
      .eq("id", bookId);

    if (error) throw error;

    revalidatePath("/admin/books");
    revalidatePath(`/admin/books/${bookId}`);
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return { success: false, message: "Authentification requise." };
    }
    if ((error as Error).message === "ADMIN_REQUIRED") {
      return { success: false, message: "Accès réservé aux administrateurs." };
    }
    console.error("[admin/books] updateBookMetadata error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

export const deleteBook = async (bookId: string): Promise<ActionResult> => {
  try {
    await requireAdmin();

    const { error } = await db.client
      .from("books")
      .delete()
      .eq("id", bookId);

    if (error) throw error;

    revalidatePath("/admin/books");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return { success: false, message: "Authentification requise." };
    }
    if ((error as Error).message === "ADMIN_REQUIRED") {
      return { success: false, message: "Accès réservé aux administrateurs." };
    }
    console.error("[admin/books] deleteBook error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

export const mergeBooks = async (
  sourceBookId: string,
  targetBookId: string
): Promise<ActionResult> => {
  try {
    await requireAdmin();

    if (sourceBookId === targetBookId) {
      return { success: false, message: "Impossible de fusionner un livre avec lui-même." };
    }

    // Move user_books (ignore conflicts)
    await db.client.rpc("merge_book_user_books" as never, {
      source_id: sourceBookId,
      target_id: targetBookId,
    } as never).then(() => {});

    // Fallback: manual moves if RPC doesn't exist
    // Move reviews
    await db.client.from("reviews").update({ book_id: targetBookId }).eq("book_id", sourceBookId);
    // Move book_tags
    await db.client.from("book_tags").update({ book_id: targetBookId }).eq("book_id", sourceBookId);
    // Move user_book_feelings
    await db.client.from("user_book_feelings").update({ book_id: targetBookId }).eq("book_id", sourceBookId);
    // Move book_views
    await db.client.from("book_views").update({ book_id: targetBookId }).eq("book_id", sourceBookId);
    // Delete source
    await db.client.from("books").delete().eq("id", sourceBookId);

    revalidatePath("/admin/books");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return { success: false, message: "Authentification requise." };
    }
    if ((error as Error).message === "ADMIN_REQUIRED") {
      return { success: false, message: "Accès réservé aux administrateurs." };
    }
    console.error("[admin/books] mergeBooks error:", error);
    return { success: false, message: "Une erreur est survenue lors de la fusion." };
  }
};
