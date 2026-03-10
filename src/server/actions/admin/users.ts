"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import db from "@/lib/supabase/db";

type ActionResult = { success: true } | { success: false; message: string };

export const toggleUserAdmin = async (
  userId: string,
  makeAdmin: boolean,
): Promise<ActionResult> => {
  try {
    const adminId = await requireAdmin();

    if (adminId === userId) {
      return {
        success: false,
        message: "Vous ne pouvez pas modifier votre propre statut admin.",
      };
    }

    const { error } = await db.client
      .from("users")
      .update({ is_admin: makeAdmin })
      .eq("id", userId);

    if (error) throw error;

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return { success: false, message: "Authentification requise." };
    }
    if ((error as Error).message === "ADMIN_REQUIRED") {
      return { success: false, message: "Accès réservé aux administrateurs." };
    }
    console.error("[admin/users] toggleUserAdmin error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

export const disableUserAccount = async (
  userId: string,
): Promise<ActionResult> => {
  try {
    const adminId = await requireAdmin();

    if (adminId === userId) {
      return {
        success: false,
        message: "Vous ne pouvez pas désactiver votre propre compte.",
      };
    }

    const { error } = await db.client
      .from("users")
      .update({ disabled_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) throw error;

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return { success: false, message: "Authentification requise." };
    }
    if ((error as Error).message === "ADMIN_REQUIRED") {
      return { success: false, message: "Accès réservé aux administrateurs." };
    }
    console.error("[admin/users] disableUserAccount error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

export const enableUserAccount = async (
  userId: string,
): Promise<ActionResult> => {
  try {
    await requireAdmin();

    const { error } = await db.client
      .from("users")
      .update({ disabled_at: null })
      .eq("id", userId);

    if (error) throw error;

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return { success: false, message: "Authentification requise." };
    }
    if ((error as Error).message === "ADMIN_REQUIRED") {
      return { success: false, message: "Accès réservé aux administrateurs." };
    }
    console.error("[admin/users] enableUserAccount error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};

export const deleteUserAccount = async (
  userId: string,
): Promise<ActionResult> => {
  try {
    const adminId = await requireAdmin();

    if (adminId === userId) {
      return {
        success: false,
        message: "Vous ne pouvez pas supprimer votre propre compte.",
      };
    }

    // Verify user is not admin
    const { data: user, error: fetchError } = await db.client
      .from("users")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!user) return { success: false, message: "Utilisateur introuvable." };
    if (user.is_admin) {
      return {
        success: false,
        message: "Impossible de supprimer un compte administrateur.",
      };
    }

    // Delete user — cascade will remove reviews, user_books, lists, follows, activities, etc.
    const { error } = await db.client.from("users").delete().eq("id", userId);

    if (error) throw error;

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return { success: false, message: "Authentification requise." };
    }
    if ((error as Error).message === "ADMIN_REQUIRED") {
      return { success: false, message: "Accès réservé aux administrateurs." };
    }
    console.error("[admin/users] deleteUserAccount error:", error);
    return {
      success: false,
      message: "Une erreur est survenue lors de la suppression.",
    };
  }
};
