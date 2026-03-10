"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import db from "@/lib/supabase/db";
import type { FeedbackStatus } from "@/types/feedback";

type ActionResult = { success: true } | { success: false; message: string };

export const bulkUpdateFeedbackStatus = async (
  feedbackIds: string[],
  status: FeedbackStatus
): Promise<ActionResult> => {
  try {
    await requireAdmin();

    if (feedbackIds.length === 0) {
      return { success: false, message: "Aucun feedback sélectionné." };
    }

    const { error } = await db.client
      .from("feedbacks")
      .update({ status })
      .in("id", feedbackIds);

    if (error) throw error;

    revalidatePath("/admin/feedback");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return { success: false, message: "Authentification requise." };
    }
    if ((error as Error).message === "ADMIN_REQUIRED") {
      return { success: false, message: "Accès réservé aux administrateurs." };
    }
    console.error("[admin/feedback] bulkUpdateFeedbackStatus error:", error);
    return { success: false, message: "Une erreur est survenue." };
  }
};
