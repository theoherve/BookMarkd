"use server";

import { unstable_noStore as noStore } from "next/cache";

import db from "@/lib/supabase/db";
import { getCurrentSession } from "@/lib/auth/session";

/**
 * Vérifie si un utilisateur est admin en fonction de son ID
 * @param userId - L'ID de l'utilisateur à vérifier
 * @returns true si l'utilisateur est admin, false sinon
 */
export const isUserAdmin = async (userId: string | null): Promise<boolean> => {
  if (!userId) {
    return false;
  }

  noStore();

  try {
    const { data, error } = await db.client
      .from("users")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[admin] Error checking admin status:", error);
      return false;
    }

    return data?.is_admin ?? false;
  } catch (error) {
    console.error("[admin] Unexpected error checking admin status:", error);
    return false;
  }
};

/**
 * Vérifie si l'utilisateur actuellement connecté est admin
 * @returns true si l'utilisateur actuel est admin, false sinon
 */
export const getCurrentUserAdminStatus = async (): Promise<boolean> => {
  const session = await getCurrentSession();
  const userId = session?.user?.id ?? null;

  return isUserAdmin(userId);
};

/**
 * Action server pour vérifier le statut admin d'un utilisateur par son ID
 * Peut être appelée depuis un composant client
 */
export const checkUserAdminStatus = async (userId: string | null): Promise<boolean> => {
  return isUserAdmin(userId);
};
