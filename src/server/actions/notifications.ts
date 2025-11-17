"use server";

import db from "@/lib/supabase/db";
import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";

type ActionResult =
  | { success: true }
  | { success: false; message: string };

export type NotificationType =
  | "follow_request"
  | "follow_request_accepted"
  | "follow"
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

    let notifications = (data ?? []).map((row) =>
      db.toCamel<NotificationItem>(row),
    );

    // Enrichir les notifications de type follow_request avec le requestId depuis la base de données
    const followRequestNotifications = notifications.filter((n) => n.type === "follow_request");
    if (followRequestNotifications.length > 0) {
      // Récupérer toutes les demandes en attente pour cet utilisateur
      const { data: pendingRequests, error: requestsError } = await db.client
        .from("follow_requests")
        .select("id, requester_id, created_at")
        .eq("target_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (!requestsError && pendingRequests) {
        // Créer un map pour associer requesterId -> requestId (prendre la plus récente si plusieurs)
        const requesterToRequestMap = new Map<string, string>();
        for (const req of pendingRequests) {
          const requesterId = req.requester_id as string;
          if (requesterId) {
            // Garder la demande la plus récente pour chaque requester
            const existingRequestId = requesterToRequestMap.get(requesterId);
            if (!existingRequestId) {
              requesterToRequestMap.set(requesterId, req.id as string);
            }
          }
        }

        // Enrichir les notifications
        notifications = notifications.map((n) => {
          if (n.type === "follow_request") {
            const payload = n.payload || {};
            let requestId = payload.requestId as string | undefined;
            let requesterId = payload.requesterId as string | undefined;

            // Si le requestId n'est pas présent mais qu'on a le requesterId, le chercher
            if (!requestId && requesterId) {
              requestId = requesterToRequestMap.get(requesterId);
            }

            // Si toujours pas de requestId, essayer de trouver via la date de création
            // (associer la notification avec la demande la plus proche en date)
            if (!requestId && pendingRequests.length > 0) {
              const notificationDate = new Date(n.createdAt).getTime();
              const matchingRequest = pendingRequests
                .map((req) => ({
                  id: req.id as string,
                  requesterId: req.requester_id as string,
                  createdAt: new Date(req.created_at as string).getTime(),
                }))
                .sort((a, b) => Math.abs(a.createdAt - notificationDate) - Math.abs(b.createdAt - notificationDate))[0];

              if (matchingRequest) {
                requestId = matchingRequest.id;
                // Mettre à jour le requesterId aussi si absent
                if (!requesterId) {
                  requesterId = matchingRequest.requesterId;
                }
              }
            }

            return {
              ...n,
              payload: {
                ...payload,
                ...(requestId && { requestId }),
                ...(requesterId && { requesterId }),
              },
            };
          }
          return n;
        });
      }
    }

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
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return { success: false, message: "Vous devez être connecté·e." };
    }
    console.error("[notifications] markAllAsRead error:", error);
    return { success: false, message: "Impossible de tout marquer comme lu." };
  }
};


