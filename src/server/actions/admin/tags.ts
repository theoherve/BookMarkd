"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import db from "@/lib/supabase/db";

type ActionResult = { success: true } | { success: false; message: string };

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const createTag = async (name: string): Promise<ActionResult> => {
  try {
    await requireAdmin();

    const slug = generateSlug(name);
    const { error } = await db.client.from("tags").insert({ name: name.trim(), slug });

    if (error) {
      if (error.code === "23505") {
        return { success: false, message: "Ce tag existe déjà." };
      }
      throw error;
    }

    revalidatePath("/admin/tags");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return { success: false, message: "Authentification requise." };
    }
    if ((error as Error).message === "ADMIN_REQUIRED") {
      return { success: false, message: "Accès réservé aux administrateurs." };
    }
    console.error("[admin/tags] createTag error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

export const renameTag = async (tagId: string, newName: string): Promise<ActionResult> => {
  try {
    await requireAdmin();

    const slug = generateSlug(newName);
    const { error } = await db.client
      .from("tags")
      .update({ name: newName.trim(), slug })
      .eq("id", tagId);

    if (error) throw error;

    revalidatePath("/admin/tags");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return { success: false, message: "Authentification requise." };
    }
    if ((error as Error).message === "ADMIN_REQUIRED") {
      return { success: false, message: "Accès réservé aux administrateurs." };
    }
    console.error("[admin/tags] renameTag error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

export const deleteTag = async (tagId: string): Promise<ActionResult> => {
  try {
    await requireAdmin();

    // Delete book_tags first, then the tag
    await db.client.from("book_tags").delete().eq("tag_id", tagId);
    const { error } = await db.client.from("tags").delete().eq("id", tagId);

    if (error) throw error;

    revalidatePath("/admin/tags");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return { success: false, message: "Authentification requise." };
    }
    if ((error as Error).message === "ADMIN_REQUIRED") {
      return { success: false, message: "Accès réservé aux administrateurs." };
    }
    console.error("[admin/tags] deleteTag error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

export const mergeTags = async (sourceTagId: string, targetTagId: string): Promise<ActionResult> => {
  try {
    await requireAdmin();

    if (sourceTagId === targetTagId) {
      return { success: false, message: "Impossible de fusionner un tag avec lui-même." };
    }

    // Move book_tags from source to target (ignore duplicates)
    const { data: sourceBookTags } = await db.client
      .from("book_tags")
      .select("book_id")
      .eq("tag_id", sourceTagId);

    const { data: targetBookTags } = await db.client
      .from("book_tags")
      .select("book_id")
      .eq("tag_id", targetTagId);

    const targetBookIds = new Set((targetBookTags ?? []).map((r: { book_id: string }) => r.book_id));
    const toMove = (sourceBookTags ?? []).filter((r: { book_id: string }) => !targetBookIds.has(r.book_id));

    if (toMove.length > 0) {
      await db.client.from("book_tags").insert(
        toMove.map((r: { book_id: string }) => ({ book_id: r.book_id, tag_id: targetTagId }))
      );
    }

    // Delete source tag (and its remaining book_tags)
    await db.client.from("book_tags").delete().eq("tag_id", sourceTagId);
    await db.client.from("tags").delete().eq("id", sourceTagId);

    revalidatePath("/admin/tags");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return { success: false, message: "Authentification requise." };
    }
    if ((error as Error).message === "ADMIN_REQUIRED") {
      return { success: false, message: "Accès réservé aux administrateurs." };
    }
    console.error("[admin/tags] mergeTags error:", error);
    return { success: false, message: "Une erreur est survenue lors de la fusion." };
  }
};
