"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import db from "@/lib/supabase/db";
import type { EditorialListType, EditorialListSource } from "@/types/editorial";

type ActionResult = { success: true } | { success: false; message: string };

// ── Create ──────────────────────────────────────────────────────────────────

export const createEditorialList = async (data: {
  title: string;
  description?: string | null;
  type: EditorialListType;
  source?: EditorialListSource;
  badgeLabel?: string | null;
  expiresAt?: string | null;
  displayOrder?: number;
}): Promise<{ success: true; listId: string } | { success: false; message: string }> => {
  try {
    await requireAdmin();

    const { data: list, error } = await db.client
      .from("editorial_lists")
      .insert({
        title: data.title.trim(),
        description: data.description?.trim() ?? null,
        type: data.type,
        source: data.source ?? "manual",
        status: "draft",
        badge_label: data.badgeLabel?.trim() ?? null,
        expires_at: data.expiresAt ?? null,
        display_order: data.displayOrder ?? 0,
      })
      .select("id")
      .single();

    if (error) throw error;

    revalidatePath("/admin/tendances");
    return { success: true, listId: list.id };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") return { success: false, message: "Authentification requise." };
    if ((error as Error).message === "ADMIN_REQUIRED") return { success: false, message: "Accès réservé aux administrateurs." };
    console.error("[admin/editorial] createEditorialList error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

// ── Update ──────────────────────────────────────────────────────────────────

export const updateEditorialList = async (
  listId: string,
  data: {
    title?: string;
    description?: string | null;
    badgeLabel?: string | null;
    expiresAt?: string | null;
    displayOrder?: number;
  }
): Promise<ActionResult> => {
  try {
    await requireAdmin();

    const update: Record<string, unknown> = {};
    if (data.title !== undefined) update.title = data.title.trim();
    if (data.description !== undefined) update.description = data.description?.trim() ?? null;
    if (data.badgeLabel !== undefined) update.badge_label = data.badgeLabel?.trim() ?? null;
    if (data.expiresAt !== undefined) update.expires_at = data.expiresAt ?? null;
    if (data.displayOrder !== undefined) update.display_order = data.displayOrder;

    const { error } = await db.client
      .from("editorial_lists")
      .update(update)
      .eq("id", listId);

    if (error) throw error;

    revalidatePath("/admin/tendances");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") return { success: false, message: "Authentification requise." };
    if ((error as Error).message === "ADMIN_REQUIRED") return { success: false, message: "Accès réservé aux administrateurs." };
    console.error("[admin/editorial] updateEditorialList error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

// ── Publish / Archive ───────────────────────────────────────────────────────

export const publishEditorialList = async (listId: string): Promise<ActionResult> => {
  try {
    await requireAdmin();

    const { data: existing } = await db.client
      .from("editorial_lists")
      .select("published_at")
      .eq("id", listId)
      .single();

    const { error } = await db.client
      .from("editorial_lists")
      .update({
        status: "published",
        published_at: existing?.published_at ?? new Date().toISOString(),
      })
      .eq("id", listId);

    if (error) throw error;

    revalidatePath("/admin/tendances");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") return { success: false, message: "Authentification requise." };
    if ((error as Error).message === "ADMIN_REQUIRED") return { success: false, message: "Accès réservé aux administrateurs." };
    console.error("[admin/editorial] publishEditorialList error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

export const archiveEditorialList = async (listId: string): Promise<ActionResult> => {
  try {
    await requireAdmin();

    const { error } = await db.client
      .from("editorial_lists")
      .update({ status: "archived" })
      .eq("id", listId);

    if (error) throw error;

    revalidatePath("/admin/tendances");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") return { success: false, message: "Authentification requise." };
    if ((error as Error).message === "ADMIN_REQUIRED") return { success: false, message: "Accès réservé aux administrateurs." };
    console.error("[admin/editorial] archiveEditorialList error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

export const unpublishEditorialList = async (listId: string): Promise<ActionResult> => {
  try {
    await requireAdmin();

    const { error } = await db.client
      .from("editorial_lists")
      .update({ status: "draft" })
      .eq("id", listId);

    if (error) throw error;

    revalidatePath("/admin/tendances");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") return { success: false, message: "Authentification requise." };
    if ((error as Error).message === "ADMIN_REQUIRED") return { success: false, message: "Accès réservé aux administrateurs." };
    console.error("[admin/editorial] unpublishEditorialList error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

// ── Delete ──────────────────────────────────────────────────────────────────

export const deleteEditorialList = async (listId: string): Promise<ActionResult> => {
  try {
    await requireAdmin();

    const { error } = await db.client
      .from("editorial_lists")
      .delete()
      .eq("id", listId);

    if (error) throw error;

    revalidatePath("/admin/tendances");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") return { success: false, message: "Authentification requise." };
    if ((error as Error).message === "ADMIN_REQUIRED") return { success: false, message: "Accès réservé aux administrateurs." };
    console.error("[admin/editorial] deleteEditorialList error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

// ── Books ───────────────────────────────────────────────────────────────────

export const addBookToEditorialList = async (
  listId: string,
  book: {
    bookId?: string | null;
    externalTitle?: string | null;
    externalAuthor?: string | null;
    externalIsbn?: string | null;
    externalCoverUrl?: string | null;
    position?: number;
  }
): Promise<ActionResult> => {
  try {
    await requireAdmin();

    const { error } = await db.client.from("editorial_list_books").insert({
      list_id: listId,
      book_id: book.bookId ?? null,
      external_title: book.externalTitle ?? null,
      external_author: book.externalAuthor ?? null,
      external_isbn: book.externalIsbn ?? null,
      external_cover_url: book.externalCoverUrl ?? null,
      position: book.position ?? 0,
    });

    if (error) throw error;

    revalidatePath(`/admin/tendances/${listId}`);
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") return { success: false, message: "Authentification requise." };
    if ((error as Error).message === "ADMIN_REQUIRED") return { success: false, message: "Accès réservé aux administrateurs." };
    console.error("[admin/editorial] addBookToEditorialList error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

export const removeBookFromEditorialList = async (bookEntryId: string): Promise<ActionResult> => {
  try {
    await requireAdmin();

    const { error } = await db.client
      .from("editorial_list_books")
      .delete()
      .eq("id", bookEntryId);

    if (error) throw error;

    revalidatePath("/admin/tendances");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") return { success: false, message: "Authentification requise." };
    if ((error as Error).message === "ADMIN_REQUIRED") return { success: false, message: "Accès réservé aux administrateurs." };
    console.error("[admin/editorial] removeBookFromEditorialList error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};
