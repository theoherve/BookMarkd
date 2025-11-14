import { prisma } from "@/lib/prisma/client";

import type { ListSummary, ViewerRole } from "../types";

const mapViewerRole = (role: ViewerRole) => role;

export const getUserLists = async (userId: string): Promise<ListSummary[]> => {
  const [ownedLists, collaboratorRows] = await Promise.all([
    prisma.list.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        title: true,
        description: true,
        visibility: true,
        isCollaborative: true,
        updatedAt: true,
        _count: {
          select: {
            items: true,
            collaborators: true,
          },
        },
      },
    }),
    prisma.listCollaborator.findMany({
      where: { userId },
      include: {
        list: {
          select: {
            id: true,
            title: true,
            description: true,
            visibility: true,
            isCollaborative: true,
            updatedAt: true,
            _count: {
              select: {
                items: true,
                collaborators: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const summaries: ListSummary[] = [];

  // Ajouter les listes possédées
  for (const list of ownedLists) {
    summaries.push({
      id: list.id,
      title: list.title,
      description: list.description ?? null,
      visibility: list.visibility as ListSummary["visibility"],
      isCollaborative: list.isCollaborative ?? false,
      updatedAt: list.updatedAt.toISOString(),
      itemCount: list._count.items,
      collaboratorCount: list._count.collaborators,
      viewerRole: mapViewerRole("owner"),
    });
  }

  // Ajouter les listes où l'utilisateur est collaborateur
  for (const collaboratorRow of collaboratorRows) {
    const list = collaboratorRow.list;
    if (!list) {
      continue;
    }

    summaries.push({
      id: list.id,
      title: list.title,
      description: list.description ?? null,
      visibility: list.visibility as ListSummary["visibility"],
      isCollaborative: list.isCollaborative ?? false,
      updatedAt: list.updatedAt.toISOString(),
      itemCount: list._count.items,
      collaboratorCount: list._count.collaborators,
      viewerRole: mapViewerRole(collaboratorRow.role as ViewerRole),
    });
  }

  return summaries.sort((left, right) => {
    if (left.updatedAt === right.updatedAt) {
      return left.title.localeCompare(right.title, "fr");
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
};

