"use server";

import { revalidatePath } from "next/cache";

import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";
import db from "@/lib/supabase/db";
import { createNotification } from "@/server/actions/notifications";

type ActionResult =
  | { success: true }
  | { success: false; message: string };

const requireSession = async () => {
  const session = await getCurrentSession();
  const userId = await resolveSessionUserId(session);
  if (!userId) {
    throw new Error("AUTH_REQUIRED");
  }
  return userId;
};

export const requestFollow = async (
  targetUserId: string,
): Promise<ActionResult> => {
  try {
    const requesterId = await requireSession();

    if (requesterId === targetUserId) {
      return {
        success: false,
        message: "Vous ne pouvez pas vous suivre vous-même.",
      };
    }

    // Vérifier que l'utilisateur cible existe
    const { data: targetUser, error: targetErr } = await db.client
      .from("users")
      .select("id")
      .eq("id", targetUserId)
      .maybeSingle();

    if (targetErr) {
      throw targetErr;
    }

    if (!targetUser) {
      return {
        success: false,
        message: "Utilisateur non trouvé.",
      };
    }

    // Vérifier si une demande existe déjà
    const { data: existingRequest, error: existingReqErr } = await db.client
      .from("follow_requests")
      .select("status")
      .eq("requester_id", requesterId)
      .eq("target_id", targetUserId)
      .maybeSingle();

    if (existingReqErr) {
      throw existingReqErr;
    }

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return {
          success: false,
          message: "Une demande est déjà en attente.",
        };
      }
      // Si la demande a été rejetée, on peut en créer une nouvelle
    }

    // Vérifier si on suit déjà cet utilisateur
    const { data: existingFollow, error: existingFollowErr } = await db.client
      .from("follows")
      .select("follower_id")
      .eq("follower_id", requesterId)
      .eq("following_id", targetUserId)
      .maybeSingle();

    if (existingFollowErr) {
      throw existingFollowErr;
    }

    if (existingFollow) {
      return {
        success: false,
        message: "Vous suivez déjà cet utilisateur.",
      };
    }

    // Créer la demande
    const { error: createErr } = await db.client.from("follow_requests").insert([
      {
        requester_id: requesterId,
        target_id: targetUserId,
        status: "pending",
      },
    ]);
    if (createErr) {
      throw createErr;
    }

    revalidatePath("/profiles/me");
    revalidatePath(`/profiles/${targetUserId}`);
    // Notification pour l'utilisateur cible
    void createNotification(targetUserId, "follow_request", {});
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Vous devez être connecté·e pour suivre un utilisateur.",
      };
    }
    console.error("[follow] requestFollow error:", error);
    return {
      success: false,
      message: "Impossible d'envoyer la demande de suivi.",
    };
  }
};

export const cancelFollowRequest = async (
  targetUserId: string,
): Promise<ActionResult> => {
  try {
    const requesterId = await requireSession();

    const { data: request, error } = await db.client
      .from("follow_requests")
      .select("id, status")
      .eq("requester_id", requesterId)
      .eq("target_id", targetUserId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!request || request.status !== "pending") {
      return {
        success: false,
        message: "Aucune demande en attente trouvée.",
      };
    }

    const { error: delErr } = await db.client
      .from("follow_requests")
      .delete()
      .eq("id", request.id as string);
    if (delErr) {
      throw delErr;
    }

    revalidatePath("/profiles/me");
    revalidatePath(`/profiles/${targetUserId}`);
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Vous devez être connecté·e.",
      };
    }
    console.error("[follow] cancelFollowRequest error:", error);
    return {
      success: false,
      message: "Impossible d'annuler la demande.",
    };
  }
};

