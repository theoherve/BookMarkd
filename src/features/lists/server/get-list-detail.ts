import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma/client";

import type { ListDetail, ViewerRole } from "../types";


const inferViewerRole = (
  ownerId: string,
  viewerId: string,
  collaborators: Array<{ user_id: string; role: ViewerRole }>,
): ViewerRole | null => {
  if (ownerId === viewerId) {
    return "owner";
  }

  const collaborator = collaborators.find((entry) => entry.user_id === viewerId);

  if (!collaborator) {
    return null;
  }

  return collaborator.role;
};

export const getListDetail = async (
  listId: string,
  viewerId: string | null,
): Promise<ListDetail> => {
  const list = await prisma.list.findUnique({
    where: { id: listId },
    include: {
      owner: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      collaborators: {
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
      items: {
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              coverUrl: true,
              averageRating: true,
            },
          },
        },
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!list) {
    notFound();
  }

  const rawCollaborators = list.collaborators;
  const viewerRole = viewerId
    ? inferViewerRole(
        list.ownerId,
        viewerId,
        rawCollaborators.map((entry) => ({
          user_id: entry.userId,
          role: entry.role as ViewerRole,
        })),
      )
    : null;

  if (!viewerRole && list.visibility !== "public") {
    notFound();
  }

  const collaborators = rawCollaborators.map((entry) => ({
    userId: entry.user.id,
    displayName: entry.user.displayName ?? "Collaborateur·rice",
    avatarUrl: entry.user.avatarUrl ?? null,
    role: entry.role,
  }));

  const items = list.items
    .map((item) => ({
      id: item.id,
      position: item.position,
      note: item.note ?? null,
      book: {
        id: item.book.id,
        title: item.book.title,
        author: item.book.author,
        coverUrl: item.book.coverUrl ?? null,
        averageRating: item.book.averageRating
          ? Number(item.book.averageRating)
          : null,
      },
    }))
    .sort((left, right) => left.position - right.position);

  return {
    id: list.id,
    title: list.title,
    description: list.description ?? null,
    visibility: list.visibility as ListDetail["visibility"],
    isCollaborative: list.isCollaborative ?? false,
    owner: {
      id: list.owner.id,
      displayName: list.owner.displayName ?? "Utilisateur·rice",
      avatarUrl: list.owner.avatarUrl ?? null,
    },
    collaborators,
    viewerRole: viewerRole ?? "viewer",
    items,
    updatedAt: list.updatedAt.toISOString(),
  };
};

