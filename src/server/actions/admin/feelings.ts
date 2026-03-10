"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import db from "@/lib/supabase/db";

type ActionResult = { success: true } | { success: false; message: string };

const generateSlug = (label: string): string => {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const createAdminFeeling = async (label: string): Promise<ActionResult> => {
  try {
    const adminId = await requireAdmin();

    const slug = generateSlug(label);
    const { error } = await db.client.from("feeling_keywords").insert({
      label: label.trim(),
      slug,
      source: "admin",
      created_by: adminId,
    });

    if (error) {
      if (error.code === "23505") {
        return { success: false, message: "Ce ressenti existe déjà." };
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
    console.error("[admin/feelings] createAdminFeeling error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

export const renameFeeling = async (keywordId: string, newLabel: string): Promise<ActionResult> => {
  try {
    await requireAdmin();

    const slug = generateSlug(newLabel);
    const { error } = await db.client
      .from("feeling_keywords")
      .update({ label: newLabel.trim(), slug })
      .eq("id", keywordId);

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
    console.error("[admin/feelings] renameFeeling error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

export const deleteFeeling = async (keywordId: string): Promise<ActionResult> => {
  try {
    await requireAdmin();

    await db.client.from("user_book_feelings").delete().eq("keyword_id", keywordId);
    const { error } = await db.client.from("feeling_keywords").delete().eq("id", keywordId);

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
    console.error("[admin/feelings] deleteFeeling error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};