export const acceptFollowRequest = async (
  requestId: string,
): Promise<ActionResult> => {
  try {
    const userId = await requireSession();

    const { data: request, error } = await db.client
      .from("follow_requests")
      .select(
        `
        id,
        status,
        requester_id,
        target_id,
        requester:requester_id ( id, display_name )
      `,
      )
      .eq("id", requestId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!request) {
      return {
        success: false,
        message: "Demande non trouvée.",
      };
    }

    if ((request.target_id as string) !== userId) {
      return {
        success: false,
        message: "Vous n'êtes pas autorisé·e à accepter cette demande.",
      };
    }

    if (request.status !== "pending") {
      return {
        success: false,
        message: "Cette demande a déjà été traitée.",
      };
    }

    // Accepter la demande et créer la relation Follow
    const { error: updErr } = await db.client
      .from("follow_requests")
      .update({
        status: "accepted",
        responded_at: new Date().toISOString(),
      })
      .eq("id", requestId);
    if (updErr) throw updErr;

    const { error: upsertErr } = await db.client
      .from("follows")
      .upsert(
        [
          {
            follower_id: request.requester_id,
            following_id: request.target_id,
          },
        ],
        { onConflict: "follower_id,following_id" },
      );
    if (upsertErr) throw upsertErr;

    revalidatePath("/profiles/me");
    revalidatePath(`/profiles/${(request as { requester?: { id?: string } }).requester?.id ?? ""}`);
    // Notification pour l'auteur de la demande (le demandeur)
    void createNotification(request.requester_id as string, "follow_request_accepted", {
      targetUserId: request.target_id,
      targetUserName: (request as { requester?: { id?: string; display_name?: string } }).requester?.display_name ?? null,
    });
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Vous devez être connecté·e.",
      };
    }
    console.error("[follow] acceptFollowRequest error:", error);
    return {
      success: false,
      message: "Impossible d'accepter la demande.",
    };
  }
};

export const rejectFollowRequest = async (
  requestId: string,
): Promise<ActionResult> => {
  try {
    const userId = await requireSession();

    const { data: request, error } = await db.client
      .from("follow_requests")
      .select("id, status, target_id")
      .eq("id", requestId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!request) {
      return {
        success: false,
        message: "Demande non trouvée.",
      };
    }

    if ((request.target_id as string) !== userId) {
      return {
        success: false,
        message: "Vous n'êtes pas autorisé·e à refuser cette demande.",
      };
    }

    if (request.status !== "pending") {
      return {
        success: false,
        message: "Cette demande a déjà été traitée.",
      };
    }

    const { error: updErr } = await db.client
      .from("follow_requests")
      .update({
        status: "rejected",
        responded_at: new Date().toISOString(),
      })
      .eq("id", requestId);
    if (updErr) throw updErr;

    revalidatePath("/profiles/me");
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Vous devez être connecté·e.",
      };
    }
    console.error("[follow] rejectFollowRequest error:", error);
    return {
      success: false,
      message: "Impossible de refuser la demande.",
    };
  }
};

export const unfollowUser = async (targetUserId: string): Promise<ActionResult> => {
  try {
    const followerId = await requireSession();

    if (followerId === targetUserId) {
      return {
        success: false,
        message: "Vous ne pouvez pas vous désabonner de vous-même.",
      };
    }

    const { data: follow, error } = await db.client
      .from("follows")
      .select("follower_id")
      .eq("follower_id", followerId)
      .eq("following_id", targetUserId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!follow) {
      return {
        success: false,
        message: "Vous ne suivez pas cet utilisateur.",
      };
    }

    const { error: delErr } = await db.client
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", targetUserId);
    if (delErr) {
      throw delErr;
    }

    revalidatePath("/profiles/me");
    revalidatePath(`/profiles/${targetUserId}`);
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Vous devez être connecté·e.",
      };
    }
    console.error("[follow] unfollowUser error:", error);
    return {
      success: false,
      message: "Impossible de vous désabonner.",
    };
  }
};

export type FollowStatus =
  | "not_following"
  | "following"
  | "request_pending"
  | "request_rejected";

