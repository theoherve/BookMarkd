"use server";

import db from "@/lib/supabase/db";
import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";
import { createNotification } from "@/server/actions/notifications";
import { generateBookSlug } from "@/lib/slug";
import { revalidatePath } from "next/cache";

type ActionResult =
  | { success: true }
  | { success: false; message: string };

const requireSession = async (): Promise<string> => {
  const session = await getCurrentSession();
  const userId = await resolveSessionUserId(session);
  if (!userId) {
    throw new Error("AUTH_REQUIRED");
  }
  return userId;
};

/**
 * Recommande un livre à un utilisateur que l'on suit (et qui nous a accepté).
 * Crée une notification pour le destinataire.
 */
export const recommendBookToUser = async (
  recipientUserId: string,
  bookId: string,
  bookTitle: string,
  bookAuthor: string,
): Promise<ActionResult> => {
  try {
    const senderId = await requireSession();

    if (senderId === recipientUserId) {
      return {
        success: false,
        message: "Vous ne pouvez pas vous recommander un livre à vous-même.",
      };
    }

    const { data: follow, error: followErr } = await db.client
      .from("follows")
      .select("follower_id")
      .eq("follower_id", senderId)
      .eq("following_id", recipientUserId)
      .maybeSingle();

    if (followErr) throw followErr;

    if (!follow) {
      return {
        success: false,
        message: "Vous ne pouvez recommander qu'aux personnes que vous suivez et qui vous ont accepté.",
      };
    }

    const { data: sender, error: senderErr } = await db.client
      .from("users")
      .select("display_name")
      .eq("id", senderId)
      .maybeSingle();

    if (senderErr) throw senderErr;

    const bookSlug = generateBookSlug(bookTitle, bookAuthor);
    const result = await createNotification(recipientUserId, "recommendation", {
      bookId,
      bookTitle,
      bookAuthor,
      bookSlug,
      recommenderId: senderId,
      recommenderName: (sender as { display_name: string } | null)?.display_name ?? "Un utilisateur",
    });

    if (!result.success) {
      return result;
    }

    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Vous devez être connecté·e pour recommander un livre.",
      };
    }
    console.error("[recommend] recommendBookToUser error:", error);
    return {
      success: false,
      message: "Impossible d'envoyer la recommandation.",
    };
  }
};
