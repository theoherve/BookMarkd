import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import type {
  FeedActivity,
  FeedFriendBook,
  FeedRecommendation,
} from "@/features/feed/types";
import { getCurrentSession } from "@/lib/auth/session";


const ACTIVITY_TYPES: FeedActivity["type"][] = [
  "rating",
  "review",
  "status_change",
  "list_update",
  "follow",
];

const isActivityType = (value: string): value is FeedActivity["type"] => {
  return ACTIVITY_TYPES.includes(value as FeedActivity["type"]);
};

const RECOMMENDATION_SOURCES: FeedRecommendation["source"][] = [
  "friends",
  "global",
  "similar",
];

const isRecommendationSource = (
  value: string,
): value is FeedRecommendation["source"] => {
  return RECOMMENDATION_SOURCES.includes(
    value as FeedRecommendation["source"],
  );
};

const ACTIVITY_LIMIT = 6;
const FRIENDS_BOOKS_LIMIT = 6;
const RECOMMENDATIONS_LIMIT = 6;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();
    const viewerId = session?.user?.id ?? null;

    let followingIds: string[] = [];

    if (viewerId) {
      const follows = await prisma.follow.findMany({
        where: { followerId: viewerId },
        select: { followingId: true },
      });

      followingIds = follows.map((follow) => follow.followingId);
    }

    const audienceIds =
      viewerId || followingIds.length > 0
        ? [viewerId, ...followingIds].filter(
            (value): value is string => Boolean(value),
          )
        : null;

    const [activities, friendsBooks, recommendations] = await Promise.all([
      prisma.activity.findMany({
        where: audienceIds?.length
          ? {
              userId: {
                in: audienceIds,
              },
            }
          : undefined,
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
          createdAt: "desc",
        },
        take: ACTIVITY_LIMIT,
      }),
      prisma.userBook.findMany({
        where: audienceIds?.length
          ? {
              userId: {
                in: audienceIds,
              },
            }
          : undefined,
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
        take: FRIENDS_BOOKS_LIMIT,
      }),
      prisma.recommendation.findMany({
        where: viewerId
          ? {
              userId: viewerId,
            }
          : undefined,
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
          score: "desc",
        },
        take: RECOMMENDATIONS_LIMIT,
      }),
    ]);

    const recommendationBookIds = recommendations
      .map((item) => item.book.id)
      .filter((id): id is string => Boolean(id));

    let viewerReadlistBooks = new Set<string>();
    if (viewerId && recommendationBookIds.length > 0) {
      const viewerEntries = await prisma.userBook.findMany({
        where: {
          userId: viewerId,
          bookId: {
            in: recommendationBookIds,
          },
        },
        select: { bookId: true },
      });
      viewerReadlistBooks = new Set(
        viewerEntries.map((entry) => entry.bookId).filter(Boolean),
      );
    }

    const friendContextByBook = new Map<
      string,
      { names: string[]; count: number; highlights: string[] }
    >();
    if (followingIds.length > 0 && recommendationBookIds.length > 0) {
      const friendEntries = await prisma.userBook.findMany({
        where: {
          userId: {
            in: followingIds,
          },
          bookId: {
            in: recommendationBookIds,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      });

      friendEntries.forEach((entry) => {
        const bookId = entry.bookId;
        if (!bookId) {
          return;
        }

        const friendName = entry.user.displayName ?? null;
        if (!friendName) {
          return;
        }

        const statusLabel =
          entry.status === "finished"
            ? `${friendName} l'a terminé`
            : entry.status === "reading"
              ? `${friendName} est en cours de lecture`
              : `${friendName} l'a ajouté à sa liste`;

        const existing = friendContextByBook.get(bookId);
        if (existing) {
          existing.names.push(friendName);
          existing.count += 1;
          if (existing.highlights.length < 3) {
            existing.highlights.push(statusLabel);
          }
          return;
        }

        friendContextByBook.set(bookId, {
          names: [friendName],
          count: 1,
          highlights: [statusLabel],
        });
      });
    }

    const tagsByBook = new Map<string, string[]>();
    if (recommendationBookIds.length > 0) {
      const tagRelations = await prisma.bookTag.findMany({
        where: {
          bookId: {
            in: recommendationBookIds,
          },
        },
        include: {
          tag: {
            select: {
              name: true,
            },
          },
        },
      });

      tagRelations.forEach((relation) => {
        const bookId = relation.bookId;
        const tagName = relation.tag.name;
        if (!bookId || !tagName) {
          return;
        }

        const existing = tagsByBook.get(bookId);
        if (existing) {
          existing.push(tagName);
          return;
        }

        tagsByBook.set(bookId, [tagName]);
      });
    }

    const formattedActivities: FeedActivity[] = activities.map((item) => {
      const payload = item.payload ?? {};
      const normalizedPayload =
        typeof payload === "object" &&
        payload !== null &&
        !Array.isArray(payload)
          ? (payload as Record<string, unknown>)
          : {};

      return {
        id: item.id,
        type: isActivityType(item.type) ? item.type : "list_update",
        userName: item.user.displayName ?? "Lectrice anonyme",
        userAvatarUrl: item.user.avatarUrl ?? null,
        bookTitle:
          (normalizedPayload.book_title as string | null | undefined) ?? null,
        note:
          (normalizedPayload.note as string | null | undefined) ??
          (normalizedPayload.review_snippet as string | null | undefined) ??
          (normalizedPayload.status_note as string | null | undefined) ??
          null,
        rating:
          (normalizedPayload.rating as number | null | undefined) ?? null,
        occurredAt: item.createdAt.toISOString(),
      };
    });

    const formattedFriendsBooks: FeedFriendBook[] = friendsBooks.map((item) => ({
      id: item.id,
      bookId: item.book.id,
      title: item.book.title,
      author: item.book.author,
      coverUrl: item.book.coverUrl ?? null,
      averageRating: item.book.averageRating
        ? Number(item.book.averageRating)
        : null,
      status: item.status as "to_read" | "reading" | "finished",
      updatedAt: item.updatedAt.toISOString(),
      readerName: item.user.displayName ?? "Lectrice anonyme",
      readerAvatarUrl: item.user.avatarUrl ?? null,
    }));

    const formattedRecommendations: FeedRecommendation[] = recommendations.map(
      (item) => {
        const friendContext = friendContextByBook.get(item.book.id);
        const tags = tagsByBook.get(item.book.id) ?? [];

        const metadata = item.metadata ?? {};
        const normalizedMetadata =
          typeof metadata === "object" &&
          metadata !== null &&
          !Array.isArray(metadata)
            ? (metadata as Record<string, unknown>)
            : {};

        return {
          id: item.id,
          bookId: item.book.id,
          title: item.book.title,
          author: item.book.author,
          coverUrl: item.book.coverUrl ?? null,
          reason:
            (normalizedMetadata.reason as string | null | undefined) ??
            (normalizedMetadata.explanation as string | null | undefined) ??
            (normalizedMetadata.match as string | null | undefined) ??
            (friendContext
              ? `${friendContext.names.slice(0, 2).join(", ")} l'a recommandé`
              : null),
          source: isRecommendationSource(item.source)
            ? item.source
            : "global",
          score: Number(item.score),
          friendNames: friendContext?.names ?? [],
          friendCount: friendContext?.count ?? 0,
          viewerHasInReadlist: viewerReadlistBooks.has(item.book.id),
          friendHighlights: friendContext?.highlights ?? [],
          tags: tags.slice(0, 5),
        };
      },
    );

    return NextResponse.json({
      activities: formattedActivities,
      friendsBooks: formattedFriendsBooks,
      recommendations: formattedRecommendations,
    });
  } catch (error) {
    console.error("[feed] GET error:", error);
    return NextResponse.json(
      { error: "Unable to fetch feed data." },
      { status: 500 },
    );
  }
}

