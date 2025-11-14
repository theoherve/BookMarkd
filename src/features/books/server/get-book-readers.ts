import { prisma } from "@/lib/prisma/client";

export type BookReader = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  status: "to_read" | "reading" | "finished";
  rating: number | null;
  hasReview: boolean;
};

export const getBookReaders = async (bookId: string): Promise<BookReader[]> => {
  try {
    const userBooks = await prisma.userBook.findMany({
      where: { bookId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Récupérer les reviews pour vérifier qui a commenté
    const reviews = await prisma.review.findMany({
      where: { bookId },
      select: {
        userId: true,
      },
    });

    const reviewersSet = new Set(reviews.map((r) => r.userId));

    return userBooks.map((ub) => ({
      id: ub.user.id,
      displayName: ub.user.displayName,
      avatarUrl: ub.user.avatarUrl,
      status: ub.status as "to_read" | "reading" | "finished",
      rating: ub.rating ? Number(ub.rating) : null,
      hasReview: reviewersSet.has(ub.userId),
    }));
  } catch (error) {
    console.error("[books] getBookReaders error:", error);
    return [];
  }
};

