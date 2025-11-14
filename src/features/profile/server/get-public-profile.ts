import { prisma } from "@/lib/prisma/client";

export type PublicProfile = {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  stats: {
    booksRead: number;
    booksReading: number;
    booksToRead: number;
    followers: number;
    following: number;
    listsOwned: number;
    reviews: number;
  };
  topBooks: Array<{
    id: string;
    title: string;
    author: string;
    coverUrl: string | null;
    position: number;
  }>;
  recentBooks: Array<{
    id: string;
    title: string;
    author: string;
    coverUrl: string | null;
    status: "to_read" | "reading" | "finished";
    rating: number | null;
    updatedAt: string;
  }>;
  publicLists: Array<{
    id: string;
    title: string;
    description: string | null;
    itemsCount: number;
  }>;
};

export const getPublicProfile = async (
  username: string,
): Promise<PublicProfile | null> => {
  try {
    const user = await prisma.user.findFirst({
      where: { username },
      include: {
        userBooks: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                coverUrl: true,
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 10,
        },
        topBooks: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                coverUrl: true,
              },
            },
          },
          orderBy: {
            position: "asc",
          },
        },
        listsOwned: {
          where: {
            visibility: "public",
          },
          include: {
            items: {
              select: {
                id: true,
              },
            },
          },
          take: 10,
        },
        _count: {
          select: {
            followsAsFollower: true,
            followsAsFollowing: true,
            reviews: {
              where: {
                visibility: "public",
              },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const booksRead = user.userBooks.filter((ub) => ub.status === "finished").length;
    const booksReading = user.userBooks.filter((ub) => ub.status === "reading").length;
    const booksToRead = user.userBooks.filter((ub) => ub.status === "to_read").length;

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      stats: {
        booksRead,
        booksReading,
        booksToRead,
        followers: user._count.followsAsFollowing,
        following: user._count.followsAsFollower,
        listsOwned: user.listsOwned.length,
        reviews: user._count.reviews,
      },
      topBooks: user.topBooks.map((tb) => ({
        id: tb.book.id,
        title: tb.book.title,
        author: tb.book.author,
        coverUrl: tb.book.coverUrl,
        position: tb.position,
      })),
      recentBooks: user.userBooks.map((ub) => ({
        id: ub.book.id,
        title: ub.book.title,
        author: ub.book.author,
        coverUrl: ub.book.coverUrl,
        status: ub.status as "to_read" | "reading" | "finished",
        rating: ub.rating ? Number(ub.rating) : null,
        updatedAt: ub.updatedAt.toISOString(),
      })),
      publicLists: user.listsOwned.map((list) => ({
        id: list.id,
        title: list.title,
        description: list.description,
        itemsCount: list.items.length,
      })),
    };
  } catch (error) {
    console.error("[profile] getPublicProfile error:", error);
    return null;
  }
};

