import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import type {
  FeedActivity,
  FeedFriendBook,
  FeedRecommendation,
} from "@/features/feed/types";
import { getCurrentSession } from "@/lib/auth/session";

type SupabaseUser = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

type SupabaseActivity = {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
  user?: SupabaseUser | SupabaseUser[] | null;
};

type SupabaseFriendBook = {
  id: string;
  status: "to_read" | "reading" | "finished";
  rating: number | null;
  updated_at: string;
  book?:
    | {
        id: string;
        title: string;
        author: string;
        cover_url: string | null;
        average_rating: number | null;
      }
    | Array<{
        id: string;
        title: string;
        author: string;
        cover_url: string | null;
        average_rating: number | null;
      }>
    | null;
  user?: SupabaseUser | SupabaseUser[] | null;
};

type SupabaseRecommendation = {
  id: string;
  source: string;
  score: number | null;
  metadata: Record<string, unknown> | null;
  user_id: string;
  book?:
    | {
        id: string;
        title: string;
        author: string;
        cover_url: string | null;
      }
    | Array<{
        id: string;
        title: string;
        author: string;
        cover_url: string | null;
      }>
    | null;
};

type SupabaseFriendEntry = {
  book_id: string | null;
  status: "to_read" | "reading" | "finished" | null;
  user?:
    | Pick<SupabaseUser, "id" | "display_name">
    | Array<Pick<SupabaseUser, "id" | "display_name">>
    | null;
};

type SupabaseRecommendationTagRelation = {
  book_id: string | null;
  tag?:
    | {
        name: string | null;
      }
    | Array<{
        name: string | null;
      }>
    | null;
};

const getFirstRelation = <T>(
  value: T | T[] | null | undefined,
): T | null => {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
};

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
      activitiesQuery.returns<SupabaseActivity[]>(),
      friendsBooksQuery.returns<SupabaseFriendBook[]>(),
      recommendationsQuery.returns<SupabaseRecommendation[]>(),
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
        .in("book_id", recommendationBookIds)
        .returns<SupabaseFriendEntry[]>();

      friendEntries?.forEach((entry) => {
        const bookId = entry.book_id;
        if (!bookId) {
          return;
        }

        const user = getFirstRelation(entry.user);
        const friendName = user?.display_name ?? null;
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
      const { data: tagRelations } = await supabase
        .from("book_tags")
        .select(
          `
            book_id,
            tag:tags(name)
          `,
        )
        .in("book_id", recommendationBookIds)
        .returns<SupabaseRecommendationTagRelation[]>();

      tagRelations?.forEach((relation) => {
        const bookId = relation.book_id;
        const tag = getFirstRelation(relation.tag);
        const tagName = tag?.name ?? null;
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

    const formattedActivities: FeedActivity[] =
      activities.data?.map((item) => {
        const user = getFirstRelation(item.user);
        const payload = item.payload ?? {};
        const normalizedPayload =
          typeof payload === "object" && payload !== null ? payload : {};

        return {
          id: item.id,
          type: isActivityType(item.type) ? item.type : "list_update",
          userName: user?.display_name ?? "Lectrice anonyme",
          userAvatarUrl: user?.avatar_url ?? null,
          bookTitle:
            (normalizedPayload.book_title as string | null | undefined) ?? null,
          note:
            (normalizedPayload.note as string | null | undefined) ??
            (normalizedPayload.review_snippet as string | null | undefined) ??
            (normalizedPayload.status_note as string | null | undefined) ??
            null,
          rating:
            (normalizedPayload.rating as number | null | undefined) ?? null,
          occurredAt: item.created_at,
        };
      }) ?? [];

    const formattedFriendsBooks: FeedFriendBook[] =
      friendsBooks.data?.map((item) => {
        const user = getFirstRelation(item.user);
        const book = getFirstRelation(item.book);

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
        const book = getFirstRelation(item.book);
        const friendContext = book?.id
          ? friendContextByBook.get(book.id)
          : undefined;
        const tags = book?.id ? tagsByBook.get(book.id) ?? [] : [];

        const metadata = item.metadata ?? {};
        const normalizedMetadata =
          typeof metadata === "object" && metadata !== null ? metadata : {};

        return {
          id: item.id,
          bookId: book?.id ?? item.id,
          title: book?.title ?? "Suggestion mystère",
          author: book?.author ?? "Autrice inconnue",
          coverUrl: book?.cover_url ?? null,
          reason:
            (normalizedMetadata.reason as string | null | undefined) ??
            (normalizedMetadata.explanation as string | null | undefined) ??
            (normalizedMetadata.match as string | null | undefined) ??
            (friendContext
              ? `${friendContext.names.slice(0, 2).join(", ")} l’a recommandé`
              : null),
          source: isRecommendationSource(item.source)
            ? item.source
            : "global",
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

