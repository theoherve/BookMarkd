"use server";

import { getCurrentSession } from "@/lib/auth/session";
import { isUserAdmin } from "@/lib/auth/admin";

/**
 * Verifie que l'utilisateur connecte est admin.
 * Lance une erreur si non authentifie ou non admin.
 * Retourne l'ID de l'utilisateur admin.
 */
export const requireAdmin = async (): Promise<string> => {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    throw new Error("AUTH_REQUIRED");
  }
  const admin = await isUserAdmin(session.user.id);
  if (!admin) {
    throw new Error("ADMIN_REQUIRED");
  }
  return session.user.id;
};