export const getFollowStatus = async (
  targetUserId: string,
): Promise<{ status: FollowStatus } | { success: false; message: string }> => {
  try {
    const viewerId = await requireSession();

    // Vérifier si on suit déjà
    const { data: follow, error: followErr } = await db.client
      .from("follows")
      .select("follower_id")
      .eq("follower_id", viewerId)
      .eq("following_id", targetUserId)
      .maybeSingle();

    if (followErr) throw followErr;

    if (follow) {
      return { status: "following" };
    }

    // Vérifier s'il y a une demande en attente
    const { data: request, error: reqErr } = await db.client
      .from("follow_requests")
      .select("status")
      .eq("requester_id", viewerId)
      .eq("target_id", targetUserId)
      .maybeSingle();
    if (reqErr) throw reqErr;

    if (request) {
      if (request.status === "pending") {
        return { status: "request_pending" };
      }
      if (request.status === "rejected") {
        return { status: "request_rejected" };
      }
    }

    return { status: "not_following" };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Vous devez être connecté·e.",
      };
    }
    console.error("[follow] getFollowStatus error:", error);
    return {
      success: false,
      message: "Impossible de récupérer le statut.",
    };
  }
};

export const getFollowRequests = async () => {
  try {
    const userId = await requireSession();

    const { data: requests, error } = await db.client
      .from("follow_requests")
      .select(
        `
        id,
        created_at,
        requester:requester_id ( id, display_name, avatar_url, bio )
      `,
      )
      .eq("target_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const mapped = (requests ?? [])
      .map((req) =>
        db.toCamel<{
          id: string;
          createdAt: string;
          requester?: {
            id: string;
            displayName: string;
            avatarUrl: string | null;
            bio: string | null;
          };
        }>(req),
      )
      .filter((r) => Boolean(r.requester))
      .map((r) => ({
        id: r.id,
        requester: r.requester!,
        createdAt: r.createdAt,
      }));

    return {
      success: true,
      requests: mapped,
    };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Vous devez être connecté·e.",
      };
    }
    console.error("[follow] getFollowRequests error:", error);
    return {
      success: false,
      message: "Impossible de récupérer les demandes.",
    };
  }
};

export const getPendingFollowRequests = async () => {
  try {
    const userId = await requireSession();

    const { data: requests, error } = await db.client
      .from("follow_requests")
      .select(
        `
        id,
        created_at,
        target:target_id ( id, display_name, avatar_url )
      `,
      )
      .eq("requester_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      requests: (requests ?? []).map((req) => {
        const r = db.toCamel<{
          id: string;
          createdAt: string;
          target?: { id: string; displayName: string; avatarUrl: string | null };
        }>(req);
        return {
          id: r.id,
          target: r.target!,
          createdAt: r.createdAt,
        };
      }),
    };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Vous devez être connecté·e.",
      };
    }
    console.error("[follow] getPendingFollowRequests error:", error);
    return {
      success: false,
      message: "Impossible de récupérer les demandes.",
    };
  }
};

export const getFollowers = async (userId: string) => {
  try {
    const { data: followers, error } = await db.client
      .from("follows")
      .select(
        `
        created_at,
        follower:follower_id ( id, display_name, avatar_url, bio )
      `,
      )
      .eq("following_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (followers ?? []).map((row) => {
      const r = db.toCamel<{
        createdAt: string;
        follower?: {
          id: string;
          displayName: string;
          avatarUrl: string | null;
          bio: string | null;
        };
      }>(row);
      return {
        id: r.follower!.id,
        displayName: r.follower!.displayName,
        avatarUrl: r.follower!.avatarUrl,
        bio: r.follower!.bio,
        followedAt: r.createdAt,
      };
    });
  } catch (error) {
    console.error("[follow] getFollowers error:", error);
    return [];
  }
};

export const getFollowing = async (userId: string) => {
  try {
    const { data: following, error } = await db.client
      .from("follows")
      .select(
        `
        created_at,
        following:following_id ( id, display_name, avatar_url, bio )
      `,
      )
      .eq("follower_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (following ?? []).map((row) => {
      const r = db.toCamel<{
        createdAt: string;
        following?: {
          id: string;
          displayName: string;
          avatarUrl: string | null;
          bio: string | null;
        };
      }>(row);
      return {
        id: r.following!.id,
        displayName: r.following!.displayName,
        avatarUrl: r.following!.avatarUrl,
        bio: r.following!.bio,
        followedAt: r.createdAt,
      };
    });
  } catch (error) {
    console.error("[follow] getFollowing error:", error);
    return [];
  }
};

