import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import type {
  FeedActivity,
  FeedFriendBook,
  FeedRecommendation,
} from "@/features/feed/types";
import { getCurrentSession } from "@/lib/auth/session";

const ACTIVITY_LIMIT = 6;
const FRIENDS_BOOKS_LIMIT = 6;
const RECOMMENDATIONS_LIMIT = 6;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createSupabaseServiceClient();

    const session = await getCurrentSession();
    const viewerId = session?.user?.id ?? null;

    let followingIds: string[] = [];

    if (viewerId) {
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", viewerId);

      followingIds = follows?.map((follow) => follow.following_id) ?? [];
    }

    const audienceIds =
      viewerId || followingIds.length > 0
        ? [viewerId, ...followingIds].filter(
            (value): value is string => Boolean(value),
          )
        : null;

    const activitiesQuery = supabase
      .from("activities")
      .select(
        `
          id,
          type,
          payload,
          created_at,
          user:users!activities_user_id_fkey(
            id,
            display_name,
            avatar_url
          )
        `,
      )
      .order("created_at", { ascending: false })
      .limit(ACTIVITY_LIMIT);

    if (audienceIds?.length) {
      activitiesQuery.in("user_id", audienceIds);
    }

    const friendsBooksQuery = supabase
      .from("user_books")
      .select(
        `
          id,
          status,
          rating,
          updated_at,
          book:books(
            id,
            title,
            author,
            cover_url,
            average_rating
          ),
          user:users!user_books_user_id_fkey(
            id,
            display_name,
            avatar_url
          )
        `,
      )
      .order("updated_at", { ascending: false })
      .limit(FRIENDS_BOOKS_LIMIT);

    if (audienceIds?.length) {
      friendsBooksQuery.in("user_id", audienceIds);
    }

    const recommendationsQuery = supabase
      .from("recommendations")
      .select(
        `
          id,
          source,
          score,
          metadata,
          user_id,
          book:books(
            id,
            title,
            author,
            cover_url
          )
        `,
      )
      .order("score", { ascending: false })
      .limit(RECOMMENDATIONS_LIMIT);

    if (viewerId) {
      recommendationsQuery.eq("user_id", viewerId);
    }

    const [activities, friendsBooks, recommendations] = await Promise.all([
      activitiesQuery,
      friendsBooksQuery,
      recommendationsQuery,
    ]);

    const recommendationBookIds =
      recommendations.data
        ?.map((item) => {
          const book = Array.isArray(item.book) ? item.book[0] : item.book;
          return book?.id ?? null;
        })
        .filter((id): id is string => Boolean(id)) ?? [];

    let viewerReadlistBooks = new Set<string>();
    if (viewerId && recommendationBookIds.length > 0) {
      const { data: viewerEntries } = await supabase
        .from("user_books")
        .select("book_id")
        .eq("user_id", viewerId)
        .in("book_id", recommendationBookIds);
      viewerReadlistBooks = new Set(
        viewerEntries?.map((entry) => entry.book_id ?? "").filter(Boolean),
      );
    }

    const friendContextByBook = new Map<
      string,
      { names: string[]; count: number; highlights: string[] }
    >();
    if (followingIds.length > 0 && recommendationBookIds.length > 0) {
      const { data: friendEntries } = await supabase
        .from("user_books")
        .select(
          `
            book_id,
            status,
            user:users!user_books_user_id_fkey(
              id,
              display_name
            )
          `,
        )
        .in("user_id", followingIds)
        .in("book_id", recommendationBookIds);

      friendEntries?.forEach((entry) => {
        const bookId = entry.book_id;
        if (!bookId) {
          return;
        }
        const friendName = Array.isArray(entry.user)
          ? entry.user[0]?.display_name
          : entry.user?.display_name;
        if (!friendName) {
          return;
        }
        const statusLabel =
          entry.status === "finished"
            ? `${friendName} l’a terminé`
            : entry.status === "reading"
              ? `${friendName} est en cours de lecture`
              : `${friendName} l’a ajouté à sa liste`;
        const existing = friendContextByBook.get(bookId);
        if (existing) {
          existing.names.push(friendName);
          existing.count += 1;
          if (existing.highlights.length < 3) {
            existing.highlights.push(statusLabel);
          }
        } else {
          friendContextByBook.set(bookId, {
            names: [friendName],
            count: 1,
            highlights: [statusLabel],
          });
        }
      });
    }

    const tagsByBook = new Map<string, string[]>();
    if (recommendationBookIds.length > 0) {
      const { data: tagRelations } = await supabase
        .from("book_tags")
        .select(
          `
            book_id,
            tag:tags(name)
          `,
        )
        .in("book_id", recommendationBookIds);

      tagRelations?.forEach((relation) => {
        const bookId = relation.book_id;
        const tagName = relation.tag?.name;
        if (!bookId || !tagName) {
          return;
        }
        const existing = tagsByBook.get(bookId);
        if (existing) {
          existing.push(tagName);
        } else {
          tagsByBook.set(bookId, [tagName]);
        }
      });
    }

    const formattedActivities: FeedActivity[] =
      activities.data?.map((item) => {
        const user = Array.isArray(item.user) ? item.user[0] : item.user;

        return {
          id: item.id,
          type: item.type,
          userName: user?.display_name ?? "Lectrice anonyme",
          userAvatarUrl: user?.avatar_url ?? null,
          bookTitle: item.payload?.book_title ?? null,
          note:
            item.payload?.note ??
            item.payload?.review_snippet ??
            item.payload?.status_note ??
            null,
          rating: item.payload?.rating ?? null,
          occurredAt: item.created_at,
        };
      }) ?? [];

    const formattedFriendsBooks: FeedFriendBook[] =
      friendsBooks.data?.map((item) => {
        const user = Array.isArray(item.user) ? item.user[0] : item.user;
        const book = Array.isArray(item.book) ? item.book[0] : item.book;

        return {
          id: item.id,
          bookId: book?.id ?? item.id,
          title: book?.title ?? "Livre surprise",
          author: book?.author ?? "Autrice inconnue",
          coverUrl: book?.cover_url ?? null,
          averageRating: book?.average_rating ?? null,
          status: item.status,
          updatedAt: item.updated_at,
          readerName: user?.display_name ?? "Lectrice anonyme",
          readerAvatarUrl: user?.avatar_url ?? null,
        };
      }) ?? [];

    const formattedRecommendations: FeedRecommendation[] =
      recommendations.data?.map((item) => {
        const book = Array.isArray(item.book) ? item.book[0] : item.book;
        const friendContext = book?.id
          ? friendContextByBook.get(book.id)
          : undefined;
        const tags = book?.id ? tagsByBook.get(book.id) ?? [] : [];

        return {
          id: item.id,
          bookId: book?.id ?? item.id,
          title: book?.title ?? "Suggestion mystère",
          author: book?.author ?? "Autrice inconnue",
          coverUrl: book?.cover_url ?? null,
          reason:
            item.metadata?.reason ??
            item.metadata?.explanation ??
            item.metadata?.match ??
            null,
          source: item.source,
          score: Number(item.score ?? 0),
          friendNames: friendContext?.names ?? [],
          friendCount: friendContext?.count ?? 0,
          viewerHasInReadlist: book?.id
            ? viewerReadlistBooks.has(book.id)
            : false,
          friendHighlights: friendContext?.highlights ?? [],
          tags: tags.slice(0, 5),
        };
      }) ?? [];

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

