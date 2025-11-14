import { prisma } from "@/lib/prisma/client";

import type { AvailableBook } from "../types";

export const getAvailableBooks = async (
  excludeBookIds: string[],
  limit = 20,
): Promise<AvailableBook[]> => {
  const books = await prisma.book.findMany({
    where: excludeBookIds.length > 0
      ? {
          id: {
            notIn: excludeBookIds,
          },
        }
      : undefined,
    select: {
      id: true,
      title: true,
      author: true,
    },
    orderBy: {
      title: "asc",
    },
    take: limit,
  });

  return books.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
  }));
};

