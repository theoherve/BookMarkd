"use server";

import { revalidatePath } from "next/cache";

import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";
import { prisma } from "@/lib/prisma/client";

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
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return {
        success: false,
        message: "Utilisateur non trouvé.",
      };
    }

    // Vérifier si une demande existe déjà
    const existingRequest = await prisma.followRequest.findUnique({
      where: {
        requesterId_targetId: {
          requesterId,
          targetId: targetUserId,
        },
      },
    });

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
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: requesterId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      return {
        success: false,
        message: "Vous suivez déjà cet utilisateur.",
      };
    }

    // Créer la demande
    await prisma.followRequest.create({
      data: {
        requesterId,
        targetId: targetUserId,
        status: "pending",
      },
    });

    revalidatePath("/profiles/me");
    revalidatePath(`/profiles/${targetUserId}`);
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

    const request = await prisma.followRequest.findUnique({
      where: {
        requesterId_targetId: {
          requesterId,
          targetId: targetUserId,
        },
      },
    });

    if (!request || request.status !== "pending") {
      return {
        success: false,
        message: "Aucune demande en attente trouvée.",
      };
    }

    await prisma.followRequest.delete({
      where: { id: request.id },
    });

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

    const request = await prisma.followRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    if (!request) {
      return {
        success: false,
        message: "Demande non trouvée.",
      };
    }

    if (request.targetId !== userId) {
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
    await prisma.$transaction([
      prisma.followRequest.update({
        where: { id: requestId },
        data: {
          status: "accepted",
          respondedAt: new Date(),
        },
      }),
      prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: request.requesterId,
            followingId: request.targetId,
          },
        },
        create: {
          followerId: request.requesterId,
          followingId: request.targetId,
        },
        update: {},
      }),
    ]);

    revalidatePath("/profiles/me");
    revalidatePath(`/profiles/${request.requester.id}`);
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

    const request = await prisma.followRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return {
        success: false,
        message: "Demande non trouvée.",
      };
    }

    if (request.targetId !== userId) {
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

    await prisma.followRequest.update({
      where: { id: requestId },
      data: {
        status: "rejected",
        respondedAt: new Date(),
      },
    });

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

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUserId,
        },
      },
    });

    if (!follow) {
      return {
        success: false,
        message: "Vous ne suivez pas cet utilisateur.",
      };
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUserId,
        },
      },
    });

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
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: viewerId,
          followingId: targetUserId,
        },
      },
    });

    if (follow) {
      return { status: "following" };
    }

    // Vérifier s'il y a une demande en attente
    const request = await prisma.followRequest.findUnique({
      where: {
        requesterId_targetId: {
          requesterId: viewerId,
          targetId: targetUserId,
        },
      },
    });

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

    const requests = await prisma.followRequest.findMany({
      where: {
        targetId: userId,
        status: "pending",
      },
      include: {
        requester: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      requests: requests.map((req) => ({
        id: req.id,
        requester: {
          id: req.requester.id,
          displayName: req.requester.displayName,
          avatarUrl: req.requester.avatarUrl,
          bio: req.requester.bio,
        },
        createdAt: req.createdAt.toISOString(),
      })),
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

    const requests = await prisma.followRequest.findMany({
      where: {
        requesterId: userId,
        status: "pending",
      },
      include: {
        target: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      requests: requests.map((req) => ({
        id: req.id,
        target: {
          id: req.target.id,
          displayName: req.target.displayName,
          avatarUrl: req.target.avatarUrl,
        },
        createdAt: req.createdAt.toISOString(),
      })),
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
    const followers = await prisma.follow.findMany({
      where: {
        followingId: userId,
      },
      include: {
        follower: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return followers.map((follow) => ({
      id: follow.follower.id,
      displayName: follow.follower.displayName,
      avatarUrl: follow.follower.avatarUrl,
      bio: follow.follower.bio,
      followedAt: follow.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("[follow] getFollowers error:", error);
    return [];
  }
};

export const getFollowing = async (userId: string) => {
  try {
    const following = await prisma.follow.findMany({
      where: {
        followerId: userId,
      },
      include: {
        following: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return following.map((follow) => ({
      id: follow.following.id,
      displayName: follow.following.displayName,
      avatarUrl: follow.following.avatarUrl,
      bio: follow.following.bio,
      followedAt: follow.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("[follow] getFollowing error:", error);
    return [];
  }
};

