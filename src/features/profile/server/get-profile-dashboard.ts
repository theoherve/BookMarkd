import { prisma } from "@/lib/prisma/client";

import type { ProfileDashboard, ReadingStats } from "../types";

const buildReadingStats = (rows: Array<{ status: string | null }>): ReadingStats => {
  const initial: ReadingStats = {
    toRead: 0,
    reading: 0,
    finished: 0,
  };

  return rows.reduce((accumulator, row) => {
    if (!row.status) {
      return accumulator;
    }

    if (row.status === "to_read") {
      accumulator.toRead += 1;
    }

    if (row.status === "reading") {
      accumulator.reading += 1;
    }

    if (row.status === "finished") {
      accumulator.finished += 1;
    }

    return accumulator;
  }, initial);
};

export const getProfileDashboard = async (userId: string): Promise<ProfileDashboard> => {
  const [
    user,
    ownedListsCount,
    collaborativeListsCount,
    readingRows,
    recommendationsCount,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        displayName: true,
        email: true,
        bio: true,
        avatarUrl: true,
      },
    }),
    prisma.list.count({
      where: { ownerId: userId },
    }),
    prisma.listCollaborator.count({
      where: { userId },
    }),
    prisma.userBook.findMany({
      where: { userId },
      select: { status: true },
    }),
    prisma.recommendation.count({
      where: { userId },
    }),
  ]);

  if (!user) {
    throw new Error("Utilisateur introuvable.");
  }

  const readingStats = buildReadingStats(readingRows);

  return {
    displayName: user.displayName ?? "Utilisateur·rice",
    email: user.email ?? "",
    bio: user.bio ?? null,
    avatarUrl: user.avatarUrl ?? null,
    ownedLists: ownedListsCount,
    collaborativeLists: collaborativeListsCount,
    recommendationsCount,
    readingStats,
  };
};

