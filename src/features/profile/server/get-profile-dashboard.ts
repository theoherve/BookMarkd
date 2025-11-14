import { prisma } from "@/lib/prisma/client";
import { generateBookSlug } from "@/lib/slug";

import type {
  ProfileDashboard,
  ReadingStats,
  TopBook,
  RecentActivity,
  ReadListBook,
} from "../types";

const buildReadingStats = (
  rows: Array<{ status: string | null }>
): ReadingStats => {
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

export const getProfileDashboard = async (
  userId: string
): Promise<ProfileDashboard> => {
  try {
    // Étape 1 : Données utilisateur (critique, doit être récupéré en premier)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        displayName: true,
        email: true,
        bio: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      throw new Error("Utilisateur introuvable.");
    }

    // Étape 2 : Statistiques de base (3 requêtes en parallèle)
    const [ownedListsCount, collaborativeListsCount, recommendationsCount] =
      await Promise.all([
        prisma.list.count({
          where: { ownerId: userId },
        }),
        prisma.listCollaborator.count({
          where: { userId },
        }),
        prisma.recommendation.count({
          where: { userId },
        }),
      ]);

    // Étape 3 : Données de lecture (2 requêtes en parallèle)
    const [readingRows, topBooksData] = await Promise.all([
      prisma.userBook.findMany({
        where: { userId },
        select: { status: true },
      }),
      // Gérer le cas où la table user_top_books n'existe pas encore
      prisma.userTopBook
        .findMany({
          where: { userId },
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
        })
        .catch((error) => {
          // Si la table n'existe pas encore, retourner un tableau vide
          if (
            error instanceof Error &&
            (error.message.includes("does not exist") ||
              error.message.includes("relation") ||
              error.message.includes("Unknown table"))
          ) {
            console.warn(
              "[getProfileDashboard] user_top_books table doesn't exist yet, returning empty array"
            );
            return [];
          }
          throw error;
        }),
    ]);

    // Étape 4 : Données des listes (2 requêtes en parallèle)
    const [ownedListsIds, collaboratorListsIds] = await Promise.all([
      prisma.list.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      }),
      prisma.listCollaborator.findMany({
        where: { userId },
        select: { listId: true },
      }),
    ]);

    const listIds = [
      ...ownedListsIds.map((l) => l.id),
      ...collaboratorListsIds.map((c) => c.listId),
    ];
    const listsForActivities = ownedListsIds;

    // Étape 5 : Activités - groupe 1 (3 requêtes en parallèle)
    const [oldActivities, userBooks, reviews] = await Promise.all([
      prisma.activity.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          payload: true,
          createdAt: true,
        },
      }),
      prisma.userBook.findMany({
        where: { userId },
        select: {
          id: true,
          status: true,
          rating: true,
          ratedAt: true,
          notePrivate: true,
          createdAt: true,
          updatedAt: true,
          book: {
            select: {
              title: true,
              author: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 50,
      }),
      prisma.review.findMany({
        where: { userId },
        include: {
          book: {
            select: {
              title: true,
              author: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      }),
    ]);

    // Étape 6 : Activités - groupe 2 (2 requêtes en parallèle)
    const [reviewComments, listItems] = await Promise.all([
      prisma.reviewComment.findMany({
        where: { userId },
        include: {
          review: {
            include: {
              book: {
                select: {
                  title: true,
                  author: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      }),
      listIds.length > 0
        ? prisma.listItem.findMany({
            where: {
              listId: { in: listIds },
            },
            include: {
              book: {
                select: {
                  title: true,
                  author: true,
                },
              },
              list: {
                select: {
                  title: true,
                  ownerId: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 50,
          })
        : Promise.resolve([]),
    ]);

    // Étape 7 : Activités - groupe 3 (3 requêtes en parallèle)
    const [reviewLikes, follows, topBooksUpdates] = await Promise.all([
      prisma.reviewLike.findMany({
        where: { userId },
        include: {
          review: {
            include: {
              book: {
                select: {
                  title: true,
                  author: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      }),
      prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              displayName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      }),
      prisma.userTopBook
        .findMany({
          where: { userId },
          include: {
            book: {
              select: {
                title: true,
                author: true,
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 50,
        })
        .catch(() => []),
    ]);

    // Étape 8 : Récupérer la read list (sérialisée à la fin)
    const readListData = await prisma.userBook.findMany({
      where: { userId },
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
      take: 20,
    });

    const readingStats = buildReadingStats(readingRows);

    const topBooks: TopBook[] = topBooksData.map((item) => ({
      id: item.id,
      bookId: item.bookId,
      position: item.position,
      book: {
        id: item.book.id,
        title: item.book.title,
        author: item.book.author,
        coverUrl: item.book.coverUrl,
      },
    }));

    // Normaliser toutes les activités dans un format unifié
    const lists = listsForActivities;

    const allActivities: RecentActivity[] = [];

    // Anciennes activités depuis la table Activity
    oldActivities.forEach((item) => {
      const payload = item.payload ?? {};
      const normalizedPayload =
        typeof payload === "object" &&
        payload !== null &&
        !Array.isArray(payload)
          ? (payload as Record<string, unknown>)
          : {};

      const bookTitle =
        (normalizedPayload.book_title as string | null | undefined) ?? null;
      allActivities.push({
        id: item.id,
        type: item.type as RecentActivity["type"],
        bookTitle,
        bookSlug: null, // Les anciennes activités n'ont pas l'auteur dans le payload
        listTitle: null,
        note:
          (normalizedPayload.note as string | null | undefined) ??
          (normalizedPayload.review_snippet as string | null | undefined) ??
          (normalizedPayload.status_note as string | null | undefined) ??
          null,
        rating: (normalizedPayload.rating as number | null | undefined) ?? null,
        status: null,
        occurredAt: item.createdAt.toISOString(),
      });
    });

    // UserBook - ajout à la read list, changement de statut, ajout de note/rating
    userBooks.forEach((userBook) => {
      const createdAtTime = userBook.createdAt.getTime();
      const updatedAtTime = userBook.updatedAt.getTime();
      const ratedAtTime = userBook.ratedAt?.getTime() ?? null;

      // Si c'est un ajout récent (createdAt proche de updatedAt), c'est un ajout à la read list
      const isNewAddition =
        createdAtTime === updatedAtTime ||
        Math.abs(createdAtTime - updatedAtTime) < 1000;

      // Ajouter l'activité d'ajout à la read list si c'est un nouvel ajout
      if (isNewAddition) {
        allActivities.push({
          id: `readlist_${userBook.id}`,
          type: "readlist_add",
          bookTitle: userBook.book.title,
          bookSlug: generateBookSlug(userBook.book.title, userBook.book.author),
          listTitle: null,
          note: userBook.notePrivate ?? null,
          rating: null,
          status: userBook.status as "to_read" | "reading" | "finished" | null,
          occurredAt: userBook.createdAt.toISOString(),
        });
      }

      // Ajouter l'activité de note si ratedAt existe et est différent de createdAt
      if (ratedAtTime && Math.abs(ratedAtTime - createdAtTime) > 1000) {
        allActivities.push({
          id: `rating_${userBook.id}_${ratedAtTime}`,
          type: "rating",
          bookTitle: userBook.book.title,
          bookSlug: generateBookSlug(userBook.book.title, userBook.book.author),
          listTitle: null,
          note: userBook.notePrivate ?? null,
          rating: userBook.rating ? Number(userBook.rating) : null,
          status: userBook.status as "to_read" | "reading" | "finished" | null,
          occurredAt: userBook.ratedAt!.toISOString(),
        });
      }

      // Ajouter l'activité de changement de statut si updatedAt est différent de createdAt et ratedAt
      if (
        !isNewAddition &&
        (!ratedAtTime || Math.abs(updatedAtTime - ratedAtTime) > 1000)
      ) {
        allActivities.push({
          id: `status_${userBook.id}_${updatedAtTime}`,
          type: "status_change",
          bookTitle: userBook.book.title,
          bookSlug: generateBookSlug(userBook.book.title, userBook.book.author),
          listTitle: null,
          note: userBook.notePrivate ?? null,
          rating: userBook.rating ? Number(userBook.rating) : null,
          status: userBook.status as "to_read" | "reading" | "finished" | null,
          occurredAt: userBook.updatedAt.toISOString(),
        });
      }
    });

    // Reviews - publication de critiques
    reviews.forEach((review) => {
      allActivities.push({
        id: `review_${review.id}`,
        type: "review",
        bookTitle: review.book.title,
        bookSlug: generateBookSlug(review.book.title, review.book.author),
        listTitle: null,
        note: review.content,
        rating: null,
        status: null,
        occurredAt: review.createdAt.toISOString(),
      });
    });

    // ReviewComments - commentaires sur des critiques
    reviewComments.forEach((comment) => {
      allActivities.push({
        id: `comment_${comment.id}`,
        type: "review_comment",
        bookTitle: comment.review.book.title,
        bookSlug: generateBookSlug(
          comment.review.book.title,
          comment.review.book.author
        ),
        listTitle: null,
        note: comment.content,
        rating: null,
        status: null,
        occurredAt: comment.createdAt.toISOString(),
      });
    });

    // Lists - création de listes
    lists.forEach((list) => {
      allActivities.push({
        id: `list_${list.id}`,
        type: "list_create",
        bookTitle: null,
        bookSlug: null,
        listTitle: list.title,
        note: null,
        rating: null,
        status: null,
        occurredAt: list.createdAt.toISOString(),
      });
    });

    // ListItems - ajout de livres à des listes
    listItems.forEach((item) => {
      allActivities.push({
        id: `listitem_${item.id}`,
        type: "list_item_add",
        bookTitle: item.book.title,
        bookSlug: generateBookSlug(item.book.title, item.book.author),
        listTitle: item.list.title,
        note: item.note ?? null,
        rating: null,
        status: null,
        occurredAt: item.createdAt.toISOString(),
      });
    });

    // ReviewLikes - likes sur des critiques
    reviewLikes.forEach((like) => {
      allActivities.push({
        id: `like_${like.reviewId}_${like.userId}`,
        type: "review_like",
        bookTitle: like.review.book.title,
        bookSlug: generateBookSlug(
          like.review.book.title,
          like.review.book.author
        ),
        listTitle: null,
        note: null,
        rating: null,
        status: null,
        occurredAt: like.createdAt.toISOString(),
      });
    });

    // Follows - suivi de profils
    follows.forEach((follow) => {
      allActivities.push({
        id: `follow_${follow.followerId}_${follow.followingId}`,
        type: "follow",
        bookTitle: null,
        bookSlug: null,
        listTitle: null,
        note: follow.following.displayName,
        rating: null,
        status: null,
        occurredAt: follow.createdAt.toISOString(),
      });
    });

    // UserTopBook - mise à jour des top books
    topBooksUpdates.forEach((topBook) => {
      allActivities.push({
        id: `topbook_${topBook.id}_${topBook.updatedAt.getTime()}`,
        type: "top_book_update",
        bookTitle: topBook.book.title,
        bookSlug: generateBookSlug(topBook.book.title, topBook.book.author),
        listTitle: null,
        note: null,
        rating: null,
        status: null,
        occurredAt: topBook.updatedAt.toISOString(),
      });
    });

    // Trier toutes les activités par date décroissante et prendre les 20 plus récentes
    const recentActivities: RecentActivity[] = allActivities
      .sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      )
      .slice(0, 20);

    const readList: ReadListBook[] = readListData.map((item) => ({
      id: item.id,
      bookId: item.bookId,
      status: item.status as "to_read" | "reading" | "finished",
      rating: item.rating ? Number(item.rating) : null,
      book: {
        id: item.book.id,
        title: item.book.title,
        author: item.book.author,
        coverUrl: item.book.coverUrl,
      },
      updatedAt: item.updatedAt.toISOString(),
    }));

    return {
      displayName: user.displayName ?? "Utilisateur·rice",
      email: user.email ?? "",
      bio: user.bio ?? null,
      avatarUrl: user.avatarUrl ?? null,
      ownedLists: ownedListsCount,
      collaborativeLists: collaborativeListsCount,
      recommendationsCount,
      readingStats,
      topBooks,
      recentActivities,
      readList,
    };
  } catch (error) {
    console.error("[getProfileDashboard] Database connection error:", error);
    throw error;
  }
};
