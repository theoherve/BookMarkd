"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/supabase/db";
import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";

type ActionResult =
  | { success: true }
  | { success: false; message: string };

export type NotificationType =
  | "follow_request"
  | "follow_request_accepted"
  | "review_like"
  | "review_comment"
  | "recommendation";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

const requireSession = async () => {
  const session = await getCurrentSession();
  const userId = await resolveSessionUserId(session);
  if (!userId) {
    throw new Error("AUTH_REQUIRED");
  }
  return userId;
};

export const createNotification = async (
  userId: string,
  type: NotificationType,
  payload: Record<string, unknown> = {},
): Promise<ActionResult> => {
  try {
    // Insert notification for the target user
    const { error } = await db.client.from("notifications").insert([
      {
        user_id: userId,
        type,
        payload,
      },
    ]);
    if (error) throw error;
    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    console.error("[notifications] createNotification error:", error);
    return { success: false, message: "Impossible de créer la notification." };
  }
};

export const getUnreadCount = async (): Promise<{ success: true; count: number } | { success: false; message: string }> => {
  try {
    const userId = await requireSession();
    const { count, error } = await db.client
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null);
    if (error) throw error;
    return { success: true, count: count ?? 0 };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return { success: false, message: "Vous devez être connecté·e." };
    }
    console.error("[notifications] getUnreadCount error:", error);
    return { success: false, message: "Impossible de récupérer le nombre non lu." };
  }
};

export const getNotifications = async (
  limit = 20,
): Promise<{ success: true; notifications: NotificationItem[] } | { success: false; message: string }> => {
  try {
    const userId = await requireSession();
    const { data, error } = await db.client
      .from("notifications")
      .select("id, type, payload, read_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    const notifications = (data ?? []).map((row) =>
      db.toCamel<NotificationItem>(row),
    );
    return { success: true, notifications };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return { success: false, message: "Vous devez être connecté·e." };
    }
    console.error("[notifications] getNotifications error:", error);
    return { success: false, message: "Impossible de récupérer les notifications." };
  }
};

export const markAsRead = async (notificationId: string): Promise<ActionResult> => {
  try {
    const userId = await requireSession();
    const { error } = await db.client
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", userId);
    if (error) throw error;
    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return { success: false, message: "Vous devez être connecté·e." };
    }
    console.error("[notifications] markAsRead error:", error);
    return { success: false, message: "Impossible de marquer comme lue." };
  }
};

export const markAllAsRead = async (): Promise<ActionResult> => {
  try {
    const userId = await requireSession();
    const { error } = await db.client
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);
    if (error) throw error;
    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return { success: false, message: "Vous devez être connecté·e." };
    }
    console.error("[notifications] markAllAsRead error:", error);
    return { success: false, message: "Impossible de tout marquer comme lu." };
  }
};


